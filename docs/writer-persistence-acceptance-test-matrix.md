# Writer Persistence Acceptance Test Matrix

This document describes the read-only acceptance test matrix for the future audit/idempotency persistence adapter.

It is not executable tests and not implementation approval. It does not create test files, run tests, create an approval packet, create implementation branches, create adapter code, create service-role clients, run transactions, create migrations, write rows, call AI, call Stripe, grant entitlement, or unlock reports.

## Surface

- Page: `/server-writers/persistence-acceptance`
- API: `/api/system-writers/persistence-acceptance`
- Source: `src/lib/server-writers/persistence-acceptance-tests.ts`
- Types: `src/types/writer-persistence-acceptance-test-matrix.ts`
- Source proposal: `/api/system-writers/persistence-proposal`

## Required Flags

The API must keep these values:

- `matrixMode=persistence_adapter_acceptance_test_matrix_only`
- `acceptanceMatrixReady=true`
- `acceptanceMatrixOnly=true`
- `sourceProposalScaffoldReady=true`
- `sourceProposalScaffoldOnly=true`
- `sourceProposalAccepted=false`
- `implementationProposalAllowed=false`
- `implementationAcceptanceApproved=false`
- `implementationApprovalPacketAllowed=false`
- `readyForImplementationApprovalPacket=false`
- `readyToCreateImplementationBranch=false`
- `readyForAdapterImplementation=false`
- `schemaVerified=false`
- `adapterImplemented=false`
- `adapterImplementationApproved=false`
- `adapterImplementationAllowed=false`
- `implementationReviewComplete=false`
- `allBlockingEvidenceReady=false`
- `allRuntimeEffectsBlocked=true`
- `wouldCreateTestFiles=false`
- `wouldRunAutomatedTests=false`
- `wouldCreateImplementationPlan=false`
- `wouldCreateImplementationBranch=false`
- `wouldCreateAdapterCode=false`
- `wouldImportRealWriterImplementation=false`
- `wouldRunTransaction=false`
- `wouldCreateServiceRoleClient=false`
- `wouldReadServiceRoleSecret=false`
- `wouldPersistEvidence=false`
- `wouldStoreRawPayload=false`
- `wouldStoreSecrets=false`
- `wouldWriteRows=false`
- `wouldWriteAuditRows=false`
- `wouldReserveIdempotencyKeys=false`
- `wouldWriteIdempotencyRows=false`
- `wouldWriteCompensationRows=false`
- `wouldCreateMigrationFile=false`
- `wouldApplyMigration=false`
- `wouldCreateTables=false`
- `wouldEnableWriters=false`
- `wouldCallAi=false`
- `wouldCallStripe=false`
- `wouldUnlockReports=false`

## Matrix Rows

The matrix defines future acceptance coverage for:

1. Proposal route invariants.
2. Scope boundary acceptance.
3. Server-only boundary acceptance.
4. Phase order acceptance.
5. Idempotency replay and conflict acceptance.
6. Audit redaction acceptance.
7. Rollback compensation acceptance.
8. Rollout and observability acceptance.
9. Final no-go acceptance.

Each row includes:

- Future test type.
- Owner.
- Intent.
- Source proposal section IDs.
- Source references.
- Future test files and command text.
- Acceptance criteria.
- Required evidence.
- Expected blocked flags.
- Actions forbidden in the current matrix stage.

## Probe Behavior

`POST /api/system-writers/persistence-acceptance` accepts `{ "testId": "..." }`.

Every probe returns `blocked=true`. A known test ID returns that matrix row. Invalid input or an unknown test ID returns the full matrix. No probe creates test files, runs tests, creates an approval packet, creates a branch, creates adapter code, creates a service-role client, runs a transaction, creates a migration, writes rows, calls AI, calls Stripe, grants entitlement, or unlocks reports.

## Next Safe Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds. It should verify remediation ownership, safe external evidence requirements, reviewer gates, blocked-code resolution paths, and redaction rules while still avoiding app-side approval storage, release decision writes, feature flags, deployments, production writer execution, patch acceptance, branch creation, file mutation, tests, privileged clients, transactions, migrations, row writes, AI calls, Stripe calls, and report unlocks.

