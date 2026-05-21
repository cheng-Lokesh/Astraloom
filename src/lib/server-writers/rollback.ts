import "server-only";

import { buildWriterIdempotencyModel } from "@/lib/server-writers/idempotency";
import type {
  WriterRollbackContract,
  WriterRollbackField,
  WriterRollbackModelPayload,
  WriterRollbackStrategy,
  WriterRollbackTrigger,
} from "@/types/system-writer-rollback";
import type { SystemWriterContractId } from "@/types/system-writer-contract";

const futureTableName = "writer_compensation_events" as const;

const baseFields: WriterRollbackField[] = [
  {
    name: "compensationEventId",
    required: true,
    detail: "Unique id for the future compensation event, generated server-side.",
  },
  {
    name: "contractId",
    required: true,
    detail: "Original writer contract that produced the artifact or state.",
  },
  {
    name: "strategy",
    required: true,
    detail: "Compensation strategy such as supersede, append event, replacement report, or reversal event.",
  },
  {
    name: "trigger",
    required: true,
    detail: "Reason the compensation flow started, such as safety block, duplicate operation, or refund.",
  },
  {
    name: "originalResultRef",
    required: true,
    detail: "Reference to the original generated/payment/consent result. Do not copy raw private payloads.",
  },
  {
    name: "replacementResultRef",
    required: false,
    detail: "Reference to a replacement or superseding object when one exists.",
  },
  {
    name: "idempotencyKey",
    required: true,
    detail: "Original or compensation idempotency key used to prevent duplicate rollback actions.",
  },
  {
    name: "auditEventId",
    required: true,
    detail: "Audit event recording the compensation decision.",
  },
  {
    name: "operatorReviewId",
    required: false,
    detail: "Manual review reference for high-risk or paid operations.",
  },
  {
    name: "createdAt",
    required: true,
    detail: "Server timestamp when the compensation event is created.",
  },
];

const strategyByContract: Record<SystemWriterContractId, WriterRollbackStrategy> =
  {
    agent_profile_generation: "soft_delete_generated",
    relation_edge_generation: "supersede_version",
    simulation_run_create: "cancel_queued_run",
    event_tick_append: "append_compensating_event",
    claim_generation: "supersede_version",
    report_generation: "replacement_report",
    payment_entitlement_record: "payment_reversal_event",
    consent_event_record: "consent_revocation_event",
  };

const triggersByContract: Record<SystemWriterContractId, WriterRollbackTrigger[]> =
  {
    agent_profile_generation: [
      "bad_generation",
      "safety_block_after_generation",
      "operator_review",
    ],
    relation_edge_generation: [
      "bad_generation",
      "duplicate_operation",
      "operator_review",
    ],
    simulation_run_create: [
      "duplicate_operation",
      "safety_block_after_generation",
      "operator_review",
    ],
    event_tick_append: [
      "bad_generation",
      "duplicate_operation",
      "safety_block_after_generation",
      "operator_review",
    ],
    claim_generation: [
      "bad_generation",
      "safety_block_after_generation",
      "operator_review",
    ],
    report_generation: [
      "bad_generation",
      "safety_block_after_generation",
      "operator_review",
    ],
    payment_entitlement_record: [
      "payment_refund_or_dispute",
      "duplicate_operation",
      "operator_review",
    ],
    consent_event_record: ["consent_revoked", "operator_review"],
  };

function compensationRuleFor(contractId: SystemWriterContractId) {
  if (contractId === "agent_profile_generation") {
    return "Mark generated profile set as superseded or soft-deleted; create a replacement generation version if needed.";
  }

  if (contractId === "relation_edge_generation") {
    return "Supersede the entire generated edge set by seedContextId/version; do not patch individual edge weights manually.";
  }

  if (contractId === "simulation_run_create") {
    return "Cancel only queued runs before event ticks exist; otherwise create a new run version and keep history.";
  }

  if (contractId === "event_tick_append") {
    return "Append a compensating event or mark the run invalid; do not reorder or delete historical ticks.";
  }

  if (contractId === "claim_generation") {
    return "Supersede claim set by schema/report version and keep evidence references traceable.";
  }

  if (contractId === "report_generation") {
    return "Create a replacement report version and preserve locked/unlocked history server-side.";
  }

  if (contractId === "payment_entitlement_record") {
    return "Use Stripe refund/dispute events and append a compensating entitlement state; never delete payment history.";
  }

  return "Append a consent revocation or update event; never delete previous consent history.";
}

