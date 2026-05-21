# Project MiroFish Implementation State

Snapshot date: 2026-05-21

This file is the compact recovery point for future Codex sessions. Read this before reading the longer task notes.

## Current Mission

Build the product implementation. Do not expand the whitepaper unless the user explicitly asks to return to product writing.

The product direction is a MiroFish-like micro-agent simulation: generate individual digital agents, place them in a relationship ecology, run future scenario inference, and present results as readable, safe, paid reports. The current engineering track is still building the protected MVP foundation.

## Current Stage

- Last completed stage: Stage71
- Current next stage: Stage72
- Stage72 intent: read-only remediation path after the Stage71 remediation review no-go packet.
- Current public app URL: `http://localhost:3000/`

## Implemented Product Surface

- Next.js App Router with TypeScript and Tailwind.
- Global language switcher for English and Chinese.
- Local-first MVP flows: intake, people, agents, runs, safety, reports, billing, sync.
- Supabase browser auth and client-writable sync for safe user-authored drafts.
- Read-only server writer workbench for future system-owned artifacts.
- Writer stages currently model contracts, dry runs, guardrails, service-role isolation, audit/idempotency, migration proposals, persistence readiness, authorization, no-go/remediation/review/reconsideration, and archive/reconciliation trails.

## Hard Constraints

- Do not implement real system-owned backend writes yet.
- Do not create or use a service-role Supabase client.
- Do not read or print secrets.
- Do not enable AI model calls, Stripe writes, deployments, feature flags, or report unlocks.
- Do not apply migrations automatically.
- Keep `supabase/migrations/0001_mvp_core_schema.sql` as the only migration until explicitly approved.
- Keep all writer stages read-only with `wouldWriteRows=false`, `wouldRunTransaction=false`, and `wouldCreateServiceRoleClient=false`.
- Use short internal route folders for future long stages, then expose the long public route through `next.config.ts` rewrites.

## Resume Order

1. Read this file.
2. Read `docs/stage-index.md`.
3. Read `docs/decision-log.md`.
4. Read only the top and current-stage sections of `docs/codex-next-task.md`.
5. Run `powershell -ExecutionPolicy Bypass -File scripts/qa-stage.ps1` when the local Next server is stopped and build validation is needed.
6. Run `powershell -ExecutionPolicy Bypass -File scripts/qa-stage.ps1 -Stage 71 -SkipBuild` while the local server is running and Stage71 API invariants need verification.

## Communication Rule

Keep chat updates short. Put persistent context in files, not in the conversation.
