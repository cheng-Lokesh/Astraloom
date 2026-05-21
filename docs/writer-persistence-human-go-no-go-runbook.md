# Writer Persistence Human Go/no-go Runbook

## Purpose

This runbook is the human decision layer after the release no-go packet. It turns unresolved founder, security, backend, QA, migration, operator, data-protection, product-scope, and final release questions into an explicit external review checklist.

It is not an approval collector. It does not store decisions.

## Surfaces

- Page: `/server-writers/persistence-human-go-no-go`
- API: `/api/system-writers/persistence-human-go-no-go`
- Source: `src/lib/server-writers/persistence-human-go-no-go.ts`
- Types: `src/types/writer-persistence-human-go-no-go.ts`
- Source packet: `/server-writers/persistence-release-no-go`

## Required State

`GET /api/system-writers/persistence-human-go-no-go` must return:

- `safeMode=true`
- `readOnly=true`
- `humanGoNoGoMode=persistence_adapter_human_go_no_go_runbook_only`
- `humanGoNoGoRunbookReady=true`
- `humanGoNoGoRunbookOnly=true`
- `sourceReleaseNoGoPacketReady=true`
- `sourceReleaseNoGoPacketOnly=true`
- `sourceReleaseBlocked=true`
- `releaseStillBlocked=true`
- `humanDecisionCollectionExternal=true`
- `externalArtifactArchiveRequired=true`
- `humanDecisionRecorded=false`
- `humanDecisionAccepted=false`
- `releaseNoGoAccepted=false`
- `releaseGoDecisionRecorded=false`
- `releaseApproved=false`
- `releaseApprovalGranted=false`
- `featureFlagEnabled=false`
- `deploymentApproved=false`
- `productionWriterApproved=false`
- `allRuntimeEffectsBlocked=true`

The runbook currently exposes 10 steps:

- 2 steps blocked directly by the source release no-go hard stop
- 8 manual owner-lane decisions

## Required Human Lanes

The external decision archive must eventually cover:

- founder scope decision
- security decision
- backend phase-order decision
- QA negative-test evidence decision
- migration decision
- operator compensation decision
- data-protection decision
- product-scope decision
- final release hard stop

## External Artifact Rules

Human decisions must be captured outside this app until a separate approved persistence model exists.

External artifacts must include:

- owner
- lane
- decision
- timestamp
- referenced blocker ids
- safe evidence refs

External artifacts must exclude:

- secrets
- tokens
- raw private prompts
- private narratives
- provider payloads
- private debug bodies
- credential-like values

Route responses, screenshots of route responses, and browser state are not valid release approval artifacts.

## Forbidden Effects

This runbook must never:

- record human decisions
- accept human decisions
- store decision artifacts
- accept release no-go as approval
- record a go decision
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
- create a privileged client
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

`POST /api/system-writers/persistence-human-go-no-go` accepts:

```json
{
  "stepId": "security_decision_runbook"
}
```

The response must return `blocked=true`, the selected `stepId`, the human go/no-go mode, the selected runbook step, and all dangerous runtime flags as `false`.

Invalid bodies, missing `stepId`, or unknown step ids still return `blocked=true` and perform no side effects.

## Next Safe Stage

The implementation authorization readiness checklist now exists. The implementation authorization remediation plan now exists. The implementation authorization remediation review checklist now exists. The remediation review no-go packet now exists at `docs/writer-persistence-implementation-authorization-remediation-review-no-go-packet.md`, `/server-writers/persistence-authorization-remediation-review-no-go`, and `/api/system-writers/persistence-authorization-remediation-review-no-go`. The read-only implementation authorization reconsideration preflight checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-preflight-checklist.md`, `/server-writers/persistence-authorization-reconsideration-preflight`, and `/api/system-writers/persistence-authorization-reconsideration-preflight`. The read-only implementation authorization reconsideration no-go packet now exists at `docs/writer-persistence-implementation-authorization-reconsideration-no-go-packet.md`, `/server-writers/persistence-authorization-reconsideration-no-go`, and `/api/system-writers/persistence-authorization-reconsideration-no-go`. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists; the read-only implementation authorization reconsideration final decision packet now exists; the read-only external final decision archive checklist, archive no-go packet, and archive remediation plan now exist; the next safe stage is a read-only external final decision archive remediation review no-go packet. It should summarize why review still cannot unlock implementation authorization while still avoiding app-side preflight acceptance, no-go acceptance, archive acceptance, authorization records, approval storage, release decisions, feature flags, deployments, production writer execution, patch acceptance, branch creation, file mutation, tests, privileged clients, transactions, migrations, row writes, AI calls, Stripe calls, and report unlocks.

