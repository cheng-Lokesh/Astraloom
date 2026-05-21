# Writer Persistence Implementation Branch Preflight

## Purpose

This document defines the read-only preflight checklist that must exist before any future persistence adapter implementation branch can be created. It is a planning and evidence surface only.

It does not create a branch, run git, create a pull request, modify files, record owner approvals, create implementation plans, create adapter code, read privileged secrets, create service-role clients, run transactions, write rows, create migrations, call AI, call Stripe, or unlock reports.

## Surfaces

- Page: `/server-writers/persistence-branch-preflight`
- API: `/api/system-writers/persistence-branch-preflight`
- Source: `src/lib/server-writers/persistence-branch-preflight.ts`
- Types: `src/types/writer-persistence-branch-preflight.ts`
- Source approval packet: `/server-writers/persistence-approval`

## Contract

`GET /api/system-writers/persistence-branch-preflight` returns:

- `safeMode=true`
- `readOnly=true`
- `branchPreflightMode=persistence_adapter_implementation_branch_preflight_checklist_only`
- `branchPreflightReady=true`
- `branchPreflightOnly=true`
- `sourceApprovalPacketReady=true`
- `sourceApprovalPacketOnly=true`
- `sourceApprovalPacketAccepted=false`
- `implementationApprovalGranted=false`
- `implementationBranchApproved=false`
- `branchCreationApproved=false`
- `branchCreated=false`
- `implementationPlanApproved=false`
- `readyToCreateImplementationBranch=false`
- `readyForAdapterImplementation=false`
- `allOwnerApprovalsComplete=false`
- `allBlockingEvidenceReady=false`
- `allRuntimeEffectsBlocked=true`

Every dangerous runtime flag remains false, including git commands, branch creation, checkout, pull requests, file mutation, approval records, test creation, automated test execution, implementation plans, adapter code, privileged clients, transactions, evidence persistence, raw payload storage, row writes, idempotency writes, compensation writes, migration creation, SQL application, table creation, writer enabling, AI calls, Stripe calls, and report unlocks.

## Checks

The checklist contains ten items:

1. `approval_packet_route_invariant_preflight`
2. `allowed_file_scope_preflight`
3. `forbidden_file_scope_preflight`
4. `local_command_preflight`
5. `security_boundary_preflight`
6. `qa_test_preflight`
7. `migration_boundary_preflight`
8. `rollback_checkpoint_preflight`
9. `owner_handoff_preflight`
10. `final_branch_no_go_preflight`

Each check names:

- category, status, and owner
- source approval item ids and source references
- allowed future files
- forbidden future files
- local command references
- rollback checkpoints
- owner handoff rules
- preflight questions
- blocking conditions
- non-execution clauses

## Probe

`POST /api/system-writers/persistence-branch-preflight` accepts:

```json
{ "checkId": "security_boundary_preflight" }
```

The probe always returns `blocked=true`. It may return the selected checklist item, but it never runs git, creates a branch, creates a pull request, modifies files, records approvals, creates implementation plans, creates adapter code, creates privileged clients, opens transactions, creates migrations, writes rows, calls AI, calls Stripe, or unlocks reports.

## Future Branch Creation Gates

A later implementation branch remains blocked until:

- founder, backend, security, QA, and operator approvals are recorded through a future approved mechanism
- allowed and forbidden file scope is accepted
- local verification commands are confirmed to be credential-free and non-mutating
- rollback checkpoints and owner handoff rules are explicit
- migration, service-role, AI, Stripe, payment, and report unlock paths are split into separate reviewed gates if needed
- a later task explicitly authorizes branch creation

## Next Safe Step

The read-only persistence adapter implementation authorization remediation plan now exists at `docs/writer-persistence-implementation-authorization-remediation-plan.md`, `/server-writers/persistence-authorization-remediation`, and `/api/system-writers/persistence-authorization-remediation`. The remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-remediation-review-checklist.md`, `/server-writers/persistence-authorization-remediation-review`, and `/api/system-writers/persistence-authorization-remediation-review`. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review-no-go`. The read-only implementation authorization reconsideration final decision packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md`, `/server-writers/persistence-authorization-reconsideration-final-decision`, and `/api/system-writers/persistence-authorization-reconsideration-final-decision`. The read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe step is a read-only external final decision archive remediation review no-go packet before any real persistence implementation proceeds. It should verify remediation ownership, safe external evidence requirements, reviewer gates, blocked-code resolution paths, and redaction rules while still avoiding app-side approval storage, release decision writes, feature flags, deployments, production writer execution, patch acceptance, branch creation, file mutation, tests, privileged clients, transactions, migrations, row writes, AI calls, Stripe calls, and report unlocks.

