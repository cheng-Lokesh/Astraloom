# Controlled Staging Beta Runbook

This runbook is for the first controlled MiroFish beta. Do not promote this
deployment to production and do not make a public launch announcement.

## Audience

- Founder/operator.
- 3-5 invited testers.

Use direct invitation only. Do not post the URL publicly.

## Goal

Validate the deterministic end-to-end product chain:

`SeedContext -> KeyPeople -> AgentProfiles -> RelationGraph -> Simulation Engine v1 -> EventLogs -> Claims -> Report Engine -> mock unlock -> Feedback`

Measure:

- whether one full simulation can be completed,
- whether copy feels credible and non-deterministic,
- whether reports remain evidence-backed,
- where users hit errors or confusion,
- whether Supabase staging supports Auth, RLS, session, and draft sync.

## Feature Gates

Staging Beta must keep:

```env
ENABLE_AI_GENERATION=false
ENABLE_SYSTEM_WRITERS=false
ENABLE_STRIPE_WRITES=false
DEEPSEEK_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Payment remains mock unlock only. Real LLM calls remain off.

## Vercel Preview Environment

Use a Vercel Preview deployment, preferably from a `staging` branch. Do not use
`vercel --prod` for this phase.

Required Preview env vars:

```env
NEXT_PUBLIC_APP_URL=https://<vercel-staging-preview-url>
NEXT_PUBLIC_SUPABASE_URL=<supabase-staging-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-staging-service-role-key>

ENABLE_AI_GENERATION=false
ENABLE_SYSTEM_WRITERS=false
ENABLE_STRIPE_WRITES=false
DEEPSEEK_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
MIROFISH_ADMIN_TOKEN=<strong-random-string>
```

Rules:

- `NEXT_PUBLIC_*` values may be exposed to the browser.
- `SUPABASE_SERVICE_ROLE_KEY` and `MIROFISH_ADMIN_TOKEN` are server-only.
- Never commit real env values to the repo.
- Keep Vercel Deployment Protection on if available for the project.

## CLI Setup

From the project root:

```powershell
npx vercel login
npx vercel link
npx vercel env add NEXT_PUBLIC_APP_URL preview
npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
npx vercel env add SUPABASE_SERVICE_ROLE_KEY preview
npx vercel env add ENABLE_AI_GENERATION preview
npx vercel env add ENABLE_SYSTEM_WRITERS preview
npx vercel env add ENABLE_STRIPE_WRITES preview
npx vercel env add DEEPSEEK_API_KEY preview
npx vercel env add STRIPE_SECRET_KEY preview
npx vercel env add STRIPE_WEBHOOK_SECRET preview
npx vercel env add MIROFISH_ADMIN_TOKEN preview
```

Recommended random admin token generation:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Then deploy a preview:

```powershell
npm run check
npx vercel deploy
```

After Vercel returns the preview URL, update `NEXT_PUBLIC_APP_URL` in the
Preview environment to that exact URL and redeploy the preview.

## Supabase Staging Setup

Use only the staging Supabase project.

Run migrations in order:

```text
supabase/migrations/0001_mvp_core_schema.sql
supabase/migrations/0002_mvp_evidence_chain_contracts.sql
supabase/migrations/0003_paid_beta_writers.sql
```

Configure Auth redirect URLs:

```text
https://<vercel-staging-preview-url>/auth/callback
https://<vercel-staging-preview-url>/auth/callback?next=/sync
```

## Preflight

Before inviting testers:

1. `npm run check` passes locally.
2. `/api/supabase-setup/status` returns `safeForStagingBeta: true`.
3. `/api/supabase-setup/session` returns `401 auth_session_missing` before login.
4. `/login` sends a magic link.
5. Magic link callback creates a session.
6. `/api/supabase-setup/session` returns `ok: true` after login.
7. `/app/admin/acceptance` shows all Golden Cases passed.
8. `/api/reports/generate` without auth returns `401 auth_token_missing`.
9. `/api/payments/create-checkout-session` without auth returns `401 auth_token_missing`.
10. Full deterministic flow completes once with mock unlock and feedback.

## Tester Script

Ask each tester to complete one realistic scenario:

1. Log in with magic link.
2. Create a new scenario from `/app/dashboard`.
3. Enter one relationship/career/collaboration decision.
4. Confirm or edit KeyPeople only through allowed people controls.
5. Review AgentProfiles.
6. Review the read-only RelationGraph.
7. Run the simulation.
8. Read free preview.
9. Use mock unlock.
10. Read paid report depth.
11. Submit feedback.

Ask them to record:

- confusing copy,
- missing evidence,
- report claims that feel too strong,
- any failed page or API error,
- whether mock unlock felt like depth without extra certainty.

## No-Go Conditions

Stop the beta if any of these happen:

- LLM calls appear in logs while `ENABLE_AI_GENERATION=false`.
- Stripe checkout or webhook is called.
- Paid unlock changes claim ids, confidence, or risk level.
- A claim appears without `evidenceEventIds`.
- Feedback rewrites historical EventLogs or Claims.
- Testers can edit relation edge weights.
- Supabase RLS exposes another user's rows.
- Copy implies certainty, mind reading, fortune telling, or fear-based payment.

## Exit Criteria

Controlled Staging Beta is complete when:

- 3-5 testers finish one full deterministic run.
- Golden Cases still pass.
- Supabase Auth/session/RLS/draft sync remain stable.
- Error rate and confusing-copy issues are logged.
- Report credibility issues have concrete examples.
- No real LLM or real payment path was opened.
