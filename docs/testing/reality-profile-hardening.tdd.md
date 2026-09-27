# Reality Profile hardening TDD evidence

## Scope

This task repairs the five defects from the independent review: direct-write
Reality Profile validation, exact database revision increments, explicit
World State classifications, stable current-Seed ordering, and UUID matching
that does not assume versions 1 through 5.

## RED and GREEN

- RED checkpoint: `3d4f000` (`test: add targeted profile hardening regressions`).
- RED command: `npm test -- --reporter=dot src/lib/reality-profile/profile.test.ts src/lib/sandbox-overview/overview.server.test.ts src/app/app/dashboard/page.m2.test.ts src/app/api/reality-profile/route.test.ts`
- RED result: exit 1; 7 failed and 34 passed across 4 files.
- GREEN command: same targeted Vitest command.
- GREEN result: exit 0; 41 passed across 4 files.

## Guarantees and limits

| Guarantee | Test evidence | Result |
|---|---|---|
| Scalar trim-first limits, PII rejection, and revision guards are enforced against direct SQL writes. | `supabase/tests/reality_profile_persistence_test.sql`, plan 45 | Authored; not executed because no local database was available. |
| UUID-shaped identifiers are rejected without restricting UUID version or variant. | `src/lib/reality-profile/profile.test.ts` and pgTAP assertions | TypeScript tests passed; pgTAP not executed. |
| World State and Dashboard retain visible fact, assumption, and unknown labels. | `src/lib/reality-profile/profile.test.ts`, `src/lib/sandbox-overview/overview.server.test.ts`, `src/app/app/dashboard/page.m2.test.ts` | Passed. |
| Dashboard current Seed order matches the API and RLS `submitted_at DESC, id DESC` order. | Overview and Reality Profile route tests; pgTAP policy assertion | TypeScript tests passed; pgTAP not executed. |

Other requested gates: `npm run type-check` exit 0; `npm run lint` exit 0;
`npm run build` exit 0. Gitleaks was unavailable; a redacted-format scan found
zero credential-shaped files. A real local pgTAP run remains necessary before
any database migration can be claimed as verified.
