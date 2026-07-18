# Astraloom Future Simulator V2

This is the single authoritative direction document for Astraloom V2. Older
planning, stage, MVP, whitepaper-status, and acceptance documents remain useful
historical context, but this file wins when their product direction conflicts
with the confirmed V2 decisions below.

## Product Definition

Astraloom V2 is an evidence-grounded, intervenable AI future simulator. Given
real-world evidence, explicit assumptions about people, external variables, and
user actions, it repeatedly simulates plausible trajectories and reports
scenario distributions, turning points, causal mechanisms, sensitive
assumptions, leading signals, and intervention differences.

It does not predict the future with certainty and must not claim to know a third
party's private thoughts.

## Confirmed Product Boundaries

- The first V2 domain is career choice and workplace collaboration decisions.
- The primary time windows are 30 days and 90 days.
- The first intervention model is pre-run only. Each intervention creates an
  independent rerun; there are no continuous RPG choices during a run.
- High-impact assumptions about third parties require user confirmation.
- Until real outcome backtesting exists, aggregated results are called
  **simulation frequency**, never real-world probability.
- User drafts stay local-first. Formal AI simulations ultimately run as
  asynchronous server jobs.
- People, Agents, and Graph remain inspectable but do not return as three
  mandatory long funnel steps.

## Evidence Boundary

Real-world evidence and simulation evidence are different ledgers.

- Real-world evidence includes user-confirmed facts, user assertions, and
  validated external sources, each with provenance and uncertainty.
- Simulation evidence includes generated trajectory events, state transitions,
  and causal links.
- A simulated Event is not proof that a real-world event occurred.
- V2 Claims and Reports must preserve both reference classes instead of using
  internal `evidence_event_ids` as a substitute for real-world evidence.
- Unknown, inferred, and disputed information must remain explicit assumptions.

## Dynamic Agent And World Model Boundary

A V2 Agent has a stable definition and a changing state. It may observe,
remember, propose actions, and update through simulation, but it cannot directly
write world state. LLM output may propose structured observations or action
candidates only.

The World Model owns entities, relationships, resources, constraints, external
variables, time, and interventions. Only a validated deterministic state
transition layer may change World State. Every change must produce an auditable
Event and causal reference.

## Simulation Frequency

V2 runs multiple reproducible trajectories from an explicit run specification
and fixed seeds. Scenario frequency must always disclose sample count, engine
version, assumptions, and uncertainty. No precise frequency may be displayed
without actual trajectory samples, and no simulation frequency may be presented
as a calibrated real-world probability before outcome backtesting supports it.

## Destiny Isolation

Destiny or birth information is not part of V2 core evidence, causal logic,
Agent decisions, World State transitions, trajectory clustering, or simulation
frequency. Legacy V1 inputs may remain readable for compatibility, but they
cannot increase V2 likelihood, confidence, or conclusion strength.

## V1 Compatibility Baseline

V1 remains a compatible, read-only baseline. Existing local data is not deleted
or overwritten.

- Artifact version: `local-deterministic-v0`.
- Engine identity: Events use `source: simulation_engine_v1`; the persisted Run
  does not yet expose a separate `engineVersion` field and its `traceId` is
  opaque.
- Fixed branches: `baseline`, `cautious_self`, `decisive_self`, and
  `boundary_adjustment`.
- A 30-day run has 3 shared ticks; a 90-day run has 6 shared ticks.
- Events are generated before Claims.
- V1 Claim `evidenceEventIds` reference internal generated Events.
- Report Engine V1 filters out Claims with missing Event references.
- Paid depth uses the same Claim set and cannot raise confidence, change risk,
  create Claims, or bypass SafetyVerifier restrictions.
- Feedback may tune next-run Agent confidence and relation uncertainty, but it
  cannot rewrite historical Events, Claims, Reports, or edge weights.
- Determinism means identical structural output for identical input after
  excluding runtime timestamps; V1 does not yet expose a random seed.

Automated characterization tests are the executable source of truth for these
V1 invariants. If an older document says V1 has three branches or twelve Golden
Cases, the current code and tests are authoritative: V1 has four branches and
eight implemented Golden Cases.

## Confirmed Implementation Order

1. Lock V1 behavior with automated tests and lock this V2 direction.
2. Build the V2 real-world Evidence and Assumption boundary.
3. Introduce dynamic Agent state and the World Model with validated transitions.
4. Implement seeded, reproducible V2 trajectory execution as server-oriented
   application logic while preserving a local test adapter.
5. Add trajectory features, clustering, simulation frequency, sensitivity, and
   pre-run intervention comparison.
6. Build V2 Claims and Reports on separated real-world and simulation evidence.
7. Add outcome capture, backtesting, calibration, and versioned persistence.
8. Migrate compatible V1 local drafts and enable controlled asynchronous server
   execution without rewriting historical V1 runs.

Each stage must be implemented and verified separately. Do not pull later-stage
types, pages, or infrastructure into an earlier stage.

## Documentation Restraint

Do not create more writer-stage, approval, no-go, remediation, or numbered stage
documents to restate this direction. Update this file only when the product owner
changes a confirmed V2 decision. Existing writer and legacy stage structures are
frozen until a future task explicitly authorizes consolidation or removal.
