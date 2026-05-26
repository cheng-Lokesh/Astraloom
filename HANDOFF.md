# MiroFish Handoff

Date: 2026-05-27

This handoff is for starting a fresh Codex conversation in:

`C:\Users\clf04\Documents\AI推演\mirofish-app`

## Current Product Direction

We are improving local product completeness, not launch readiness.

Core product shape:

`Seed Context -> Key People -> Agent Profiles -> Relation Graph -> Simulation Ticks -> Event Logs -> Claims -> Report -> Feedback Calibration`

Important invariants to preserve:

- Relation Graph is read-only for users.
- Simulation transitions are deterministic local logic, not LLM-decided.
- Event Logs must exist before Claims.
- Every visible Claim must have `evidenceEventIds`.
- Full-depth mode must use the same Claim IDs and must not raise confidence or change risk level.
- Feedback affects future calibration only and must not mutate historical Event Logs, Claims, or Reports.
- Safety gates must not be weakened or bypassed by full-depth/paid-depth flows.
- Do not add Stripe, real payment, production database writes, deployment work, or service-role writers.

## Recent Work Completed

### Relation Graph Sandbox

`/app/new/graph` was upgraded into a stronger read-only Relation Graph scenario sandbox:

- Better page structure.
- Node type visual distinction.
- Edge labels with relationship type and confidence.
- Edge Drawer with user-language explanations.
- Weight explanations for trust, hostility, dependency, attraction, competition, information gap, resource control, and emotional debt.
- Graph insight cards.
- Evidence refs disclosure.
- Graph Lock state.
- Regenerate-from-upstream-facts path.
- Simulation start blocked until graph is locked.

### Simulation Running

`/app/simulation/running` was upgraded into a visible simulation process:

- Stage progression UI.
- Tick preview cards.
- Branch summary cards.
- Event Log count.
- Gate checklist.
- Not-ready and blocked states with fixes.
- Completion CTA to `/app/simulation/result`.

Review fixes applied:

- Branch colors corrected.
- Active stage fill bar uses animated width.
- Timeline/Event Log components reused where appropriate.

### Timeline / Event Log Components

Reusable event evidence display components were created under `src/components/simulation/`:

- `TimelineFeed`
- `TickGroup`
- `EventCard`
- `EdgeDeltaView`
- `AgentRefsView`
- `RelationEdgeRefsView`
- `EvidenceRefsView`
- `ConfidenceExplanation`

Review fixes applied:

- Confidence buckets expanded to match design.
- Weight labels made more user-readable.
- Evidence refs and confidence explanations made clearer.

### Claim Builder / Report Engine

Claim and report value was improved:

- Claims are more readable and remain evidence-backed.
- Claims without evidence are hidden from visible report surfaces.
- Free preview includes useful summary risk, summary claims, coarse timeline, and limited evidence count.
- Full-depth includes full claims, event chain, involved agents, relation edge deltas, branch comparison, and strategy options linked to Claim IDs.
- Full-depth remains deeper, not more certain.

### Result Sandbox

`/app/simulation/result` was upgraded into the main product payoff:

- Better summary.
- Evidence-first Claim cards.
- Timeline integration.
- Evidence Drawer integration.
- Graph/Agent/Edge highlight interactions.
- Branch comparison.
- Strategy options.
- Feedback panel integration.
- Local full-depth boundary without real payment.
- Empty/no-evidence state.

Review fixes applied:

- Branch Comparison is visible outside full-depth.
- Edge selection behavior made less aggressive.
- Relation Graph snapshot made less overwhelming.
- Claim labels improved.
- Full-depth invariant copy moved closer to the local full-depth toggle.

### Feedback Calibration

Local Feedback Calibration was improved:

- Feedback supports claim, agent, relation edge, strategy, and overall targets.
- Rating options include accurate, partly right, off, useful, not useful, unclear, and not happened yet.
- Agent correction notes.
- Relation edge correction notes.
- Strategy usefulness feedback.
- CalibrationProfile summary.
- Clear copy that feedback affects future runs only.
- Local feedback persistence preserved.

