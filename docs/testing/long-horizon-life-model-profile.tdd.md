# Long-Horizon Life Model Profile Candidate

This batch adds six separately classified Reality Profile domains needed by
future Track B work: identity, career, wealth, relationships, environment, and
life stage. It stores and displays user-authored inputs only. Track A excludes
these entries from its causal evidence ledger and result projection. This is a
functional candidate, not a Track B simulation or final product acceptance.

## RED

Before implementation, the focused command was:

```text
npx vitest run src/lib/reality-profile/profile.test.ts src/app/app/reality-profile/reality-profile-client.test.ts
```

It ran 12 tests: 10 passed and the two new assertions failed as intended. The
profile schema rejected the missing `lifeModelDomains` contract, and the editor
did not render the long-horizon domains.

## GREEN

Focused integration coverage:

```text
npx vitest run src/lib/reality-profile/profile.test.ts src/app/app/reality-profile/reality-profile-client.test.ts src/app/api/reality-profile/route.test.ts src/lib/sandbox-overview/overview.server.test.ts src/app/app/dashboard/page.m2.test.ts src/lib/formal-sandbox/runtime.test.ts
```

Result: 6 files and 55 tests passed. This includes owner-scoped API round-trip,
safe dashboard projection, explicit unknowns, and exclusion from Track A's
causal evidence ledger.

Database migrations, including
`20260927222723_reality_profile_life_model_domains.sql`, were applied locally
without resetting the existing database using
`npx --yes supabase@latest migration up --local`. The focused pgTAP
command covered the new validator/column, existing profile RLS and revision
guard, and structured World Model inputs:

```text
npx --yes supabase@latest test db supabase/tests/reality_profile_life_model_domains_test.sql supabase/tests/reality_profile_persistence_test.sql supabase/tests/reality_profile_world_inputs_test.sql --local
```

Result: 3 files and 75 tests passed. `npm run lint`, `npm run type-check`,
`npm run build`, and `git diff --check` also passed. No authenticated browser
journey or independent final acceptance was run in this batch.
