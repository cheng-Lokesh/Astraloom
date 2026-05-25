# Project MiroFish Development Log

## 2026-05-24 - Full Product Roadmap Lock

Stage type: documentation-only product direction lock.

Current state recorded:

- Project MiroFish is currently a Local MVP.
- Existing local-first flows must remain available.
- Supabase, LLM, payment, entitlement, and system-writer capabilities are not
  newly enabled by this stage.

Target state recorded:

- Project MiroFish is now explicitly aimed at a Full Product roadmap.
- Future development is locked to the product loop:
  `Seed Context -> Key People Extraction -> Agent Profiles -> Relation Graph -> Simulation Engine -> Event Log -> Claims -> Reports -> Feedback Calibration`.
- The target architecture is Next.js App Router, Supabase Auth/Postgres/RLS,
  repository layer, structured LLM generation, deterministic simulation core,
  SafetyVerifier hard gate, Report Engine, Entitlement Engine, Feedback
  Calibration Engine, Admin/Ops dashboard, and cost/prompt observability.

Documents created:

- `docs/FULL_PRODUCT_ROADMAP.md`
- `docs/ARCHITECTURE_TARGET.md`
- `docs/PRODUCT_PHASES.md`

Product boundaries reaffirmed:

- Do not build MiroFish into a generic chatbot.
- Do not build a fortune-telling or astrology product.
- Do not build a therapy product.
- Do not build mind-reading claims.
- Do not build a CRM or manual relationship editor.
- Do not build an RPG or open-ended story game.

Implementation boundaries for this stage:

- No page code changes.
- No database connection changes.
- No LLM integration changes.
- No payment integration changes.
- No deletion of existing local flows.

Acceptance evidence:

- Roadmap, target architecture, and product phases documents define Local MVP as
  the current state and Full Product as the target state.
- Development log records this stage.
- `npm run build` should remain unaffected because only docs were changed.

## 2026-05-24 - Formal Product Route Migration

Stage type: route and UX consolidation.

Current state recorded:

- Project MiroFish keeps the Local MVP logic and local draft flows.
- Short product routes existed for dashboard, intake, people, agents, runs,
  reports, and billing.

Changes recorded:

- Formal product navigation now points to `/app/...` routes.
- Main flow is locked to:
  `/app/dashboard -> /app/new/scene -> /app/new/intake -> /app/new/people -> /app/new/agents -> /app/new/graph -> /app/simulation/running -> /app/simulation/result`.
- `/people`, `/agents`, `/runs`, and `/reports` remain as compatibility
  redirects and are not used as primary navigation.
- `/dashboard`, `/intake`, and `/billing` also redirect to their formal
  product paths.
- `/app/archive`, `/app/billing`, and `/app/admin` now have formal route
  surfaces without enabling database, LLM, payment, or privileged writer
  behavior.
- `docs/UI_ACCEPTANCE.md` now lists the formal route family.

Implementation boundaries for this stage:

- No Agent, Relation, Tick, or Claim logic changes.
- No Supabase connection changes.
- No LLM integration changes.
- No payment integration changes.
- Relation Graph remains read-only.

Acceptance evidence:

- `npm run lint` and `npm run build` must pass for this migration.

## 2026-05-24 - Repository Layer Local Adapter Migration

Stage type: localStorage to Repository migration.

Current state recorded:

- Project MiroFish remains a Local MVP.
- The existing localStorage draft files are still the active persistence
  adapter.
- Supabase schema and auth helpers exist, but this stage does not replace local
  drafts with authenticated database writes.

Changes recorded:

- Added page-facing repository modules under `src/lib/repositories`.
- Repository operations now return the uniform envelope
  `{ ok, data, errorCode, traceId }`.
- Repositories expose `load`, `save`, `list`, `clearDraft`, and `markDeleted`.
- Main app pages now call repositories instead of importing domain `storage.ts`
  files directly.
- The default provider remains `localStorage`; Supabase adapters are reserved
  but disabled for this stage.

Implementation boundaries for this stage:

- No Agent, Relation, Tick, Claim, Safety, LLM, payment, or auth enforcement
  logic was changed.
- No existing localStorage flow was deleted.
- Relation Graph remains read-only.

Acceptance evidence:

- Page-level concrete `storage.ts` imports have been removed.
- `npm run lint` passed on 2026-05-24.
- `npm run build` passed on 2026-05-24.

## 2026-05-24 - SafetyVerifier Hard Gate v1

Stage type: Safety hard gate.

Current state recorded:

- Project MiroFish remains a Local MVP with local deterministic generation.
- No LLM, payment unlock, Supabase persistence replacement, or new professional
  advice flow is enabled by this stage.

Changes recorded:

- Added deterministic SafetyVerifier modules under `src/lib/safety`.
- Added `SafetyDowngradeNotice` for blocked and downgraded UI states.
- Intake submit runs SafetyVerifier before saving a runnable scenario.
- Simulation running runs SafetyVerifier before queueing or rebuilding ticks.
- Report rendering runs SafetyVerifier before showing Claims and filters
  high-risk Claims in downgraded mode.
