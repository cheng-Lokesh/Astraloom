# Brand Rename Audit

Date: 2026-05-28

Scope audited:

- `package.json`
- `package-lock.json`
- root README and handoff/governance docs
- `docs/*`
- `src/app/*`
- `src/components/*`
- `src/lib/*`
- `src/types/*`
- `public/*`
- root metadata/config files
- manifest files if present
- environment examples
- tests, golden cases, and acceptance fixtures where present
- `supabase/migrations/*` because migration comments contain project identity

Old brand terms searched:

- `MiroFish`
- `mirofish`
- `MIROFISH`
- `mirofish-app`
- `fish-in-space`
- `fish in space`
- `Fish in Space`
- `Fish-in-Space`

## Summary

- Rename execution update: current display brand is `Astraloom`; package identity is now `astraloom-app` in `package.json` and `package-lock.json`; centralized constants live in `src/lib/brand.ts`; localStorage keys, admin env/header contract names, routes, repo identity, applied migrations, service-role writer code, and Stripe/payment code were intentionally left unchanged. See `docs/BRAND_RENAME_NOTES.md`.
- `fish-in-space` does not currently appear in the audited project files, so there are no file-level references where it is being used as product identity.
- The git remote in this local checkout still points to `git@github.com:cheng-Lokesh/AI-.git`, while the requested target context says `cheng-Lokesh/fish-in-space`. Treat repository identity as separate from product identity before the rename.
- At audit time, `package.json` and `package-lock.json` both used `mirofish-app` as package/app identity. They have now been renamed together to `astraloom-app`.
- User-facing product copy appears across `src/app/*`, `src/components/*`, and a few `src/lib/*` generated-copy helpers.
- Internal storage keys and globals use `mirofish.*` and `__mirofish...`. These should not be blindly renamed without a compatibility/migration layer.
- Admin environment and header names use `MIROFISH_ADMIN_TOKEN` and `x-mirofish-admin-token`. These are API/config contracts and should not be renamed until deployment envs and callers can be migrated.

## Files Containing Old Brand References

