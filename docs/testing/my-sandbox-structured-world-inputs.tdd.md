# My Sandbox structured world inputs TDD evidence

## User journey

As a signed-in user, I want My Sandbox to show the resources and constraints I
saved in my Reality Profile, including their explicit units, bounds, usage, and
deadlines, so that I can see what the current model actually contains without
mistaking it for a forecast.

## RED/GREEN evidence

| State | Command | Result |
|---|---|---|
| RED | `npm test -- src/lib/reality-profile/profile.test.ts src/lib/sandbox-overview/overview.server.test.ts src/app/app/dashboard/page.m2.test.ts` | 3 intended failures: structured inputs absent from the profile projection, `world_model_inputs` absent from the account query, and values absent from rendered dashboard output. |
| GREEN | Same command after implementation | 3 test files passed; 39 tests passed. |

## Additional checks

- `npm run type-check` — passed.
- Targeted ESLint on the changed TypeScript/TSX source and test files — passed.
- `npm run build` — passed.
- Production server started locally; `GET /app/dashboard` returned HTTP 200.
- `git diff --check` — passed.

No database migration or write was needed. Coverage, the full test suite, and an
authenticated browser journey remain part of the later concentrated product
acceptance; this evidence is limited to the current feature batch.
