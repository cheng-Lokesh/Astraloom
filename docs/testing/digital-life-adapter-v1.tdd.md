# Digital-life adapter v1 — scoped TDD evidence

Status: backend functional candidate, not full digital-life/nine-stage acceptance.
No V2 core production, SQL migration or browser page change belongs to this batch.

## RED checkpoints

- `905183c`: model/runtime/source-role tests; real missing production adapter,
  rejected new fields and variant role mismatch observed before implementation.
- `7db5af8`: actual Start HTTP handler and client tests; legal rules returned 422
  and client omitted rules before the shared strict request contract.
- `b35e801`: readonly context helper/HTTP tests; target modules absent before
  implementation, including current-chain and owner isolation cases.
- `3242498`: real Graph core-to-variant edge regression. Targeted integration
  command exited 1 with 1 failed / 2 passed: inactive relationship was displayed.
  Fix only filters result relationships using active World mappings, retaining
  both source edges and stable `relation-2` in the frozen input snapshot.

## GREEN scope

The 12-file targeted command covers model, runtime integration, Start service,
readonly context helper/route, Start rules route/client, existing formal runtime,
result projection, existing client/M2.2 result-client and sandbox-runs routes.
Before the last relation regression it passed 107 tests (exit 0). The final
rerun passed 12 files / 108 tests (exit 0, 27.52s); `npm run type-check` also
exited 0. No full-suite, database or build evidence is claimed here; the parent
coordinates the final combined UI/build and independent acceptance gates.

## Boundary

This batch enables explicit confirmed rules and isolated strategy paths through
canonical V2 transitions. Stored background is not automatically causal. NPC
responses are simulation assumptions, not real intention. No inferred policy,
dynamic pressure evolution, cross-condition frequency, hidden AI inference or
Symbolic-driven causal change is implemented. The UI and complete end-user flow
are a separate coordinated module; new-model read validation is strict while
historical bundles remain `not_recorded` compatible.