| File | Matched references | Classification | Rename disposition |
| --- | --- | --- | --- |
| `package.json` | line 2 `mirofish-app` | package/app identity | Safe to rename later with lockfile update; do not rename in this audit task. |
| `package-lock.json` | lines 2, 8 `mirofish-app` | package/app identity, lockfile metadata | Rename only in the same task as `package.json`, preferably via npm install/package-lock regeneration. |
| `.env.local.example` | line 36 `MIROFISH_ADMIN_TOKEN` | environment example, config contract | Should not rename yet unless env migration plan is included. |
| `AGENTS.md` | lines 7, 23 `Project MiroFish`, `MiroFish` | docs, governance | Safe to rename after product name is chosen, keeping product constraints intact. |
| `HANDOFF.md` | lines 1, 7, 202, 243 `MiroFish`, `mirofish-app` | docs, local path/repo handoff | Safe to update as docs, but path examples should reflect actual local checkout only after directory/repo rename. |
| `SUPABASE_SETUP.md` | line 3 `MiroFish` | docs | Safe to rename in docs pass. |
| `docs/API_CONTRACTS.md` | lines 1, 336, 337, 362, 363 `Project MiroFish`, `MIROFISH_ADMIN_TOKEN`, `x-mirofish-admin-token` | docs, metadata/API contract | Product title safe; env/header names should not rename yet. |
| `docs/ARCHITECTURE_TARGET.md` | line 1 `Project MiroFish` | docs | Safe to rename in docs pass. |
| `docs/CODEX_TASK_TEMPLATE.md` | line 7 `MiroFish` | docs/template | Safe to rename in docs pass. |
| `docs/DATA_CONTRACTS.md` | lines 1, 3 `Project MiroFish`, `MiroFish` | docs/data contract | Safe to rename in docs pass. |
| `docs/DESTINY_SITUATION_SANDBOX_PRODUCT_SPEC.md` | lines 1, 5, 12, 18, 28, 51, 76, 425, 435 `MiroFish` | docs/product spec | Safe to rename in docs pass. |
| `docs/DEVELOPMENT_LOG.md` | lines 1, 9, 16, 32, 60, 96, 132, 244 `Project MiroFish`/`MiroFish` | docs/history | Rename current-facing mentions; consider preserving historical changelog entries if auditability matters. |
| `docs/E2E_ACCEPTANCE.md` | line 1 `MiroFish` | test/golden acceptance docs | Safe to rename with golden/test wording review. |
| `docs/FULL_PRODUCT_ROADMAP.md` | lines 1, 9, 16, 22 `Project MiroFish`/`MiroFish` | docs/roadmap | Safe to rename in docs pass. |
| `docs/MVP_SCOPE.md` | lines 1, 9 `Project MiroFish`/`MiroFish` | docs/product scope | Safe to rename in docs pass. |
| `docs/PRODUCT_CONSTITUTION.md` | lines 1, 3, 7, 11 `Project MiroFish`/`MiroFish` | docs/governance | Safe to rename display brand while preserving non-negotiable product boundaries. |
| `docs/PRODUCT_PHASES.md` | lines 1, 16 `Project MiroFish`/`MiroFish` | docs | Safe to rename in docs pass. |
| `docs/PRODUCT_QUALITY_PLAN.md` | lines 1, 455 `Project MiroFish`/`MiroFish` | docs | Safe to rename in docs pass. |
| `docs/SAFETY_RULES.md` | lines 1, 7 `Project MiroFish`/`MiroFish` | docs/safety | Safe to rename display brand only; safety meaning must not change. |
| `docs/STAGING_BETA.md` | lines 3, 61, 67, 88 `MiroFish`, `MIROFISH_ADMIN_TOKEN` | docs/deployment runbook, env contract | Product copy safe; env variable should not rename yet. |
| `docs/UI_ACCEPTANCE.md` | lines 1, 3 `Project MiroFish`/`MiroFish` | docs/UI acceptance | Safe to rename in docs pass. |
| `docs/codex-next-task.md` | lines 1, 14 `Project MiroFish` | docs/task notes | Safe to rename in docs pass. |
| `docs/database-schema.md` | line 8 `MiroFish` | docs/schema rationale | Safe to rename in docs pass. |
| `docs/decision-log.md` | lines 1, 17 `Project MiroFish`, `MiroFish-Like` | docs/decision log | Rename current title; consider preserving old decision wording if historical record is important. |
| `docs/implementation-state.md` | lines 1, 11 `Project MiroFish`, `MiroFish-like` | docs | Safe to rename current-facing docs; historical comparison can be preserved if desired. |
| `docs/mvp-qa-environment.md` | lines 1, 7 `Project MiroFish`, `mirofish-app` | docs/local commands | Safe for display name; path examples only after repo/directory rename. |
| `docs/product-stability-roadmap.md` | lines 1, 9 `Project MiroFish` | docs | Safe to rename in docs pass. |
| `docs/server-writer-module-stubs.md` | line 5 `Project MiroFish` | docs | Safe to rename in docs pass. |
| `docs/stage-index.md` | line 1 `Project MiroFish` | docs | Safe to rename in docs pass. |
| `docs/whitepaper-implementation-baseline.md` | lines 1, 9 `Project MiroFish` | docs/whitepaper baseline | Rename only if whitepaper baseline is intended to follow new brand; otherwise preserve as historical source. |
| `docs/writer-execution-guardrail.md` | line 5 `Project MiroFish` | docs/governance | Safe to rename display brand only. |
| `docs/writer-persistence-implementation-authorization-reconsideration-final-decision-packet.md` | line 10 `MiroFish` | docs/approval packet | Safe to rename in docs pass. |
| `docs/writer-rollout-checklist.md` | line 5 `Project MiroFish` | docs/runbook | Safe to rename in docs pass. |
| `src/app/layout.tsx` | line 18 `MiroFish` | metadata | Safe to rename display metadata now in rename task. |
| `src/app/page.tsx` | line 67 `MiroFish` | user-facing UI copy | Safe to rename display copy now. |
| `src/app/demo/page.tsx` | lines 28, 57 `MiroFish` | user-facing UI copy | Safe to rename display copy now. |
| `src/app/login/page.tsx` | lines 14, 20 `MiroFish` | metadata/user-facing UI copy | Safe to rename display copy now. |
| `src/app/app/start/page.tsx` | lines 28, 261 `MiroFish` | user-facing UI copy, sample prompt | Safe to rename display copy; sample prompt should remain natural. |
| `src/app/app/dashboard/page.tsx` | line 77 `MiroFish` | user-facing UI copy | Safe to rename display copy now. |
| `src/app/app/simple/page.tsx` | lines 50, 185, 310, 378, 473, 495 `MiroFish` | user-facing UI copy | Safe to rename display copy now. |
| `src/app/app/new/scene/page.tsx` | line 124 `MiroFish` | user-facing UI copy | Safe to rename display copy now. |
| `src/app/app/simulation/running/page.tsx` | line 644 `MiroFish` | user-facing UI copy | Safe to rename display copy now. |
| `src/app/app/archive/page.tsx` | line 110 `MiroFish` | user-facing UI copy | Safe to rename display copy now. |
| `src/app/app/settings/page.tsx` | lines 16, 86, 99, 147, 182, 223 `mirofish.*`, `MiroFish` | storage key, user-facing UI copy | UI copy safe; localStorage prefix should not rename yet without compatibility migration. |
| `src/app/app/admin/page.tsx` | lines 48, 68 `x-mirofish-admin-token` | internal/API header contract | Should not rename yet unless API route, docs, env, and deployment callers migrate together. |
| `src/app/app/admin/observability/page.tsx` | line 49 `x-mirofish-admin-token` | internal/API header contract | Should not rename yet. |
| `src/app/app/admin/acceptance/page.tsx` | line 51 `MiroFish` | user-facing/admin UI copy, acceptance copy | Safe to rename display copy now. |
| `src/components/app-shell.tsx` | line 38 `MiroFish` | user-facing UI copy/app shell brand | Safe to rename display copy now. |
| `src/components/language-provider.tsx` | line 20 `mirofish.locale-change` | internal browser event identifier | Should not rename yet unless event compatibility is considered. |
| `src/components/safety-downgrade-notice.tsx` | lines 54, 72 `MiroFish` | user-facing UI copy/safety copy | Safe to rename display copy only. |
| `src/lib/admin/admin-auth.ts` | lines 18, 28 `MIROFISH_ADMIN_TOKEN`, `x-mirofish-admin-token` | env var/API header contract | Should not rename yet without env/header migration. |
| `src/lib/agents/storage.ts` | line 4 `mirofish.agent-ecology.*` | storage key | Should not rename yet; needs migration/read fallback. |
| `src/lib/billing/storage.ts` | line 3 `mirofish.billing-support` | storage key | Should not rename yet; needs migration/read fallback. |
| `src/lib/calibration/calibration-engine.ts` | line 13 `mirofish.calibration-profile.*` | storage key | Should not rename yet; needs migration/read fallback. |
| `src/lib/claims/storage.ts` | line 4 `mirofish.claim-ledger.*` | storage key | Should not rename yet; needs migration/read fallback. |
| `src/lib/clarification/evaluate-sandbox-readiness.ts` | line 176 `MiroFish` | generated prompt/question copy | Safe to rename display/generated copy now. |
| `src/lib/destiny/storage.ts` | lines 3, 4 `mirofish.destiny-profile`, `mirofish.destiny-climate` | storage key | Should not rename yet; needs migration/read fallback. |
| `src/lib/entitlements/entitlement-engine.ts` | line 10 `mirofish.entitlements.local.v1` | storage key/entitlement invariant | Should not rename yet; preserve entitlement continuity. |
| `src/lib/feedback/storage.ts` | line 4 `mirofish.feedback-ledger.*` | storage key | Should not rename yet; needs migration/read fallback. |
| `src/lib/i18n.ts` | line 4 `mirofish.locale` | storage key | Should not rename yet; needs migration/read fallback. |
| `src/lib/llm/prompts/extract-people.ts` | line 11 `MiroFish` | prompt text/internal AI instruction | Safe to rename after confirming prompt golden cases. |
| `src/lib/llm/prompts/extract-situation.ts` | line 15 `MiroFish` | prompt text/internal AI instruction | Safe to rename after confirming prompt golden cases. |
| `src/lib/llm/prompts/fuse-destiny-situation.ts` | line 17 `MiroFish` | prompt text/internal AI instruction | Safe to rename after confirming prompt golden cases. |
| `src/lib/llm/prompts/generate-agents.ts` | line 19 `MiroFish` | prompt text/internal AI instruction | Safe to rename after confirming prompt golden cases. |
| `src/lib/llm/prompts/generate-integrated-findings.ts` | line 19 `MiroFish` | prompt text/internal AI instruction | Safe to rename after confirming prompt golden cases. |
| `src/lib/llm/prompts/generate-sandbox-events.ts` | line 18 `MiroFish` | prompt text/internal AI instruction | Safe to rename after confirming prompt golden cases. |
| `src/lib/llm/rate-limit.ts` | lines 21, 23, 24 `__mirofishLlmRateLimits` | internal global identifier | Should not rename yet unless all references are updated together; low external risk. |
| `src/lib/observability/audit-event.ts` | lines 4, 60, 62, 63, 64 `mirofish.observability.audit-events`, `__mirofishObservabilityStore` | storage key, internal global identifier | Storage key should not rename yet; global identifier can rename later with references. |
| `src/lib/payments/stripe.server.ts` | line 38 `MiroFish Paid Evidence Unlock` | metadata/payment product description | Safe to rename display metadata in rename task; verify Stripe/test expectations. |
| `src/lib/people/storage.ts` | line 5 `mirofish.key-people.*` | storage key | Should not rename yet; needs migration/read fallback. |
| `src/lib/persistence/sync-state.ts` | line 3 `mirofish.persistence-sync` | storage key | Should not rename yet; needs migration/read fallback. |
| `src/lib/preview/build.ts` | line 212 `MiroFish` | generated/user-facing copy | Safe to rename display copy now. |
| `src/lib/relations/storage.ts` | line 4 `mirofish.relation-graph.*` | storage key/read-only graph data | Should not rename yet; preserve graph continuity. |
| `src/lib/reports/build.ts` | line 39 `MiroFish 职场决策预览报告` | generated report title/test-visible output | Safe to rename with golden/report review. |
| `src/lib/reports/storage.ts` | line 4 `mirofish.report.*` | storage key | Should not rename yet; needs migration/read fallback. |
| `src/lib/runs/storage.ts` | line 4 `mirofish.simulation-run.*` | storage key | Should not rename yet; needs migration/read fallback. |
| `src/lib/safety/safety-verifier.ts` | lines 79, 83, 87 `MiroFish` | safety/generated copy | Safe to rename display copy only; do not change safety behavior. |
| `src/lib/safety/storage.ts` | line 4 `mirofish.safety-review.*` | storage key/safety review continuity | Should not rename yet; needs migration/read fallback. |
| `src/lib/seed-context/storage.ts` | line 3 `mirofish.seed-context.draft` | storage key | Should not rename yet; needs migration/read fallback. |
| `src/lib/server-writers/migration-proposal.ts` | line 238 `Project MiroFish` in SQL proposal text | generated docs/migration proposal text | Safe to rename generated text; verify snapshots/fixtures if added later. |
| `src/lib/support/support-drafts.ts` | line 14 `mirofish.support.drafts` | storage key | Should not rename yet; needs migration/read fallback. |
| `src/lib/support/support-repository.ts` | lines 13, 74, 76, 77, 78 `mirofish.support.repository`, `__mirofishSupportStore` | storage key, internal global identifier | Storage key should not rename yet; global identifier can rename later with references. |
| `supabase/migrations/0001_initial_schema.sql` | line 1 `Project MiroFish` | migration comment/metadata | Prefer not to edit applied migrations; leave historical comment or supersede in future migration docs. |
| `supabase/migrations/0001_mvp_core_schema.sql` | line 1 `Project MiroFish` | migration comment/metadata | Prefer not to edit applied migrations. |
| `supabase/migrations/0002_mvp_evidence_chain_contracts.sql` | line 1 `Project MiroFish` | migration comment/metadata | Prefer not to edit applied migrations. |
| `supabase/migrations/0003_paid_beta_writers.sql` | line 1 `Project MiroFish` | migration comment/metadata | Prefer not to edit applied migrations. |

