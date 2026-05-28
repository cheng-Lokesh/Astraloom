# Supabase Staging Setup

This guide validates whether Supabase staging can support the current Astraloom product. It must not connect real payment, enable real LLM generation, or change product behavior.

## Safety Gates

Keep these disabled while validating Supabase staging:

```env
ENABLE_SYSTEM_WRITERS=false
ENABLE_AI_GENERATION=false
ENABLE_STRIPE_WRITES=false
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
DEEPSEEK_API_KEY=
```

Use `SUPABASE_SERVICE_ROLE_KEY=` blank for normal app validation. Only set it in server-side environments when explicitly validating server-only writer modules; never expose it through `NEXT_PUBLIC_` variables.

## Create The Supabase Project

1. Create a Supabase project for staging.
2. Copy the Project URL into `NEXT_PUBLIC_SUPABASE_URL`.
3. Copy the anon public key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` for local staging validation.
5. Keep service-role, payment, and LLM secrets blank unless a later server-only validation step explicitly requires them.

The checked-in examples are:

- `.env.example`
- `.env.local.example`

Both include the variables required by the current app.

## Run Migrations

Run the SQL migrations in order from Supabase SQL Editor or a trusted server-side migration runner:

```text
supabase/migrations/0001_mvp_core_schema.sql
supabase/migrations/0002_mvp_evidence_chain_contracts.sql
supabase/migrations/0003_paid_beta_writers.sql
```

Do not run payment webhooks, Stripe checkout setup, or LLM generation during this validation.

After migration, every public product table should have RLS enabled. The staging verification on 2026-05-25 confirmed these tables with RLS enabled:

```text
agent_profiles
claims
consent_events
events
feedback_log
generation_jobs
key_people
payments
profiles
relation_edges
reports
seed_contexts
simulation_runs
simulation_ticks
support_tickets
users
writer_audit_events
writer_idempotency_keys
```

`writer_audit_events` and `writer_idempotency_keys` intentionally have RLS enabled with no browser policies. They are server-owned ledgers and should not be readable or writable by browser clients.

## Configure Auth Redirect URLs

In Supabase Dashboard:

1. Open Authentication.
2. Open URL Configuration.
3. Set Site URL to `http://localhost:3000`.
4. Add redirect URL `http://localhost:3000/auth/callback`.
5. Add redirect URL `http://localhost:3000/auth/callback?next=/sync` if the dashboard requires exact query redirects.
6. Confirm email magic link sign-in is enabled.

The app sends magic links from `/login` with:

```text
http://localhost:3000/auth/callback?next=/sync
```

The callback exchanges the code for a Supabase browser session and redirects to `/sync`.

## Validate Magic Link And Session

1. Start the app:

```powershell
npm run dev
```

2. Open `http://localhost:3000/login`.
3. Enter a staging email address and send the magic link.
4. Open the newest magic link in the same browser used for testing.
5. Confirm the callback lands on `/sync`.
6. On `/sync`, click `Check login session`.
7. Confirm the session user is shown.
8. Open `http://localhost:3000/api/supabase-setup/session`.
9. Confirm it returns `{"ok":true,"user_id":"..."}`.
10. Open `http://localhost:3000/app/dashboard`.

Expected result: the logged-in browser can reach `/app/dashboard`, and the server client can read the session through Supabase cookies.

## Validate Protected APIs

With AI and writer gates disabled, unauthenticated calls to protected writer/LLM APIs must not perform work.

Recommended probes:

```powershell
Invoke-WebRequest -Method POST http://localhost:3000/api/reports/generate -ContentType "application/json" -Body "{}"
Invoke-WebRequest -Method POST http://localhost:3000/api/payments/create-checkout-session -ContentType "application/json" -Body "{}"
```

Expected result: requests return a blocked JSON response such as `ai_generation_disabled`, `stripe_writes_disabled`, `service_role_missing`, or `auth_token_missing`; no LLM call, payment session, report unlock, or service-role write occurs.

## Validate RLS

RLS ownership must prevent one user from reading or writing another user's data.

The staging SQL probe run on 2026-05-25 created temporary auth users and rows, then tested as user A:

```json
{
  "seed_contexts_user_a_visibility": {
    "visible_total": 1,
    "own_visible": 1,
    "other_visible": 0
  },
  "seed_contexts_user_a_insert_other_denied": {
    "allowed": false,
    "sqlstate": "42501"
  }
}
```

Expected result: user A sees only user A rows and cannot insert rows for user B.

## Validate Service Role Boundary

Normal staging:

```env
SUPABASE_SERVICE_ROLE_KEY=
ENABLE_SYSTEM_WRITERS=false
ENABLE_AI_GENERATION=false
ENABLE_STRIPE_WRITES=false
```

Expected result: service-role client helpers return a disabled/missing result instead of crashing.

Server-only validation:

1. Set `SUPABASE_SERVICE_ROLE_KEY` only in the server runtime.
2. Keep `ENABLE_SYSTEM_WRITERS=false`, `ENABLE_AI_GENERATION=false`, and `ENABLE_STRIPE_WRITES=false`.
3. Verify no browser bundle imports service-role modules.
4. Verify routes expose only booleans or blocked codes, never secret values.

The service-role modules are guarded with `server-only` and are expected to be imported only by server routes/modules.

## Staging Acceptance Checklist

Run:

```powershell
npm run check
```

Then confirm:

- `.env.local.example` is complete and contains no real secrets.
- Migrations 0001, 0002, and 0003 are applied to staging.
- Auth redirect URLs are configured.
- `/login` sends a magic link and `/auth/callback` creates a session.
- Logged-in users can open `/app/dashboard`.
- Server client can read the logged-in session.
- Unauthenticated protected APIs are blocked.
- RLS prevents reading or writing other users' rows.
- Service-role missing state does not crash.
- Service-role configured state remains server-only.