- Paid unlock requests run SafetyVerifier before checkout or unlock intent and
  cannot proceed when safety is downgraded or blocked.

Implementation boundaries for this stage:

- No monitoring, tracking, revenge, coercion, professional advice, third-party
  mind-reading, deterministic fate, or guaranteed reconciliation output was
  added.
- Existing local flows remain present, but safety can block generation and
  unlock actions.

Acceptance evidence:

- Ordinary relationship/workplace input remains eligible for the local flow.
- High-risk input is designed to trigger downgraded or blocked mode.
- `npm run lint` passed on 2026-05-24.
- `npm run build` passed on 2026-05-24.

## 2026-05-24 - LLM Key People Extraction v1

Stage type: LLM extract people.

Current state recorded:

- LLM is allowed only for Key People candidate extraction.
- Agent Profile generation, RelationEdge generation, Claim generation, and
  Report generation remain outside this stage.
- SafetyVerifier remains the first gate before model calls.

Changes recorded:

- Added a Zod-validated `/api/key-people/extract` route.
- Added LLM client, model config, extract-people prompt, output validator, and
  model call log entrypoint.
- Added local fallback to existing `extractPeopleCandidates` for missing keys,
  timeout, invalid JSON, schema failure, forbidden private-thought inference, or
  SafetyVerifier downgrade/block.
- People confirmation UI can request smart identification and falls back safely
  without breaking the local flow.

Implementation boundaries for this stage:

- No Agent Profiles are generated by the LLM.
- No RelationEdges or edge weights are generated or modified by the LLM.
- No Claims or Reports are generated by the LLM.
- The prompt forbids third-party hidden-thought, love, betrayal, deception, and
  deterministic outcome judgments.

Acceptance evidence:

- Legal LLM JSON is converted into `KeyPersonDraft` candidates.
- Invalid or unavailable LLM output returns local fallback candidates.
- API failure is handled by the UI without crashing.
- `npm run lint` passed on 2026-05-24.
- `npm run build` passed on 2026-05-24.

## 2026-05-24 - LLM Agent Profile Drafting v1

Stage type: LLM generate agents.

Current state recorded:

- LLM is allowed only to draft Agent Profile fields.
- LLM still cannot generate Claims, Reports, RelationEdges, edge weights,
  deterministic futures, or run simulation.
- SafetyVerifier remains the first gate before model calls.

Changes recorded:

- Replaced `/api/agents/generate` with a Zod-validated draft-generation route.
- Added `generate-agents` prompt and Agent Profile schema validation.
- Agent Profile JSON now includes field-level `fieldSources` using
  `user_confirmed`, `chat_inferred`, `default`, and `model_inferred`.
- LLM output is converted into `AgentProfileDraft[]` only after schema and
  forbidden-inference checks.
- Illegal, missing, unsafe, or unavailable LLM output falls back to
  `buildAgentProfiles`.
- Safety downgraded mode returns conservative local fallback agents without
  calling the model.

Implementation boundaries for this stage:

- No RelationEdge generation or edge weight editing was added.
- No Claim, Report, or simulation execution was added.
- User-confirmed Key People fields override model-inferred fields.
- Model-inferred fields are capped at lower confidence.
- Default fields are recorded as `default` and cannot support high-confidence
  Claims.

Acceptance evidence:

- `npm run lint` passed on 2026-05-24.
- `npm run build` passed on 2026-05-24.

## 2026-05-24 - Entitlement Engine Mock Paid Unlock v1

Stage type: entitlement and mock paid unlock.

Current state recorded:

- Project MiroFish remains a Local MVP.
- No Stripe checkout, real collection, webhook, production payment write, or
  service-role entitlement grant is enabled by this stage.
- Report Engine v1 remains downstream of evidence-backed Claims.

Changes recorded:

- Added local Entitlement Engine modules under `src/lib/entitlements`.
- Default local entitlement is `free_preview`.
- Billing now provides a mock `paid_report` unlock scoped to the current report
  id.
- Result Sandbox gates full report depth through entitlement and SafetyVerifier
  state.
- Paid report depth unlocks full evidence chain and strategy depth only.

Implementation boundaries for this stage:

- Mock unlock does not create or modify Claims.
- Mock unlock does not change confidence or riskLevel.
- Mock unlock does not bypass `downgraded` or `blocked` SafetyVerifier states.
- Billing copy avoids fear marketing and does not claim payment reveals truth or
  deterministic prediction.

Acceptance evidence:

- Free preview and paid report are represented as different local entitlement
  states.
- `claim_id`, confidence, and riskLevel invariants are carried in the
  entitlement decision.
- `npm run lint` passed on 2026-05-24.
- `npm run build` passed on 2026-05-24.