## Files/Areas With No Old Brand References Found

- `README.md`
- `public/*`
- `src/types/*`
- root config/metadata files checked: `.gitignore`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`
- `pnpm-lock.yaml` is not present.
- No manifest or webmanifest file was found in the project tree.
- No `fish-in-space` product-identity references were found in audited files.

## Recommended Rename Strategy

### Display Brand Rename

Rename user-facing and generated display copy first:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/demo/page.tsx`
- `src/app/login/page.tsx`
- `src/app/app/start/page.tsx`
- `src/app/app/dashboard/page.tsx`
- `src/app/app/simple/page.tsx`
- `src/app/app/new/scene/page.tsx`
- `src/app/app/simulation/running/page.tsx`
- `src/app/app/archive/page.tsx`
- `src/app/app/settings/page.tsx`, excluding the `mirofish.*` localStorage prefix logic
- `src/app/app/admin/acceptance/page.tsx`
- `src/components/app-shell.tsx`
- `src/components/safety-downgrade-notice.tsx`
- `src/lib/preview/build.ts`
- `src/lib/reports/build.ts`
- `src/lib/safety/safety-verifier.ts`
- `src/lib/clarification/evaluate-sandbox-readiness.ts`
- `src/lib/payments/stripe.server.ts`

Keep the product meaning unchanged: AI life simulator, relationship/decision sandbox, evidence-backed claims, read-only relation graph, and safety downgrade before deeper generation or paid unlock.

