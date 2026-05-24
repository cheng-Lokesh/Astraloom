# Project MiroFish Implementation State

Snapshot date: 2026-05-23

This file is the compact recovery point for future Codex sessions. Read this before reading the longer task notes.

## Current Mission

Build the product implementation. Do not expand the whitepaper unless the user explicitly asks to return to product writing.

The product direction is a MiroFish-like micro-agent simulation: generate individual digital agents, place them in a relationship ecology, run future scenario inference, and present results as readable, safe, paid reports. The current engineering track is still building the protected MVP foundation.

## Current Stage

- Last completed stage: Stage73
- Current next stage: Stage74
- Stage74 intent: read-only no-go packet after the Stage73 remediation review checklist.
- Current public app URL: `http://localhost:3000/`

## Implemented Product Surface

- Next.js App Router with TypeScript and Tailwind.
- Global language switcher for English and Chinese.
- Local-first MVP flows: intake, people, agents, runs, safety, reports, billing, sync.
- Supabase browser auth and client-writable sync for safe user-authored drafts.
- Read-only server writer workbench for future system-owned artifacts.
- Writer stages currently model contracts, dry runs, guardrails, service-role isolation, audit/idempotency, migration proposals, persistence readiness, authorization, no-go/remediation/review/reconsideration, and archive/reconciliation trails.
- Stage72 adds a read-only remediation path for Stage71 no-go blockers, keeping all runtime effects blocked.
- Stage73 adds a read-only remediation review checklist for Stage72 plans, keeping all runtime effects blocked.
- Product stability roadmap is tracked in `docs/product-stability-roadmap.md`.
- The user-facing MVP has been productized for a small Chinese career-decision launch: `/demo`, `/intake`, `/people`, `/agents`, `/runs`, `/safety`, `/reports`, and `/billing` now form a local-first preview loop with deterministic Agent ecology, scenario paths, risk windows, free report preview, safety degradation, and payment-intent capture.

## Hard Constraints

- Do not implement real system-owned backend writes yet.
- Do not create or use a service-role Supabase client.
- Do not read or print secrets.
- Do not enable AI model calls, Stripe writes, deployments, feature flags, or report unlocks.
- The initial launch loop must keep payment-intent capture local-only: no checkout, no entitlement grant, and no report unlock.
- Do not apply migrations automatically.
- Keep `supabase/migrations/0001_mvp_core_schema.sql` as the only migration until explicitly approved.
- Keep all writer stages read-only with `wouldWriteRows=false`, `wouldRunTransaction=false`, and `wouldCreateServiceRoleClient=false`.
- Use short internal route folders for future long stages, then expose the long public route through `next.config.ts` rewrites.

## Resume Order

1. Read this file.
2. Read `docs/stage-index.md`.
3. Read `docs/decision-log.md`.
4. Read `docs/product-stability-roadmap.md`.
5. Read only the top and current-stage sections of `docs/codex-next-task.md`.
6. Run `powershell -ExecutionPolicy Bypass -File scripts/qa-stage.ps1` when the local Next server is stopped and build validation is needed.
7. Run `powershell -ExecutionPolicy Bypass -File scripts/qa-stage.ps1 -Stage 73 -SkipBuild` while the local server is running and Stage73 API invariants need verification.

## Communication Rule

Keep chat updates short. Put persistent context in files, not in the conversation.
