# Supabase Auth Sync Setup

This is the next execution guide after the MVP QA checklist. It keeps the project inside the safe MVP boundary: only authentication and user-authored draft sync are tested.

## What This Step Enables

- Magic-link login through Supabase Auth.
- Client-writable sync for `seed_contexts`, `key_people`, and `support_tickets`.
- Read-only verification for system-owned generated/payment tables.

## What Must Stay Disabled

Keep these values disabled in `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=
ENABLE_SYSTEM_WRITERS=false
ENABLE_AI_GENERATION=false
ENABLE_STRIPE_WRITES=false
STRIPE_SECRET_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

## Step 1. Create `.env.local`

If `.env.local` does not exist:

```powershell
Copy-Item .env.example .env.local
```

Fill:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=<Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon public key>
```

Do not paste the Supabase service-role key into `.env.local` for this step.

## Step 2. Apply the Database Migration

Open the local helper page:

```text
http://localhost:3000/setup/migration
```

Copy the full SQL into Supabase SQL Editor. The source file is:

```text
supabase/migrations/0001_mvp_core_schema.sql
```

Run it once. It is written with `if not exists` guards so repeated execution should not recreate existing objects.

## Step 3. Configure Supabase Auth Redirects

In Supabase Dashboard:

1. Open Authentication.
2. Open URL Configuration.
3. Set Site URL to `http://localhost:3000`.
4. Add Redirect URL `http://localhost:3000/auth/callback`.
5. Add Redirect URL `http://localhost:3000/auth/callback?next=/sync` if Supabase requires exact query redirects.
6. Confirm email magic link is enabled.

## Step 4. Restart the Dev Server

After editing `.env.local`, restart:

```powershell
npm run dev
```

Next.js reads env values at server start. If the server is not restarted, the app may still behave as unconfigured.

## Step 5. Verify Setup Status

Open:

```text
http://localhost:3000/setup
```

Expected:

- Supabase URL is configured.
- Supabase anon key is configured.
- Service-role is not configured.
- System writers, AI generation, and Stripe writes are off.
- Migration file is present locally.
- Remote schema shows all expected tables present after the SQL has been run.

You can also check the remote schema endpoint:

```text
http://localhost:3000/api/supabase-setup/remote-schema
```

## Step 6. Verify Login and Draft Sync

1. Open `/intake` and create a seed context.
2. Open `/people` and confirm or add one person.
3. Open `/billing` and create a support/deletion/refund draft if needed.
4. Open `/login`, enter a real email, and send a new magic link.
5. Click the new magic link. It should open `/auth/callback?next=/sync` and then redirect to `/sync`.
6. Click `Check login session`.
7. Click `Sync client-writable drafts`.

If the email link opens in a different browser, copy the full opened URL and paste it into the Codex in-app browser address bar. The session must exist in the same browser that opens `/sync`.

If the callback URL contains `otp_expired` or says the email link is invalid/expired, send a fresh magic link from `/login` and use the newest email only. Old links cannot be reused.

If Supabase says the email send rate limit is exceeded, stop sending new links and wait for the Auth email limit window to reset. Repeated sends can keep producing expired or invalid links; after waiting, send one new link and use the latest email only.

Expected:

- `seed_contexts` receives one row for the logged-in user.
- `key_people` receives rows tied to the seed context.
- `support_tickets` receives only user-created support drafts.
- `agent_profiles`, `relation_edges`, `simulation_runs`, `events`, `claims`, `reports`, and `payments` are not written by browser sync.
- Service-role remains blank and AI/Stripe/system writer flags remain disabled.

Verified in Codex:

- `seed_contexts=1`
- `key_people=4`
- `support_tickets=0`
- Server-owned tables remained `0`: `agent_profiles`, `relation_edges`, `simulation_runs`, `events`, `claims`, `reports`, `payments`, and `consent_events`.

## Step 7. Read-only RLS Verification

From the browser client, generated/payment tables must remain read-only:

- `agent_profiles`
- `relation_edges`
- `simulation_runs`
- `events`
- `claims`
- `reports`
- `payments`
- `consent_events`

Do not add insert/update/delete RLS policies for these tables in this step.

## Next Gate

After authenticated sync, controlled writer contracts, dry-run validation, writer execution guardrail, disabled service-role adapter, audit event model, idempotency registry model, rollback compensation model, rollout checklist, diagnostic service-role isolation harness, inert server-only writer module stubs, writer payload parity fixtures, request hashing/redaction fixtures, audit/idempotency evidence handoff fixtures, the read-only audit/idempotency migration proposal, the read-only migration review checklist, the read-only manual migration application runbook, the read-only applied-schema verification harness, the read-only persistence dry-run gate, the read-only persistence adapter design, the read-only persistence adapter implementation review checklist, the read-only persistence adapter fixture harness, the read-only persistence adapter no-go evidence packet, the read-only persistence adapter implementation proposal scaffold, the read-only persistence adapter implementation acceptance test matrix, the read-only persistence adapter implementation approval packet, the read-only persistence adapter implementation branch preflight checklist, the read-only persistence adapter implementation dry-run diff contract, the read-only persistence adapter implementation patch review packet, the read-only persistence adapter implementation owner signoff packet, the read-only persistence adapter implementation release no-go packet, the read-only persistence adapter human go/no-go runbook, and the read-only persistence adapter external approval archive checklist are proven, the implementation authorization remediation review checklist now exists; the remediation review no-go packet now exists; the implementation authorization reconsideration preflight checklist now exists; the implementation authorization reconsideration no-go packet now exists. The read-only implementation authorization reconsideration remediation plan now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-plan.md`, `/server-writers/persistence-authorization-reconsideration-remediation`, and `/api/system-writers/persistence-authorization-reconsideration-remediation`. The read-only implementation authorization reconsideration remediation review checklist now exists at `docs/writer-persistence-implementation-authorization-reconsideration-remediation-review-checklist.md`, `/server-writers/persistence-authorization-reconsideration-remediation-review`, and `/api/system-writers/persistence-authorization-reconsideration-remediation-review`. The read-only implementation authorization reconsideration remediation review no-go packet now exists. The read-only implementation authorization reconsideration final decision packet now exists; the next implementation step can define only a read-only external final decision archive checklist. That next step still should not enable real service-role writes, AI, or Stripe until cost, safety, webhook, audit, idempotency, rollback, rollout, isolation, stub, payload-parity, hashing, redaction, evidence handoff, migration behavior, migration review requirements, migration application procedures, applied-schema verification, persistence dry-run behavior, adapter design, implementation review evidence, fixture evidence, no-go evidence, proposal scaffold, acceptance criteria, approval ownership, branch preflight requirements, diff-contract requirements, patch-review requirements, owner signoff requirements, release no-go blockers, human go/no-go external artifact rules, archive readiness rules, reconsideration preflight requirements, and reconsideration no-go blockers are reviewed together.

