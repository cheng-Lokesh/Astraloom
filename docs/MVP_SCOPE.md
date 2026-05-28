# Project Astraloom MVP Scope

This file defines what belongs in the MVP and what must wait.

## MVP Goal

The MVP validates one core belief:

Users will trust and pay for Astraloom if their real situation is transformed into recognizable digital agents, a readable relationship graph, event-backed scenario evolution, and evidence-linked claims.

## Required MVP Loop

MVP implementation must converge on:

1. Problem and time horizon definition.
2. Context intake through natural-language situation telling.
3. Key people extraction.
4. People confirmation, merge, deletion, rename, and supplement.
5. Agent Profile generation for the user, parallel selves, and key NPCs.
6. Read-only Relation Graph generation.
7. Simulation Tick execution.
8. Event Log creation.
9. Claim building with `evidence_event_ids`.
10. Result sandbox with graph, timeline, cards, and evidence chain.
11. Paid unlock for deeper evidence and strategy.
12. Feedback calibration.

## MVP Routes

Target route family:

- `/login`
- `/app/dashboard`
- `/app/new/scene`
- `/app/new/intake`
- `/app/new/agents`
- `/app/new/graph`
- `/app/simulation/running`
- `/app/simulation/result`
- `/app/settings`
- `/app/support`
- `/admin` only when explicitly scoped and protected

The current codebase may expose older or simpler routes while migrating toward this structure. New work should move toward the target route family without breaking existing stable flows unless the task explicitly includes migration.

## In Scope

- Next.js, TypeScript, Tailwind app shell.
- Supabase auth and user-owned data.
- Seed Context local and/or database persistence.
- Key People extraction and confirmation.
- Agent Profile contracts.
- Relation Edge contracts.
- Read-only relationship graph.
- Deterministic local preview logic before real LLM calls.
- Simulation Tick v0.
- Event Log v0.
- Claim Builder v0.
- Report page that traces claims to evidence.
- Safety downgrade states.
- Support, refund, deletion, and failure-state entry points.
- Payment wall mock before real payment writes.

## Out Of Scope For MVP

- Full social/community features.
- Open world life game.
- Continuous RPG-style choices during a running simulation.
- Editable graph edge weights.
- Broad all-life multi-domain prediction in one run.
- Thousand-agent simulations.
- Native mobile apps.
- Enterprise admin systems.
- Astrology knowledge-base product.
- Free full-depth NPC scans.
- Real privileged backend writes before explicit approval gates.
- Stripe writes, report unlocks, AI calls, or service-role Supabase clients unless the task explicitly opens and verifies those gates.

## Track A And Track B

Track A is a concrete crossroads simulation:

- One main question.
- 30 or 90 day window.
- High focus on key people and short-to-medium relationship dynamics.

Track B is a long-horizon climate view:

- One theme domain.
- 1, 3, or 5 year horizon.
- Coarser quarterly or annual trend windows.
- No precise daily predictions or deterministic fate claims.

Track B must not become a vague marketing paragraph. It remains a lightweight relationship and life-climate sandbox view.

## Scope Control Rule

If a proposed feature does not improve Agent recognition, Relation Graph credibility, Event Log traceability, Claim evidence, paid evidence depth, safety, cost control, or feedback calibration, it should not enter the MVP.

