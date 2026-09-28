# Targeted formal Run feedback candidate evidence

Status: **functional candidate; not a Phase 4 or full-product acceptance**.
The account-authenticated Result feedback panel could not be exercised in a
real browser session because this local browser had no signed-in test account.

## User-visible behavior

- A user can open feedback on a frozen Claim, Participant, or Relation shown in
  a completed formal Result, select a category-appropriate rating, and add an
  optional bounded note.
- Existing overall-result feedback remains available.
- Feedback is append-only and bound to the current authenticated owner and
  completed Run. The server resolves safe ordinal keys against that Run's
  frozen bundle and does not return internal database IDs.
- Feedback signals (category, rating, time) may be included in the next Run's
  bounded input snapshot. This records the user's signal; it does not yet prove
  that simulation scoring or outcome quality improves.
- Strategy feedback remains unavailable because current formal Results do not
  contain persisted Strategy items. No placeholder strategy is fabricated.

## TDD checkpoints

| Stage | Local commit | Evidence |
| --- | --- | --- |
| Route/client RED | `0e6c657` | Targeted request was rejected and safe target fields were stripped before implementation. |
| Database contract RED | `7687149` | The targeted RPC and direct-browser write guard were absent. |
| Next-Run signal RED | `1ce45de` | The feedback snapshot query omitted the M2 version. |
| Writer-guard RED | `b2a9975` | The targeted insert path had no M2 transaction guard. |
| Result-panel RED | `3472713` | The component and target-feedback interactions were absent. |
| Focused GREEN | current candidate | `npm test -- --run src/app/api/sandbox/runs/routes.test.ts src/lib/formal-sandbox/client.test.ts src/lib/formal-sandbox/start.server.test.ts src/app/app/simulation/result/targeted-feedback.test.ts src/app/app/simulation/result/result-workbench-world-variables.test.ts src/app/app/simulation/result/page.m2-2.test.ts` — exit 0, 6 files / 38 tests. |
| Full JavaScript/static/build gates | current candidate | `npm run check` — exit 0; 85 files / 757 tests, lint, type check, and production build passed; 107 static pages generated. |

## Local database evidence

The target migration `20260928061350` is recorded in the running local
database, and the targeted feedback RPC exists. The Supabase CLI is not on this
machine's command path, so the two existing transaction-rollback pgTAP files
were executed directly against the local Postgres container with `psql`:

- `supabase/tests/m1_formal_run_api_test.sql`: 19 assertions passed.
- `supabase/tests/m1_formal_run_bundle_test.sql`: 88 assertions passed,
  including targeted Claim/Participant/Relation mapping, replay/idempotency,
  absent Strategy rejection, cross-owner denial, direct-write rejection, and
  preservation of historical Result and calibration snapshots.

Both scripts ended in `ROLLBACK`. No remote database was touched.

## Browser evidence and remaining gap

The local app started on port 3184. The formal Result route returned its
no-selected-Run state; Account History correctly showed the signed-out login
boundary. At a 375px viewport the History page remained readable, and a local
screenshot is retained at
`output/playwright/target-feedback/target-feedback-mobile.png`.

This does **not** verify that the new feedback panel looks or behaves correctly
inside a signed-in Result. No real or existing user identity was used, no
feedback row was created through the UI, and the panel's browser acceptance is
still required. `src/lib/v2/**` has no worktree diff. The candidate has not been
pushed to GitHub.