### Package Name Rename

Rename package identity in a dedicated package task:

- Update `package.json` `name`.
- Regenerate or update `package-lock.json` in the same task.
- Run `npm install` or another lockfile-safe command so package metadata stays consistent.
- Do not rename the local directory or git remote in the same commit unless explicitly requested.

### Internal Storage Key Strategy

Do not directly replace `mirofish.*` storage keys in the first display rename. These keys preserve browser-local drafts and MVP continuity:

- `mirofish.seed-context.draft`
- `mirofish.locale`
- `mirofish.locale-change`
- `mirofish.agent-ecology.*`
- `mirofish.key-people.*`
- `mirofish.relation-graph.*`
- `mirofish.simulation-run.*`
- `mirofish.claim-ledger.*`
- `mirofish.report.*`
- `mirofish.safety-review.*`
- `mirofish.feedback-ledger.*`
- `mirofish.billing-support`
- `mirofish.support.repository`
- `mirofish.support.drafts`
- `mirofish.destiny-profile`
- `mirofish.destiny-climate`
- `mirofish.entitlements.local.v1`
- `mirofish.persistence-sync`
- `mirofish.observability.audit-events`
- `mirofish.calibration-profile.*`

If storage keys are renamed later, add a compatibility helper that reads old keys, writes new keys, and removes or preserves old keys only after migration is confirmed. Entitlement, safety, relation graph, and evidence-chain keys need the most caution.

