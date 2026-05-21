# Writer Persistence External Approval Archive Checklist

## Purpose

This checklist defines how future human approval artifacts should be named, checked, redacted, retained, and cross-referenced outside the app.

It is not an approval archive. It does not upload, read, hash, store, or accept external artifacts.

## Surfaces

- Page: `/server-writers/persistence-external-approval-archive`
- API: `/api/system-writers/persistence-external-approval-archive`
- Source: `src/lib/server-writers/persistence-external-approval-archive.ts`
- Types: `src/types/writer-persistence-external-approval-archive.ts`
- Source runbook: `/server-writers/persistence-human-go-no-go`

## Required State

`GET /api/system-writers/persistence-external-approval-archive` must return:

- `safeMode=true`
- `readOnly=true`
- `archiveChecklistMode=persistence_adapter_external_approval_archive_checklist_only`
- `archiveChecklistReady=true`
- `archiveChecklistOnly=true`
- `sourceHumanGoNoGoRunbookReady=true`
- `sourceHumanGoNoGoRunbookOnly=true`
- `sourceReleaseStillBlocked=true`
- `sourceHumanDecisionCollectionExternal=true`
- `externalApprovalArchiveRequired=true`
- `externalApprovalStorageExternal=true`
- `archiveArtifactStored=false`
- `archiveArtifactUploaded=false`
- `archiveArtifactRead=false`
- `archiveArtifactHashCreated=false`
- `archiveIndexPersisted=false`
- `archiveCompletenessAccepted=false`
- `externalApprovalArchiveAccepted=false`
- `implementationAuthorizationGranted=false`
- `implementationAuthorized=false`
- `allRuntimeEffectsBlocked=true`

The checklist currently exposes 10 archive items:

- 2 hard stops inherited from the human go/no-go runbook
- 8 manual archive-design checks

## Archive Scope

The future external archive must eventually define:

- archive identity manifest
- artifact naming convention
- owner metadata requirements
- blocker and runbook cross-references
- evidence redaction policy
- archive completeness checks
- retention and access control rules
- tamper-evidence checksum expectations
- final hard-stop state

## Forbidden Effects

This checklist must never:

- store approval artifacts
- upload approval artifacts
- read external artifacts
- hash external artifacts
- persist archive indexes
- mark archives complete
- accept external approval archives
- grant implementation authorization
- record human decisions
- accept human decisions
- store decision artifacts
- record go decisions
- grant release approval
- enable feature flags
- approve deployment
- approve or run production writers
- collect signatures
- record owner approval
- accept patch review
- review, generate, or apply patches
- create implementation files
- modify implementation files
- create tests
- run tests as approval
- run git
- create branches
- create pull requests
- create adapter code
- create privileged clients
- read privileged secrets
- open transactions
- write rows
- write audit rows
- reserve idempotency keys
- write idempotency rows
- write compensation rows
- create migration files
- apply SQL
- create tables
- enable writers
- call AI
- call Stripe
- unlock reports

## Probe Contract

`POST /api/system-writers/persistence-external-approval-archive` accepts:

```json
{
  "itemId": "artifact_naming_convention_checklist"
}
```

The response must return `blocked=true`, the selected `itemId`, the archive checklist mode, the selected archive item, and all dangerous runtime flags as `false`.

Invalid bodies, missing `itemId`, or unknown item ids still return `blocked=true` and perform no side effects.

## Next Safe Stage

The implementation authorization remediation plan now exists. The implementation authorization remediation review checklist now exists. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists; the read-only implementation authorization reconsideration final decision packet now exists; the read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe stage is a read-only external final decision archive remediation review no-go packet. It should verify remediation ownership, safe external evidence requirements, reviewer gates, blocked-code resolution paths, and redaction rules while still avoiding app-side preflight acceptance, archive acceptance, approval storage, release decisions, feature flags, deployments, production writer execution, patch acceptance, branch creation, file mutation, tests, privileged clients, transactions, migrations, row writes, AI calls, Stripe calls, and report unlocks.

