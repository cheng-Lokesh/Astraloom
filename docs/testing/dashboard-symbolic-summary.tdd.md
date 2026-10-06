# Dashboard optional symbolic summary — functional candidate

Journeys derived from the scoped dashboard task: inspect the optional saved
framework separately from self-recorded reality, manage it, recognize old or
withdrawn state, and continue the main sandbox when its read fails.

- RED: `npx vitest run src/app/app/dashboard/symbolic-summary-dom.test.ts --reporter=dot`; exit 1, 9 failed. The real React dashboard rendered its overview, then each test failed because the optional framework region was absent. Checkpoint: `04e04c2`.
- GREEN: `npx vitest run src/app/app/dashboard/symbolic-summary-dom.test.ts src/app/app/dashboard/page.m2.test.ts --reporter=dot`; exit 0, 11 passed. Includes real Chrome DOM loading, active five dimensions, unconfigured, withdrawn, old-period, 500, 401, malformed snapshot, version mismatch, missing consent, and read retry without reloading overview.
- Checks: targeted ESLint of the three dashboard files and `npx tsc --noEmit --pretty false` exited 0.
- Guarantees: safe DTO/schema validation, no-store reads, no display of birth values or internal dimension/source keys, keyboard-accessible management link, and preservation of the overview's single next action.
- Coverage was not collected. No 80% claim or final nine-stage acceptance is made.
- Live authenticated endpoint acceptance and styled responsive visual inspection remain part of final combined acceptance. This component is a read-only optional summary; Run attachment is explicitly not connected.