Review fixes applied:

- `agent_field_correction` is consumed in calibration profile building.
- `agentCorrections` and `relationCorrections` are applied to next-run calibration without mutating historical data.
- Correction field paths were aligned with actual profile/edge structures.

### Safety UX

SafetyVerifier user-facing experience was improved:

- Better `SafetyDowngradeNotice`.
- Clear safe/caution/downgraded/blocked display.
- Concrete next steps.
- Support/appeal link where appropriate.
- Consistent safety copy across product pages.
- Humane but firm blocked states.

Safety core should remain untouched unless a future task explicitly requires display-only safety work.

### Archive / Settings / Support

Auxiliary product pages were improved:

- `/app/archive`: local simulations, reports, draft/history cards, feedback summary, empty states.
- `/app/settings`: language, privacy, local data, product boundaries, local data status.
- `/app/support`: local support ticket drafts for generation failure, safety appeal, privacy delete request, general support, and billing question placeholder.

Important: support/billing/delete flows are local placeholders only. No real refund, deletion execution, production admin, or backend write should be added.

### Golden Cases

`src/lib/golden-cases/full-product-cases.ts` was expanded to cover 12 local deterministic Golden Cases:

1. career conflict
2. relationship crossroad
3. collaboration risk
4. family boundary
5. self-direction
6. Track B climate
7. caution
8. downgraded
9. blocked
10. high information gap
11. high resource control
12. low-confidence input

The acceptance runner now verifies:

- SeedContext exists.
- Safety level matches expectation.
- KeyPeople are extracted.
- Agents are generated.
- RelationGraph is built and locked.
- Simulation has ticks/events.
- Event Logs exist before Claims.
- Claims have `evidenceEventIds`.
- Report uses Claims.
- Case-specific expectations pass.
- Entitlement/full-depth invariants hold.
- Feedback does not mutate history.
- Generated copy avoids forbidden deterministic/payment language.

`src/app/app/admin/acceptance/page.tsx` now shows:

- Safety coverage summary.
- Track coverage summary.
- Per-case safety and track badges.
- Key People, Agents, Edges, Events, Claims, and Ticks metrics.

## Latest Verification

The latest completed checks:

```powershell
cd C:\Users\clf04\Documents\AI推演\mirofish-app
npm run check
```

Result: passed.

The built app acceptance route was also checked locally:

```powershell
npm run start -- -p 3060
curl http://127.0.0.1:3060/app/admin/acceptance
```

Observed:

- `Golden Cases Passed`
- `Safety coverage`
- `Track coverage`

## Known Worktree State

The worktree has many modified files from the recent product-completeness pass. Do not assume unrelated changes are yours. Before future edits, inspect scope with:

```powershell
git status --short
git diff -- <path>
```

Recent directly edited files from the last task:

- `src/lib/golden-cases/full-product-cases.ts`
- `src/app/app/admin/acceptance/page.tsx`
- `HANDOFF.md`

There are many other modified files from earlier tasks in the same product pass. Do not revert them unless the user explicitly asks.

## Suggested Next Conversation Prompt

Use this in the next fresh conversation:

```text
You are working in cheng-Lokesh/AI- at C:\Users\clf04\Documents\AI推演\mirofish-app.

Read HANDOFF.md first.

Continue improving local product completeness only.
Do not touch Stripe, real payment, production database writes, deployment, or service-role writers.
Preserve SafetyVerifier gates, evidence_event_ids, read-only graph, Event Logs before Claims, and full-depth invariants.

Start by running:
npm run check

Then inspect the specific files for the new task before editing.
```

## Practical Notes

- Use `rg` for search.
- Use `apply_patch` for manual edits.
- This is a Next.js app.
- Keep local sample/localStorage flows working.
- Avoid deterministic future language.
- Do not turn the app into a CRM, RPG, fortune-telling app, or generic chatbot.
- For frontend work, verify with browser/local route checks when meaningful.

