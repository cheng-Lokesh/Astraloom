# Reality Profile life dimensions TDD evidence

## Source and journeys

No separate plan file was supplied; these journeys come from the task:

1. A signed-in user can review goals, values, life themes, pressures, and external variables, with each item marked fact, assumption, or unknown and unknown as the default.
2. The user can add, edit, remove, and save entries against the latest submitted Seed without overwriting a newer revision.
3. My Sandbox explains these dimensions and links to the editor; projections expose safe summaries without raw identifiers.
4. Anonymous reads and writes are rejected.

## RED and GREEN checkpoints

| Stage | Commit | Command | Exit | Evidence |
| --- | --- | --- | ---: | --- |
| RED | `1e870b189d94bf3c885f9714b8cc78af35a0b7c3` | `npm test -- src/lib/reality-profile/profile.test.ts src/app/api/reality-profile/route.test.ts src/app/app/reality-profile/reality-profile-client.test.ts src/app/app/dashboard/page.m2.test.ts` | 1 | Four files ran; six intended assertions failed and six passed. Failures exposed the absent array schema, API persistence/validation, and UI dimension labels. |
| GREEN | `7c2b41fdeaf92255e224a941f34527a5dcf65f03` | `npm test -- src/lib/reality-profile/profile.test.ts src/app/api/reality-profile/route.test.ts src/app/app/reality-profile/reality-profile-client.test.ts src/lib/sandbox-overview/overview.server.test.ts src/app/app/dashboard/page.m2.test.ts src/app/api/sandbox-overview/route.test.ts` | 0 | Six files and 43 tests passed. |
| SQL compatibility correction | `0b19bef14ee28eb576b8b9cc4f1cc2b14300c671` | Static migration checks; live pgTAP was unavailable | n/a | Replaced the unsupported JSONB object-length function with the documented `jsonb - text[]` operator. |

## Test guarantees

| # | Guarantee | Test | Result |
| --- | --- | --- | --- |
| 1 | Each new dimension has safe unknown defaults; facts, assumptions, and unknowns remain distinct in the Reality and World projections. | `src/lib/reality-profile/profile.test.ts` | PASS |
| 2 | The API requires authentication, scopes reads and writes to the signed-in owner and latest submitted Seed, rejects unsafe content, and refuses stale revisions. | `src/app/api/reality-profile/route.test.ts` | PASS |
| 3 | The editor initially renders all eight dimensions as unknown and exposes save controls. | `src/app/app/reality-profile/reality-profile-client.test.ts` | PASS; server-render assertion only |
| 4 | My Sandbox projects unknown dimensions without inventing values and preserves its single truthful next action. | `src/lib/sandbox-overview/overview.server.test.ts`, `src/app/app/dashboard/page.m2.test.ts` | PASS |
| 5 | Persistence constraints and RLS are represented in the migration and pgTAP cases, including direct JSONB write rejection for extra keys and malformed unknown entries. | `supabase/migrations/20260927151550_reality_profile_life_dimensions.sql`, `supabase/tests/reality_profile_persistence_test.sql` | Static review only; pgTAP not run |

## Coverage and known gaps

The focused 43-test coverage command included `profile.ts`, the Reality Profile route, and `overview.server.ts`:

```text
npm test -- --coverage --coverage.include=src/lib/reality-profile/profile.ts --coverage.include=src/app/api/reality-profile/route.ts --coverage.include=src/lib/sandbox-overview/overview.server.ts src/lib/reality-profile/profile.test.ts src/app/api/reality-profile/route.test.ts src/app/app/reality-profile/reality-profile-client.test.ts src/lib/sandbox-overview/overview.server.test.ts src/app/app/dashboard/page.m2.test.ts src/app/api/sandbox-overview/route.test.ts
```

It passed with 87.61% statements, 77.19% branches, 95.65% functions, and 97.12% lines (exit 0).

Including both client components with the same tests produced 72.18% statements, 66.25% branches, 66.66% functions, and 79.52% lines (exit 1 against the repository-wide thresholds). The broader command added these two include arguments to the command above:

```text
--coverage.include=src/app/app/reality-profile/reality-profile-client.tsx --coverage.include=src/app/app/dashboard/sandbox-dashboard-client.tsx
```

The current editor test checks initial server-rendered markup; add/edit/remove/save interactions and their network/conflict branches remain for concentrated browser acceptance. This candidate does not claim the UI interaction path or the database migration has passed independent acceptance.

`npm run type-check`, `npm run lint`, and `npm run build` each exited 0. The anonymous production page smoke returned HTTP 200, showed all six new dimension labels, and found no identifier or credential marker. The smoke did not exercise authenticated persistence. Local Supabase/Docker was unavailable after one bounded probe, so the migration was not applied and pgTAP was not run; no further start/reset attempt was made.
