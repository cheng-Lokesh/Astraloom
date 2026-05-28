# Project Astraloom Stability Roadmap

This document sets the default operating rhythm for slow, stable product progress.
It is intentionally stricter than a launch checklist: the goal is a complete,
trustworthy, cost-controlled product before public release pressure.

## Product Standard

Project Astraloom should earn payment intent by making users feel three things:

- The product understands their concrete situation and important people.
- The product turns that situation into a visible agent ecology instead of a
  generic advice answer.
- The locked report clearly promises deeper timeline, relationship tension,
  risk-window, evidence, and action-strategy value.

## Engineering Standard

- Ship one narrow stage at a time.
- Keep every system-owned writer read-only until a separate explicit
  authorization phase changes that constraint.
- Keep AI, Stripe, service-role clients, migrations, report unlocks, feature
  flags, and deployments disabled unless a future task explicitly authorizes
  them.
- Prefer low-cost local or fixture-backed value before high-cost model calls.
- Every meaningful change should leave a durable doc update and pass reusable
  QA scripts.

## Product Progression

1. Keep the writer safety trail coherent through Stage74 so the project state
   remains resumable and no real system-owned writes leak in.
2. Improve the user-facing MVP loop: intake, people confirmation, agent ecology,
   simulation shell, safety, locked report, billing, and sync.
3. Add stronger free preview value without real AI calls: structured insights,
   visible relationship tension, evidence anchors, and locked paid sections.
4. Define AI generation budgets, prompt gates, cache strategy, abuse limits, and
   failure compensation before enabling any model-backed workflow.
5. Define Stripe entitlement, webhook idempotency, refund, support, and report
   unlock gates before enabling any paid write path.

## Cost Discipline

- Free daily or preview experiences must not scan all NPC relationships with
  model calls.
- Deep simulation must have per-run token ceilings, tick limits, retry caps,
  and hard monthly budget controls before launch.
- Reports must degrade gracefully to safe placeholders when generation,
  evidence, or safety checks fail.

## Stability Gates

Before considering public launch, the project must prove:

- Full manual user flow works after refresh.
- Browser writes remain limited to user-authored tables.
- Server-owned artifacts remain protected by RLS and writer gates.
- Locked report copy does not imply deterministic fate, professional advice, or
  access to third-party private thoughts.
- QA scripts cover build, lint, migration guard, secret scan, route checks, and
  current stage API invariants.

## Current Operating Mode

Proceed gradually. Stage72 and Stage73 are complete as read-only remediation and
remediation review surfaces after the Stage71 no-go packet. The immediate
engineering task is Stage74, a read-only no-go packet over Stage73. After that,
shift priority toward product value surfaces that increase user trust and
payment intent while remaining local-first and low cost.

## Current MVP Launch Loop

- The public-facing path now prioritizes Chinese career decisions instead of the
  internal writer workbench.
- `/demo` provides the fastest product proof: deterministic Agent ecology,
  scenario paths, timeline signals, risk windows, next actions, and locked paid
  report sections.
- `/intake` through `/billing` forms a basic usable loop with local draft
  persistence, free report preview, safety degradation, and unlock-intent
  collection.
- AI, Stripe, service-role clients, server-owned writes, and report unlocks
  remain disabled.
