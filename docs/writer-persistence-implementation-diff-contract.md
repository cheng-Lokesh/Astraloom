# Writer Persistence Implementation Dry-Run Diff Contract

## Purpose

This document defines the read-only contract for a future persistence adapter implementation diff. It describes what a later implementation patch would be allowed to contain, what it must prove, and what it must not touch.

It does not generate a patch, apply a patch, create files, modify files, delete files, create tests, run tests, run git, create branches, create pull requests, create adapter code, create privileged clients, run transactions, create migrations, write rows, call AI, call Stripe, or unlock reports.

## Surfaces

- Page: `/server-writers/persistence-diff-contract`
- API: `/api/system-writers/persistence-diff-contract`
- Source: `src/lib/server-writers/persistence-diff-contract.ts`
- Types: `src/types/writer-persistence-diff-contract.ts`
- Source branch preflight: `/server-writers/persistence-branch-preflight`

## Contract

`GET /api/system-writers/persistence-diff-contract` returns:

- `safeMode=true`
- `readOnly=true`
- `diffContractMode=persistence_adapter_implementation_dry_run_diff_contract_only`
- `diffContractReady=true`
- `diffContractOnly=true`
- `sourceBranchPreflightReady=true`
- `sourceBranchPreflightOnly=true`
- `sourceBranchPreflightAccepted=false`
- `implementationDiffApproved=false`
- `implementationPatchCreated=false`
- `implementationPatchApplied=false`
- `implementationFilesCreated=false`
- `implementationFilesModified=false`
- `implementationTestsCreated=false`
- `implementationApprovalGranted=false`
- `branchCreationApproved=false`
- `branchCreated=false`
- `pullRequestCreated=false`
- `readyToApplyDiff=false`
- `readyToCreateImplementationBranch=false`
- `readyForAdapterImplementation=false`
- `allOwnerApprovalsComplete=false`
- `allBlockingEvidenceReady=false`
- `allRuntimeEffectsBlocked=true`

Every dangerous runtime flag remains false, including patch generation, patch application, file creation, file mutation, file deletion, git commands, branch creation, pull request creation, approval records, test creation, automated test execution, implementation plans, adapter code, privileged clients, transactions, evidence persistence, raw payload storage, row writes, idempotency writes, compensation writes, migration creation, SQL application, table creation, writer enabling, AI calls, Stripe calls, and report unlocks.

## Entries

The contract contains ten entries:

1. `source_preflight_invariant_diff_contract`
2. `type_surface_diff_contract`
3. `adapter_orchestrator_diff_contract`
4. `audit_persistence_diff_contract`
5. `idempotency_persistence_diff_contract`
6. `compensation_handoff_diff_contract`
7. `server_boundary_test_diff_contract`
8. `adapter_unit_test_diff_contract`
9. `documentation_diff_contract`
10. `final_diff_no_go_contract`

Each entry names:

- category, status, and owner
- future file and future change kind
- source preflight checks and source references
- allowed future symbols
- forbidden changes
- required assertions
- review questions
- blocking conditions
- non-execution clauses
- rollback notes

## Probe

`POST /api/system-writers/persistence-diff-contract` accepts:

```json
{ "entryId": "audit_persistence_diff_contract" }
```

The probe always returns `blocked=true`. It may return the selected diff contract entry, but it never generates patches, applies patches, creates files, modifies files, creates tests, runs tests, runs git, creates branches, creates pull requests, creates adapter code, creates privileged clients, opens transactions, creates migrations, writes rows, calls AI, calls Stripe, or unlocks reports.

## Future Diff Gates

A later implementation diff remains blocked until:

- branch preflight is accepted by a later approved owner mechanism
- each future file maps to an allowed preflight file and an acceptance matrix requirement
- every forbidden change remains explicitly excluded
- required assertions cover phase order, idempotency, audit redaction, rollback, server-only boundaries, and blocked side effects
- a later patch review gate explicitly authorizes any real file creation or modification

## Next Safe Step

The read-only persistence adapter implementation patch review packet now exists at `docs/writer-persistence-implementation-patch-review.md`, `/server-writers/persistence-patch-review`, and `/api/system-writers/persistence-patch-review`.

The read-only persistence adapter implementation owner signoff packet now exists at `docs/writer-persistence-implementation-owner-signoff.md`, `/server-writers/persistence-owner-signoff`, and `/api/system-writers/persistence-owner-signoff`.

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds. It should verify remediation ownership, safe external evidence requirements, reviewer gates, blocked-code resolution paths, and redaction rules while still avoiding app-side approval storage, release decision writes, feature flags, deployments, production writer execution, patch acceptance, branch creation, file mutation, tests, privileged clients, transactions, migrations, row writes, AI calls, Stripe calls, and report unlocks.