function forbiddenActionsFor(contractId: SystemWriterContractId) {
  const shared = [
    "Do not hard-delete audit evidence.",
    "Do not mutate rows from browser code.",
    "Do not erase idempotency history.",
  ];

  if (contractId === "payment_entitlement_record") {
    return [
      "Do not delete payment rows.",
      "Do not grant or revoke entitlement from the browser.",
      "Do not bypass Stripe refund/dispute evidence.",
      ...shared,
    ];
  }

  if (contractId === "consent_event_record") {
    return [
      "Do not delete consent history.",
      "Do not rewrite previous policy decisions.",
      "Do not hide revocation lineage.",
      ...shared,
    ];
  }

  if (contractId === "event_tick_append") {
    return [
      "Do not reorder event ticks.",
      "Do not delete generated event history.",
      "Do not silently patch old tick content.",
      ...shared,
    ];
  }

  return [
    "Do not rewrite generated output in place.",
    "Do not unlock reports from the browser.",
    "Do not patch graph weights manually.",
    ...shared,
  ];
}

function historyRuleFor(contractId: SystemWriterContractId) {
  if (contractId === "payment_entitlement_record") {
    return "Payment state must be compensated through append-only financial events and support/refund records.";
  }

  if (contractId === "consent_event_record") {
    return "Consent history is append-only; revocation creates a new event and leaves earlier events visible to audit.";
  }

  if (contractId === "event_tick_append") {
    return "Simulation event history is ordered and append-only; invalidation or compensation must be represented as a later event.";
  }

  return "Generated artifacts should be superseded by version or soft-deleted only after audit and support review.";
}

function categoryFor(contractId: SystemWriterContractId) {
  if (contractId === "payment_entitlement_record") {
    return "payments" as const;
  }

  if (contractId === "consent_event_record") {
    return "compliance" as const;
  }

  if (contractId === "claim_generation" || contractId === "report_generation") {
    return "reporting" as const;
  }

  if (contractId === "simulation_run_create" || contractId === "event_tick_append") {
    return "simulation" as const;
  }

  return "agent_ecology" as const;
}

function buildContract(
  contractId: SystemWriterContractId,
  affectedTables: string[],
): WriterRollbackContract {
  return {
    contractId,
    category: categoryFor(contractId),
    affectedTables,
    strategy: strategyByContract[contractId],
    allowedTriggers: triggersByContract[contractId],
    forbiddenActions: forbiddenActionsFor(contractId),
    compensationRule: compensationRuleFor(contractId),
    historyRule: historyRuleFor(contractId),
    operatorReviewRule:
      "Future production compensation must create or reference an operator/support review record before high-impact history changes.",
    sampleRecord: {
      compensationEventId: `comp:${contractId}:example`,
      contractId,
      strategy: strategyByContract[contractId],
      trigger: triggersByContract[contractId][0],
      originalResultRef: `${contractId}:original-result-ref`,
      replacementResultRef: null,
      idempotencyKey: `${contractId}:rollback:example`,
      auditEventId: `audit:${contractId}:rollback-example`,
      wouldPersist: false,
      wouldMutateHistory: false,
    },
  };
}

export function buildWriterRollbackModel(): WriterRollbackModelPayload {
  const idempotency = buildWriterIdempotencyModel();

  return {
    safeMode: true,
    readOnly: true,
    wouldWriteCompensationRows: false,
    wouldMutateHistory: false,
    migrationIncluded: false,
    futureTableName,
    globalRules: [
      "Current implementation defines rollback contracts only; it does not create a migration or write compensation rows.",
      "Rollback must prefer append-only compensation, version supersession, or soft deletion over destructive mutation.",
      "Payment and consent history must never be deleted.",
      "Simulation ticks must not be reordered or silently patched.",
      "Browser code must not perform rollback, compensation, report unlock, entitlement reversal, or consent mutation.",
      "Every future compensation event must reference audit and idempotency records.",
      "High-impact compensation requires operator/support review before production rollout.",
    ],
    baseFields,
    contracts: idempotency.contracts.map((contract) =>
      buildContract(contract.contractId, contract.targetTables),
    ),
  };
}