### Docs Update Strategy

Do docs in two passes:

1. Current product docs and runbooks: rename `Project MiroFish`/`MiroFish` to the new brand in active docs.
2. Historical docs, whitepaper baseline, decision logs, handoff paths, and applied migrations: either preserve as history or add a short note that the old brand was the previous project name.

Avoid changing applied SQL migration files unless the team explicitly accepts historical migration churn.

## Risks

- localStorage key compatibility: Directly replacing `mirofish.*` keys will orphan existing browser-local drafts, reports, safety reviews, graph data, support drafts, and entitlement state.
- Package-lock mismatch: Changing `package.json` without updating `package-lock.json` will leave inconsistent package identity.
- Imports or TypeScript identifiers: `__mirofish...` globals and admin/header constants must be renamed together if changed. Simple display copy edits are safer than identifier renames.
- Route names: No old brand route segment was found, and routes should not be renamed in the first brand pass.
- Test snapshots/golden cases: No snapshot files were found, but golden/acceptance docs and generated report/prompt copy may be test-visible. Re-run `npm run check` and any future prompt/golden harness after copy changes.
- Admin env/header contracts: `MIROFISH_ADMIN_TOKEN` and `x-mirofish-admin-token` are deployed/configured contract names. Rename only with a staged fallback accepting both old and new names.
- Repository identity: The task references `cheng-Lokesh/fish-in-space`, but this checkout reports `origin` as `git@github.com:cheng-Lokesh/AI-.git`. Confirm remote/repo rename separately from product rename.
- Applied migration history: SQL migration comments include `Project MiroFish`. Editing applied migration files can create audit noise even if runtime behavior is unchanged.

## Exact Next Codex Task

Use this task for the next rename pass:

```text
You are working in cheng-Lokesh/fish-in-space.

Task:
Perform the display-brand rename only, using docs/BRAND_RENAME_AUDIT.md.

New display brand:
<NEW_BRAND>

Scope:
- Rename user-facing UI copy and metadata from MiroFish to <NEW_BRAND>.
- Rename generated/report/payment display strings from MiroFish to <NEW_BRAND>.
- Rename active docs references from Project MiroFish/MiroFish to Project <NEW_BRAND>/<NEW_BRAND> where they are current-facing.

Hard constraints:
- Do not rename files.
- Do not rename routes.
- Do not rename localStorage keys or browser event names.
- Do not rename MIROFISH_ADMIN_TOKEN or x-mirofish-admin-token.
- Do not edit package.json or package-lock.json.
- Do not edit applied supabase migration files.
- Preserve SafetyVerifier behavior, evidence_event_ids, read-only relation graph behavior, and entitlement invariants.

Verification:
- Run npm run check.
- Run rg for remaining MiroFish/mirofish/MIROFISH references and report intentional leftovers.
```
