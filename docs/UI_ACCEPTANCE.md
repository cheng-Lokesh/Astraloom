# Project MiroFish UI Acceptance

This file defines product and UX acceptance rules for MiroFish screens.

## Global UI Rule

The first impression must be a scenario sandbox, not a chatbot, not a fortune report, and not a marketing landing page.

## Required MVP Screens

## Formal Product Routes

Primary product navigation must use the formal route family:

- `/`
- `/login`
- `/app/dashboard`
- `/app/new/scene`
- `/app/new/intake`
- `/app/new/people`
- `/app/new/agents`
- `/app/new/graph`
- `/app/simulation/running`
- `/app/simulation/result`
- `/app/archive`
- `/app/settings`
- `/app/support`
- `/app/billing`
- `/app/admin`

Compatibility routes may remain for older links, but they must not be used as
primary navigation:

- `/people`
- `/agents`
- `/runs`
- `/reports`

The accepted main-flow path is:

`/app/dashboard -> /app/new/scene -> /app/new/intake -> /app/new/people -> /app/new/agents -> /app/new/graph -> /app/simulation/running -> /app/simulation/result`

### Dashboard

Must show:

- New simulation entry.
- Recent simulation snapshot.
- Low-cost daily sandbox weather only when enough cached data exists.
- Support/settings access.

Must not show:

- Fate predictions.
- Fear-based payment hooks.
- Chat-first interface as the main product surface.

### Scene And Question

Must show:

- Track A / Track B selection.
- Scenario or theme selection.
- Time horizon selection.
- Main question or theme domain.
- Forbidden actions / action boundaries.

Must not allow:

- Multiple unrelated domains in one MVP run.
- Deterministic long-life prediction.

### Intake

Must feel like structured situation telling.

Must include:

- Natural-language context input.
- Recent events.
- Key people hints.
- Worries and decision options.
- Safety/action boundaries.

Must not feel like:

- A dry questionnaire.
- A mystic birth-chart form as the main experience.

### Key People Confirmation

Must show each candidate with:

- `display_name`
- `relationship_to_user`
- `role_type`
- `confidence`
- `known_evidence`
- `missing_fields`

User may:

- Confirm.
- Delete.
- Rename.
- Merge duplicates.
- Add one short natural-language note.
- Supplement a missing person.

User must not:

- Edit trust, hostility, dependency, attraction, competition, resource control, or any edge weight.

### Agent Confirmation

Must show:

- User core agent.
- Parallel self variants.
- Confirmed NPC agents.
- Source and confidence.
- Missing/low-confidence fields.

Must optimize for:

- "Does this feel like me and the people around me?"

### Relation Graph

Must be a read-only relation ledger, not a CRM-style relationship editor.

Must show:

- User core.
- Parallel selves when available.
- Key NPCs.
- Relation types.
- Confidence.
- Strength ranges.
- Evidence entry points.
- Graph Lock status.
- Strongest pressure edge.
- Largest information gap.
- Most stable support edge.
- Edge Drawer with user-language explanations:
  - `trust` = 信任基础
  - `hostility` = 冲突压力
  - `dependency` = 依赖程度
  - `informationGap` = 信息差
  - `resourceControl` = 资源控制
  - `emotionalDebt` = 情绪债务
- `evidenceRefs` inside a collapsed disclosure area.

Graph Lock rules:

- Draft graph may be saved locally before simulation.
- Locked graph state must persist with the relation graph draft.
- After locking, the graph page must not provide controls to modify people or relation edges.
- Users may only return to People to supplement facts, then regenerate the graph from the product flow.
- The same graph components should be reusable in Result Sandbox surfaces.

Must not show:

- Edge-weight sliders.
- Editable relation controls.
- Direct inputs for `trust`, `hostility`, `dependency`, or any relation weight.
- CRM-like relationship management UI.

### Simulation Running

Must show execution stages:

- Freeze graph.
- Build tick queue.
- Run agent interactions.
- Update relation edges.
- Write Event Log.
- Build Claims.
- Prepare report preview.

Must show:

- Tick previews.
- Branch names: `baseline`, `cautious_self`, and `decisive_self`.
- Generated Event Log count.
- Concrete fixes for blocked or not-ready states.

Must not:

- Ask the user to make continuous story choices mid-run.
- Hide failures behind vague loading text.

### Result Sandbox

Must prioritize:

- Graph.
- Time slices.
- Timeline Feed.
- Conclusion cards.
- Evidence chain.
- Paid unlock modules.

Report Engine v1 must show:

- Free preview and paid full-report depth from the same evidence-backed
  `claim_id` set.
- Overall risk in free preview.
- 1-2 summary Claims in free preview.
- Vague timeline and limited evidence count in free preview.
- Unlock CTA that describes evidence and strategy depth only.
- Full Claims in paid view.
- Full EventLog chain in paid view.
- Full involved agents and relation edge deltas in paid view.
- Branch comparison in paid view.
- Strategy options in paid view, with every strategy linked to a `claim_id`.
- Evidence drawer for every visible Claim.

Report Engine v1 must not:

- Show Claims without `evidence_event_ids`.
- Create new Claims during paid unlock.
- Raise confidence during paid unlock.
- Change `riskLevel` during paid unlock.
- Frame paid depth as more certain than the free preview.

Click behavior:

- Clicking a Claim highlights related Agent Profiles, Relation Edges, and Event Logs.
- Clicking an Event returns the graph to the relevant tick snapshot when available.
- Clicking a Relation Edge shows before/after changes and evidence.

### Paid Unlock

Must explain unlock value:

- Specific NPC paths.
- Complete Event Log.
- Relation before/after.
- Parallel-self differences.
- Key variables.
- Strategy guide.

Must not:

- Promise certainty.
- Create fear pressure.
- Claim paid results are more true.
- Bypass safety downgrade.

### Feedback And History

Must allow:

- Claim accuracy feedback.
- Agent mismatch feedback.
- Relation judgment feedback.
- Strategy usefulness feedback.

Must show:

- Stored simulation history.
- Unlock status.
- Feedback status.

## Copy Review Checklist

Before shipping a UI change, check:

- No astrology/fortune-telling identity language.
- No mind-reading language.
- No deterministic fate language.
- No professional advice overreach.
- No fear-based payment prompt.
- No engineering jargon in primary user-facing copy.
- No mojibake or encoding corruption.
- User can see Agent, graph, timeline, evidence, or calibration value.
