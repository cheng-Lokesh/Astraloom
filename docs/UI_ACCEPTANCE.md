# Project Astraloom UI Acceptance

This file defines product and UX acceptance rules for Astraloom screens.

## Global UI Rule

The first impression must be a scenario sandbox, not a chatbot, not a fortune report, and not a marketing landing page.

## Required MVP Screens

## Formal Product Routes

Primary product navigation must use the formal route family:

- `/`
- `/login`
- `/app/dashboard`
- `/app/new/scene`
- `/app/new/life-climate`
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

Simple Mode may be used as a primary low-friction entry route while the advanced
route family remains available:

- `/app/simple`

Simple Mode must ask only for basic destiny/birth context, one free-form current
question description, a time window, and consent/safety acknowledgement. It must
derive people, situation structure, agent profiles, graph, events, claims, and
evidence from that input instead of reintroducing a long questionnaire.

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

### My Sandbox dashboard (M2.0 candidate)

The authenticated dashboard is a calm personal life ledger, not an Observatory,
marketing Hero, or generic card grid. It orients the person, shows the current
server-backed chain, then provides one next action.

Must show, from the account API only:

- `My Sandbox / 我的沙盘` and a clear personal digital-life framing.
- Submitted Seed/Reality readiness, confirmed People count, immutable Agent
  count, Graph lock and edge count, running state, latest completed Run,
  bounded History, recent Feedback presence, and exactly one next action.
- Explicit `尚未建模` labels for life climate, resources, constraints, next
  change, and any Reality detail without an authoritative database field.
- A Reality Profile ledger that visibly separates `事实`, `假设`, and `未知项`.
- People are labeled by their stored role (`本人`, `平行自我`, or `关键人物`);
  relationship endpoints use member display labels, never internal ordinal keys.

- Authenticated users can open `/app/reality-profile` from My Sandbox, review
  life climate, resources, and constraints individually, and add or remove
  entries for goals, values, life themes, pressures, and external variables.
  Each entry is independently labeled as fact, assumption, or explicitly
  unknown. All five new dimensions begin unknown and are never inferred without
  user input. Saving keeps recoverable error and conflict feedback. My Sandbox
  names these dimensions, shows their fact/assumption/unknown counts, explains
  their role in completing the digital-life model, and links to the editor.
  The page must not show raw scenario text, evidence URLs,
  IDs, trace data, or diagnostic/deterministic wording.
  Facts must name their safe account-backed basis; absent persisted assumptions
  stay empty rather than being inferred. A World State panel may show only the
  current formal-chain stage and allowlisted Change Node labels with a safe
  evidence summary. It must not render event/trace/evidence identifiers,
  raw scenario text, or internal keys.
- Loading, anonymous, empty, partial, running, completed, and error states.
  Error state must not retain or invent a previous local projection.

Must not show:

- `ONLINE`, `LIVE`, `READY`, static recent cases, fake percentages, simulated
  account status, Career nodes, or a claim that a digital self already exists.
- Raw IDs, raw scenario text, email, credentials, local repository data, or a
  localStorage fallback.

Primary navigation must make My Sandbox, Start, People, Graph, Running, and
History reachable on desktop and mobile. Result is reached from a specific
Running or History link, never as a no-Run-id primary destination. Every
interactive target is at least 40px, has visible keyboard focus, uses
`active:scale-95`, and respects reduced motion by limiting interaction motion to
transform and opacity.

People, Agents, and Graph are also direct account-exploration destinations.
Their no-selector mode shows only the current formal chain and safe summary
labels. People keeps the explicit Start confirmation or supplement path;
Agents distinguishes 本人, 平行自我, and NPC while marking unavailable
confidence or missing-field detail as 尚未建模; Graph is read-only and must
never render internal identifiers or raw evidence references. When no current
Run exists, Running must show an honest empty state; History exposes completed
30 and 90 day server-filtered views and only completed entries link to Result.

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

### Track B life-climate path candidate

The formal Start page exposes a direct Track B entry alongside Track A. The
`/app/new/life-climate` surface must:

- Read only the authenticated user's current saved Reality Profile and provide
  truthful setup links when the formal Seed or profile is missing.
