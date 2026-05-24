# Project MiroFish UI Acceptance

This file defines product and UX acceptance rules for MiroFish screens.

## Global UI Rule

The first impression must be a scenario sandbox, not a chatbot, not a fortune report, and not a marketing landing page.

## Required MVP Screens

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

Must be read-only.

Must show:

- User core.
- Parallel selves when available.
- Key NPCs.
- Relation types.
- Confidence.
- Strength ranges.
- Evidence entry points.

Must not show:

- Edge-weight sliders.
- Editable relation controls.
- CRM-like relationship management UI.

### Simulation Running

Must show execution stages:

- Freeze graph.
- Build tick queue.
- Run agent interactions.
- Write Event Log.
- Build Claims.
- Prepare report preview.

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

