# Formal Run clock and frozen reservation

Functional candidate only; final combined build and independent safety review
belong to the lead's concentrated acceptance. No V2 Core or historical Run was
changed. No full-suite coverage or browser acceptance is claimed here.

## RED

- `7aa7c65`: `npm test -- src/lib/formal-sandbox/runtime.test.ts src/lib/formal-sandbox/start.server.test.ts`
  exited 1: 21 tests, 6 intended failures. Reproduced old Graph-clock reuse,
  pending retry input/clock drift, expiry, and completed-key regeneration.
- `92035af`: `npm test -- src/lib/formal-sandbox/http.server.test.ts`
  exited 1: 3 tests, 1 intended failure for absent `Cache-Control: no-store`.

## GREEN

- Seven focused formal-sandbox files (`start.server`, `runtime`,
  `digital-life-runtime`, `repository.server`, `http.server`, `model-context.server`,
  `result-projection.server`): 73 tests passed, exit 0. Focused ESLint exited 0.
- Local transactional pgTAP: reservation 43, NULL validation 140, canonical
  Bundle/feedback 98, owner-write-boundary 25, formal API 19: 325 assertions
  passed. Each `psql -X -v ON_ERROR_STOP=1` execution exited 0. The old Bundle
  fixture now obtains a controlled reservation first; all original ownership,
  artifact atomicity, immutability and feedback assertions still execute.
- Supabase local security advisors at error level: no issues, exit 0.

The forward migration uses authenticated SECURITY INVOKER admission, exact
owner/Seed/Graph binding, server-frozen five-minute start and source revisions.
Pending expiry fails closed; same-content retry preserves the reservation;
completed/concurrent retries restore the first canonical Run. Database actual
completion time must precede the frozen window. Ordinary generation-job writers
cannot create or mutate reservation rows; original ordinary-job logging remains
compatible. Fixtures are disposable and rolled back.

Frozen source payloads remain personal data subject to future controlled export
and account erasure. Routine immutability is not a permanent-retention policy;
the current account-erasure request flow does not implement physical erasure.