- Let the user select one theme from the saved long-horizon profile, choose a
  one-, three-, or five-year horizon, and add up to twelve changes within that
  same theme. A field can be changed again at a later stage; unrelated themes
  cannot be mixed in one comparison.
- Render baseline and alternative paths across four relative one-year stages
  or coarse annual three-/five-year stages, then allow a saved comparison to
  be reopened after refresh from this page's server-backed history list.
- Explain that every alternative is conditional on user-authored assumptions.
  Unknown profile items stay explicitly unknown unless the user explicitly
  changes that item in the alternative path; no other domain is inferred.
- Keep Event-to-Claim evidence linkage visible as a product explanation while
  hiding row ids, trace ids, raw Seed text, and internal evidence identifiers.
- State that the comparison is conditional, not a certainty or prediction;
  never present exact dates, probabilities, private third-party facts, or
  invented domain effects.

This candidate is not the complete Track B experience or final product
acceptance.

### Intake

Must feel like structured situation telling.

Must include:

- Natural-language context input.
- Recent events.
- Key people hints.
- Worries and decision options.
- Safety/action boundaries.
- Optional Manual Reality Intake for user-provided materials such as job
  descriptions, chat summaries, company information, policy notes, offer terms,
  agreement summaries, or market notes.

Must not feel like:

- A dry questionnaire.
- A mystic birth-chart form as the main experience.

Manual Reality Intake must not be required. If it is empty, Running and Result
surfaces must clearly state that the run is Local Assumption Mode and no
external reality data was retrieved.

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

### Digital-life pre-run rules (functional candidate)

The locked current-chain Graph view and explicit saved-Graph view expose a
30/90-day formal Run starter. It loads server-authoritative safe participant,
relationship and resource selectors; the UI must not reconstruct their ordering
from another projection. Loading, missing model, error/reload and pending states
must remain recoverable and hide internal identifiers.

Every user-added rule needs a labelled actor, trigger, typed operation, safe
source summary and unchecked-by-default simulation-assumption confirmation.
30 days has three cycles; 90 days has six. These are simulation cycles, not
precise real event dates. Changing the horizon clears old rules with an explicit
notice. Deleting a prerequisite also removes dependent rules.

Third-party conditional responses must follow a same-path information request
to that participant. They are positive/neutral/negative response assumptions,
never private-intent facts or Graph-weight editing. At most two explicitly
defined variant strategies execute in separate worlds. Sampling trajectories
and strategy branches are labelled separately.

Result shows the frozen digital-life background as facts/assumptions/unknowns,
confirmed action sources/triggers, simulated relationship changes and separate
strategy Event/Claim support. Old Runs without this model remain not recorded.
Model-correction links apply to a later Run. Strategy child claims currently
have no targeted-feedback controls because the baseline feedback writer cannot
address them. These candidates are not final nine-stage product acceptance.

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

Current formal Result feedback is available for the actual frozen Claim,
Participant, and Relation items shown in that Run. Strategy usefulness remains
a full-product requirement but must stay unavailable until the persisted
Result contains a real Strategy item; do not create a placeholder or infer
strategy content solely to collect a rating. Existing overall-result feedback
remains available. Target feedback must use accessible controls, safe ordinal
keys, and must not expose database IDs or alter historical Run artifacts.

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

## Optional symbolic lens candidate

`/app/symbolic-lens` uses existing tokens and five explainable row blocks, not a
new marketing surface. It remains separate from self-recorded Reality climate.
Skip returns to the sandbox without a birth write. Date plus optional civil time
are the only inputs; unknown time is allowed. Storage and calculation consent
start unchecked and are independent. Saved birth inputs never echo back. Details
show actual calculation limits and explicit product-rule basis without claiming
traditional authority, prediction or scientific probability.

A stale lens says it belongs to a prior period and provides an explicit update
button; rendering/GET never silently refreshes it. Withdrawal shows no active lens
and blocks future calculation, without changing old Runs or claiming deletion.
The privacy section states formal birth-source deletion is not yet connected.
Future Run attachment is visibly unavailable; initial-inclination fusion is not
claimed complete. An ambiguous save failure blocks new writes until the user
explicitly reloads current account state; it never automatically changes the key
and resubmits. Real signed-in browser acceptance remains a separate check.
