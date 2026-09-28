# Track B multi-horizon paths: TDD evidence

Status: functional candidate; final product acceptance remains pending.

## User-visible behavior

- Compare a frozen baseline with a user-authored alternative over 1, 3, or 5 years.
- Add 1–12 sequential changes, all within one selected theme; a field may change more than once.
- Show coarse periods and conditional possibilities, not predictions, probabilities, exact dates, or cross-theme causal claims.
- Preserve the existing one-year, one-change Track B flow and its history.

## RED → GREEN

- RED contract checkpoints: `7b06b13` (multi-horizon contract) and `0c2e5c9` (single-theme constraint). Before implementation, engine and route tests rejected mixed-theme paths only by failing because the request was accepted; the local database contract also exposed the missing B2 writer.
- GREEN targeted tests: `npm test -- --run src/app/app/new/life-climate/life-climate-client.test.ts src/app/app/new/scene/page.test.ts src/app/api/life-climate/runs/route.test.ts src/lib/life-climate/engine.test.ts src/lib/life-climate/path-engine.test.ts` — 5 files, 19 tests passed.
- GREEN database regression: `npx --yes --package=supabase@2.118.0 -- supabase test db --local supabase/tests/life_climate_b1_test.sql supabase/tests/life_climate_b2_contract_test.sql` — 2 files, 43 assertions passed; existing B1 and B2 event/claim/report linkage, retry behavior, owner isolation, and writer permissions covered.

## Additional checks

- `npm run type-check` — passed.
- `npm run lint` — passed.
- `npm run build` — passed; 107 pages generated.
- `git diff --check` — passed.

## Not yet established

No authenticated browser end-to-end acceptance, full repository test/database suite, or coverage measurement has been completed for this feature. This evidence supports a functional candidate, not a claim that Astraloom is fully developed or accepted. The migration was applied to the local Supabase instance only; no remote database or GitHub update was performed.
