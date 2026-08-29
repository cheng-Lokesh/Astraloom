# Phase 4 decision record

## DR-M1-001: Formal account sandbox loop is the only M1 milestone

Accepted on 2026-08-29. M1 connects the already persisted Phase 2/3 account
chain to formal Track A execution, Result, History, Feedback, and next-run
calibration. It does not reopen Track B, real AI, payment, admin/writer cleanup,
or broad visual redesign.

## DR-M1-002: Existing production tables remain canonical

The initial migration already defines `simulations`, `simulation_ticks`,
`event_logs`, `claims`, `reports`, and `feedback_logs`. Phase 4 extends and
hardens those tables rather than creating a parallel run bundle, event ledger,
report store, feedback store, or History system.

Stage 8 provides validated job and canonical Stage 2-7 bundle semantics but is
an in-memory boundary. Phase 4 supplies a single persistence/runtime adapter;
it does not copy or rewrite Stage 2-8 engines.

## DR-M1-003: Destiny uses bounded fusion at the Phase 4 product boundary

The earlier V2 direction isolated legacy destiny/birth data from Evidence,
World State, causal transitions, trajectory frequency, confidence, and Claims.
The newer Phase 4 product-owner decision replaces absolute product-level
Isolation with bounded fusion for M1:

- Destiny remains a `Symbolic Lens`, never Reality or Evidence.
- It cannot change World State, Action Proposal validity, safety, simulation
  frequency, Claim confidence, or the direction/strength of a conclusion.
- It may be frozen as an explicitly labelled, versioned symbolic snapshot and
  may contribute bounded narrative framing or hypothesis context.
- A Claim cannot cite Symbolic Lens as its sole evidence basis.
- Omitting or changing symbolic input while all causal inputs are fixed must not
  change deterministic causal outputs.

This record is the Phase 4 scope-specific decision. It does not rewrite
`src/lib/v2/**` or retroactively mutate historical V1/V2 artifacts.

## DR-M1-004: Authenticated SECURITY INVOKER is the product write boundary

Formal M1 user actions use the caller's Supabase session. RPCs re-read
`auth.uid()`, ownership, state, and cross-object bindings. `SECURITY DEFINER`
is not the default and requires a separately documented necessity and minimal
protection. A service-role client cannot substitute for user-state acceptance.

Generated output tables are not directly browser-writable. Controlled RPCs own
the transaction and only expose the minimum execution capability.

## DR-M1-005: Local V1 is compatibility evidence, not formal persistence

The local deterministic V1 flow and its eight Golden Cases remain regression
oracles. Formal Running, Result, History, and Feedback do not read localStorage
after an API failure and do not present browser-generated artifacts as an
account result. Any remaining local flow must be explicitly labelled as a
draft/demo compatibility path.

