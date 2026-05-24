# Stage72 Writer Persistence Remediation Plan

Stage72 defines the read-only remediation path after the Stage71 remediation review no-go packet.

It maps each Stage71 no-go item to one safe remediation plan item. It does not accept remediation, record remediation evidence, resolve blockers, create tickets, deny authorization, grant authorization, create branches, create files, create migrations, open transactions, create service-role clients, call AI, call Stripe, deploy, or unlock reports.

## Routes

- Public page: `/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation`
- Public API: `/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation`
- Internal page: `/server-writers/p72-remediation`
- Internal API: `/api/system-writers/p72-remediation`

The public routes are exposed through `next.config.ts` rewrites so the physical App Router path stays short enough for Windows builds.

## Source

- Source stage: Stage71 remediation review no-go packet.
- Source API: `/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go`
- Expected source item count: `10`
- Expected external evidence no-go count: `5`
- Expected manual reviewer no-go count: `5`
- Expected still-blocked count: `10`

## Payload Contract

Required true flags:

- `externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanReady`
- `externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationPlanOnly`
- `sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketReady`
- `sourceExternalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoPacketOnly`
- `allRuntimeEffectsBlocked`

Required false flags:

- `externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationAccepted`
- `externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationRecorded`
- `externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRemediationStatesAccepted`
- `externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoAccepted`
- `externalFinalDecisionArchiveRemediationReviewNoGoReconciliationRemediationReviewNoGoReconciliationNoGoRemediationReviewNoGoRecorded`
- `authorizationReconsiderationFinalDecisionAccepted`
- `implementationAuthorizationGranted`
- `implementationAuthorized`
- `readyForAdapterImplementation`
- `wouldCreateServiceRoleClient`
- `wouldRunTransaction`
- `wouldWriteRows`

Required counts:

- `remediationItemCount=10`
- `externalEvidenceRemediationRequiredCount=5`
- `manualReviewerRemediationRequiredCount=5`
- `remediationStillBlockedCount=10`
- `sourceNoGoItemCount=10`
- `sourceExternalEvidenceReviewNoGoCount=5`
- `sourceManualReviewerReviewNoGoCount=5`
- `sourceRemediationReviewStillBlockedCount=10`

## Probe Behavior

`POST` accepts `{ "itemId": "<stage72RemediationItem.id>" }` or `{ "remediationItemId": "<stage72RemediationItem.id>" }`.

The probe may return a selected remediation item, but must always keep:

- `blocked=true`
- `wouldCreateServiceRoleClient=false`
- `wouldRunTransaction=false`
- `wouldWriteRows=false`
- remediation acceptance flags false

## QA

Use the full guard suite when the local server is stopped:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/qa-stage.ps1
```

Use Stage72 API invariants while a local Next server is running:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/qa-stage.ps1 -Stage 72 -SkipBuild
```

## Next Stage

Stage73 should be a read-only remediation review checklist over the Stage72 plan. It may inspect evidence labels, manual reviewer readiness, redaction, rejection triggers, and future gates, but it must not accept remediation or unlock implementation.
