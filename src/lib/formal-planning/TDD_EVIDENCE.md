# Formal default planning functional candidate

Scope: the independent `formal-planning` module only. Formal Start, source-owner
database admission, runtime installation and real Result UI remain to be integrated.
This is not full Destiny fusion or final product acceptance.

The planner budget is a whole-run maximum of simulated resource allocation for
each independent path and sample. A separate, default-off hypothesis consent can
reduce only the first neutral planning quantity, by at most 10%. The two 5% terms
are explicit versioned product hypotheses, not traditional or scientific weights.
Relation sensitivity has no implemented relationship effect in this lane.

## Actual RED evidence

`npx vitest run src/lib/formal-planning/planning.test.ts --reporter=verbose`
exited 1, executing two failing tests against a typed neutral-only implementation.
The intended failures were `reduction: actual 0, expected 0.1` and source-owner
mismatch incorrectly returning success. No missing-module or test-loading failure
was counted as RED.

The controller explicitly withheld the shared Git window until the concurrent
Outcome checkpoint was coherent, and authorized continuing to GREEN. The RED
state was executed but was **not committed**. No RED commit is claimed.

## Module boundaries exercised (not full product acceptance)

- Strict client request excludes owner, source, frame, cap and actor injection.
- Source Profile/model/owner/revision/lens clocks bind to server accepted context.
- Explicit per-tick resource rates and any explicit allocation on any path exclude
  that resource from default planning.
- Real Core approval and controlled transition produce the changed first quantity;
  the pure planner itself does not mutate World or Reality Evidence.
- On/off within one authorized lane retain candidate identity, order, count and
  Core RNG audit, including actual competition between two resources.
- Fractional and tiny budgets retain the frozen whole-run bound and minimum reserve.
- Self resource controller, owner entity, actual remaining headroom, deadlines and
  executable assumption references are checked before candidate admission.
- Traces contrast selected and unselected proposals with actual controlled Events.
- Safe Result projection hides source, owner, world resource, Event and assumption
  identifiers and preserves legacy `not_recorded`.

## Verification checkpoint

The first GREEN target was 2 files / 29 tests, exit 0, followed by full-repo
`npx tsc --noEmit` and own-module `npx eslint src/lib/formal-planning`, both exit 0.
An added multi-resource fixture briefly used a nonexistent RNG audit field;
reading the actual Core audit contract corrected it to `rawValue % 2` without
changing Core or configuration.

The subsequent coverage run was 2 files / 30 tests, exit 0:
statements 97.53%, branches 96.17%, functions 100%, lines 100%.
The PowerShell glob argument requires quotes; an unquoted initial invocation
stopped at the shell parser and was not counted as a test execution.

After the safe projection changes, the targeted coverage command was:

`npx vitest run src/lib/formal-planning --coverage '--coverage.include=src/lib/formal-planning/{contracts,index,proposals,projection}.ts' --coverage.reportsDirectory=coverage/formal-planning --coverage.thresholds.statements=80 --coverage.thresholds.lines=80 --coverage.thresholds.functions=80 --coverage.thresholds.branches=80`

It exited 0: 3 files / 33 tests; statements 97.81%, branches 96.11%, functions
100%, lines 100%. Full-repo `npx tsc --noEmit` and own-module
`npx eslint src/lib/formal-planning` both exited 0 after these changes.

Repository-wide build, formal database enforcement and signed-in browser
acceptance are not proved by these pure-module checks. The protected
`src/lib/v2/**` was only imported/read.

## Independent binding review and repair

The independent reviewer demonstrated a P1 in the earlier module: a binding map
could substitute another same-label/unit/minimum resource. Core approval and
transition legitimately consumed the alternate resource, while the projection
incorrectly called the original authorization selected. Generic self/path labels
also lacked accepted-source identity binding. Those earlier checks did **not**
prove complete accepted-source-to-World authorization.

The intended behavioral RED executed against a valid World: the alternate resource
still produced a candidate (15 tests: 1 failed, 14 passed, exit 1). Subsequent
fixture ID/provenance initialization failures during implementation were not
counted as RED. Valid IDs now come from the existing Core factories; no Core
schema or validation was changed.

The server-only initial-World binding derives actor/entity/resource IDs from the
accepted source UUID/canonical resource key and trusted baseline namespace, checks
full resource definition, initial quantities and Ledger source provenance, and
retains an internal structural receipt. This is not a cryptographic signature
authenticating arbitrary client input: admission and immutable server persistence
must establish trust. Proposal and Result comparisons verify the same receipt,
path and identities. Client contracts never accept this receipt or Core IDs.

An independent P2 found a floating-point sum above a strict budget by about 1e-18
at six ticks / budget 0.015. Freezing now checks both sequential sum and subtraction,
uniformly reducing the neutral slice by one millionth where needed. Both prior
states retain all six candidates and actual Core events with total <= 0.015.

Latest own checkpoint: `npx vitest run src/lib/formal-planning --reporter=dot`,
3 files / 39 tests, exit 0. It includes actual Core approval/transition on the
alternate resource followed by projection rejection, source/path/actor/provenance
substitution guards and unchanged on/off uniform competition. No new coverage
matrix was run. Formal context admission, trusted receipt persistence and the
complete Start/Run/Result journey are still integration work, not claimed complete.

The independent reviewer reran all 39 tests and the original in-memory Core
counterexamples, confirming the wrong-resource, altered-context and provenance
substitution guards and strict six-tick cap. Integration clock handling binds the
actual initial boundary `updatedAt` and matches its provenance exactly, with
acceptedAt <= capturedBoundaryAt <= simulationStartAt; it does not substitute the
DB reservation clock for actual runtime capture time. The module remains a
functional candidate pending complete source admission and persisted replay.
