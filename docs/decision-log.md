# Project Astraloom Decision Log

This file records decisions that should survive context resets.

## DEC-001: Implementation Is The Main Track

Decision: The default task is implementing the project, not enriching the whitepaper.

Consequence: Continue shipping code, routes, docs, QA scripts, and safe local verification unless the user explicitly asks for whitepaper work.

## DEC-002: Language Support Comes Early

Decision: The app supports English and Chinese from the early MVP.

Consequence: The founder can work in Chinese while the primary target users can use English. New user-facing pages should keep bilingual copy aligned with the existing language provider.

## DEC-003: Astraloom-Like Agent Ecology Is The Product Core

Decision: The product should feel like a living micro-agent ecology, not a generic fortune report.

Consequence: Future simulation work should keep individual agents, relationships, visible ecology, scenario timelines, and emergent interactions at the center.

## DEC-004: Free Daily Weather Must Stay Low Cost

Decision: Free daily weather uses low-cost macro signals and the user's own baseline profile only.

Consequence: Free daily weather must not scan every NPC with LLM calls. Deep relationship scans belong behind paid or explicit high-cost flows.

## DEC-005: MVP Relationship Graph Is Read-Only

Decision: MVP graph confirmation happens through chat-style confirmation, not manual edge-weight editing.

Consequence: Do not build editable graph sliders or CRM-like relationship controls in the MVP. Visual graphs are evidence and orientation surfaces.

## DEC-006: Time Horizon Is Split Between MVP And Vision

Decision: MVP prioritizes 30/90-day concrete simulations. The 3-5 year generalized Track B remains a product vision and later feature.

Consequence: Near-term flows can stay specific and reliable while the broader time horizon is preserved in product strategy.

## DEC-007: Server Writers Stay Read-Only Until The Gate Is Real

Decision: System-owned artifacts are modeled through read-only writer stages before any real write implementation.

Consequence: Every writer stage must expose intent, invariants, blocked probes, and false runtime flags before real persistence is considered.

## DEC-008: Long Public Routes Use Short Internal Routes

Decision: Very long public stage URLs should be served through short physical App Router folders and `next.config.ts` rewrites.

Consequence: Public route semantics remain stable while Windows `.next` path length failures are avoided.

## DEC-009: Context Belongs In Files

Decision: Persistent implementation memory lives in compact docs and scripts instead of long chat repetition.

Consequence: Use `docs/implementation-state.md`, `docs/stage-index.md`, `docs/decision-log.md`, and `scripts/*.ps1` as the recovery source after context compaction.

## DEC-010: Stability And Paid Value Are The Product Bar

Decision: The project should progress deliberately toward a complete, stable, accurate product that creates payment pull before launch pressure.

Consequence: Future work should improve user-visible value, reliability, safety, and cost control together; do not add expensive AI calls, Stripe writes, deployments, report unlocks, or privileged backend writes until the gates are explicit and verified.
