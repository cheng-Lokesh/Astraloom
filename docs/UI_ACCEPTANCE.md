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
Result explicitly offers `修订这些假设并另跑`, opening a dedicated branch of Start
with the original server-read rules rather than a blank scenario. Normal Start
still opens scenario preparation. The opaque source selector is navigation only
and never displayed. Cancel returns to the original result with history retained.

The revision view shows original self/NPC/strategy rules, safe participant and
relationship labels, source summaries and separate per-action/per-strategy
confirmation controls, initially unchecked. It permits changes to request cycle
and question, self commitment, visible NPC response hypothesis and the existing
resource's allocation amount, retaining its original amount for comparison.
Allocation must pass the existing finite positive bounded rules schema; resource
identity and original Graph remain fixed. Every edit revokes its confirmation;
editing a prerequisite also revokes dependent action confirmations. Rule changes
clear budget/response authorization. No old budget, symbolic, observation or
request permission is inherited. All required confirmations must be valid before
starting a separate new Run through the existing POST.

Loading, missing legacy rules, source mismatch, incomplete history and read errors
show safe recovery guidance without raw API bodies, UUIDs or trace data. Start
checks the exact current safe model before loading the draft; outdated async
responses cannot replace newer state. In-flight/unknown request recovery preserves
the complete original POST and key and disables edits or source refresh. Browser
synthetic verification at 375px covers draft loading, individual confirmations,
edited request/response/commitment/resource inputs, exact unknown-request replay,
and stale/legacy refusal. This is a model-rule correction functional candidate,
not full Fork, real signed-in DB acceptance or complete nine-stage acceptance.

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
Future Run attachment uses a separate default-off explicit consent switch.
Current-period eligibility and authorization are distinct; a stale frame must
be explicitly refreshed and authorized again. The boundary is visible: accepted
(including queued) Runs have started and keep their old frozen frame; switching
off affects only newly accepted keys. Result shows one independent frozen
symbolic section, precision/rule/calculation/reference-period limitations and
explicit empty reasons, never as Reality facts or claim evidence. Legacy static
records are not personal models. Initial-inclination fusion is not claimed
complete. An ambiguous save failure blocks new writes until the user
explicitly reloads current account state; it never automatically changes the key
and resubmits. Real signed-in browser acceptance remains a separate check.

## Outcome independent comparison candidate

Show typed actual observations and per-condition actual times, with unknown
explicitly supported. Historical records show prior frozen values alongside
actual values and safe difference labels. During the open observation window,
the overall comparison stays unknown even when a current difference is known.
Separate self/resource scope checkboxes describe concrete reality, not Core
provenance or hidden NPC intentions. Different resource totals remain saveable.

Whole-cluster scoring is unavailable; independent resource matched/different
states must not be labeled accuracy, calibrated probability or Core backtest.
Mixed NPC typed records remain useful and may independently confirm next-run
visible-response rules. Zero amount is recordable but cannot select a positive
allocation correction. New-run correction selection defaults off. Historical
runs remain frozen; missing historical lock/criteria is plainly not_recorded.
Raw provenance, private UUIDs and birth data must not render or log. Pure logic
and synthetic UI checks do not replace signed-in owner/RLS/DB acceptance.

## Bounded default planning user journey candidate (2026-10-07)

Start separately explains and confirms each selected resource's whole-run budget
per hypothetical path/sample. The independent first-tick hypothesis switch starts
off and is available only with current eligible symbolic source consent. Explicit
rate/action resources are not silently rescaled; they remain governed by the
owner's rules. The 10% cap is a versioned product planning assumption, not a
probability, traditional authority or behavioral conclusion.

Profile/resource/source changes require fresh context and fresh authorization for
a new key. A pending/unknown POST instead preserves its full typed request and key
for recovery; graph prop changes must not erase that receipt or replace its body.
A 409 context rejection clears new planning consent and asks for explicit reload.
No planning permission omits the new request field and retains the old path.

Result shows frozen consent/hypothesis beside neutral and proposed quantity,
selected versus unselected controlled Event and actual amount, with budget and
minimum resource reserve. A hypothesis proposal is not an actual action until a
controlled Event exists. Neither selected-null nor an unselected invented amount
is shown as zero. Main and explicit strategy worlds keep their own trace scope;
no private source/Core identifiers are rendered. Legacy absence stays explicit.

The symbolic lens remains `causalUse:false`; a separately authorized quantity
hypothesis is described as its own planner lane. The v1 lane has no relationship
effect, and neither full Destiny fusion nor scientific probability is claimed.
Current source/logic/DOM evidence is a functional candidate; DB ownership,
RLS, frozen replay and real signed-in browser acceptance remain unverified until
the local database service is available. Do not reset it to bypass this gate.

## Bounded self response to relationship candidate (2026-10-13)

Start exposes one independently confirmed self-response assumption only after an
explicit same-path self request and conditional NPC response are present. The
resource must have its own whole-run budget permission. The independent symbolic
sensitivity switch starts off and needs eligible source consent. Changing the
pair, path, resource or source clears authorization for a new key; pending recovery
preserves the complete old typed request and key.

Result explains the response as a simulation assumption about the user's own
resource quantity, not private NPC intention or a real-world fact. It shows the
neutral/proposed/actual comparison, negative reduction capped at 10%, independent
symbolic contribution, and selected/not-selected/not-triggered/inactive state.
Positive/neutral responses do not reduce quantity. No-response candidates stay
neutral; only the first selected post-response allocation consumes the hypothesis.
Unauthorized strategy paths do not display main samples even when their traces
are empty. No raw IDs/provenance are rendered. Browser synthesis and DOM checks
remain separate from real signed-in owner/database acceptance.

## Current digital-life model draft journey candidate (2026-10-13)

The dashboard reads the current owner's draft and shows its saved revision,
horizon, and action/strategy counts without exposing transport identifiers.
The entry opens current-model configuration, not a historical Run. An unsaved
account can configure a draft; a saved current draft can be reviewed; an
unavailable read has an explicit retry/error state.

When the saved source is current, Start may load its rules for review, but each
action and strategy must be confirmed again before Run. Saving writes only
unconfirmed draft rules. It does not start a Run or authorize actions,
strategies, budgets, or optional hypotheses. After save or idempotent replay,
the UI reads GET again and checks the current source before treating the draft
as current.

When the source is stale, the original saved labels and rules remain visible in
a disabled, read-only editor. They are not rebound to current ordinal
positions. A separate action starts a blank draft against freshly read current
source, requiring the user to configure and confirm again.

Unknown Save and Run responses retain the original full request body and key
in the mounted Start component's recovery references; recovery resends that
same request without silently refreshing its source. This is in-memory
component recovery only. A page reload, remount, browser crash, or device
change is not established as unknown-request recovery. Run creation and its
separate permissions remain governed by the existing Run flow.

These are source-level UI contracts. A synthetic or static UI check does not
prove real signed-in behavior, database persistence, Auth/RLS, or cross-device
recovery; visual and authenticated acceptance remain outstanding.

#### Complete current-model rule editing candidate (2026-10-15)

The current-model editor lets the owner add, edit, and remove the four existing
typed action kinds: information request, self commitment, bounded resource
allocation, and conditional relationship response. It can add or edit strategies
only for existing parallel-self variants, with at most two strategies. A
strategy cannot be saved until its own path contains an action by that variant.

Each new action requires an explicit path, actor, trigger, typed operation, and
safe source summary. A third-party response must name its NPC actor and an
existing locked relation edge connected to that NPC; an information request
target must be a current NPC/group connected to the user core by an existing
relation edge. The editor never edits edge weights or infers private intent.
Changing a request target does not silently move its old NPC actor or edge to a
different person. The old rule remains invalid until its actor and edge are
explicitly repaired or the rule is removed. A changed source stays stale and
read-only until the owner explicitly starts a new draft from current sources.

Within one mounted editing session, action keys remain stable and a deleted key
is not reused; behavior after a full reload or in a new session has not been
established. Prerequisites stay within one path, cannot form cycles, and are
reordered topologically when a valid dependency changes. Before removing an
action or strategy, show the full dependent action/strategy cascade and require
explicit confirmation; cancelling keeps the draft intact. Every mutation revokes
the changed rule's confirmation, dependent confirmations, and affected strategy,
budget, Symbolic, and outcome permissions. Save writes every rule unconfirmed and
never starts a Run. Run requires fresh, valid per-rule and per-strategy
confirmations. Empty or invalid input must fail closed without a parse crash or
applying a stale model. An unknown Save or Run response locks edits and source
refresh until the exact original request body and key are replayed.

The focused UI and narrow independent review gates passed for this functional
candidate. The 375×812 check used the real React component and typed browser
client in Chrome with mock HTTP. This does not establish real account behavior,
database/Auth/RLS, cross-device recovery, production CSS/page visual acceptance,
or nine-stage acceptance.

#### Environment-condition rules v2 candidate (2026-10-15)

An existing saved v1 draft remains v1; a saved v2 draft remains v2. A new
unsaved draft initializes to the version of the read source, including v2
when `signature_v2` is available. Explicit source preparation returns a
separate `preparedSourceContext` and does not silently upgrade a saved draft.
A stale source stays read-only, and starting again uses a blank draft against
the newly read source rather than moving old ordinal rules. Each path
allows one environment condition within its existing action cap. The baseline
is shown as its Reality fact/assumption and the different replacement as an
explicit simulation assumption; same-value additions are rejected and edits
that become equal fail closed at confirmation/save/run.

Save persists all confirmations as false. Run requires fresh confirmation.
Unknown Save/Run responses lock editing until the exact original body/key is
replayed; recovery is only established within the mounted editing session.
Results distinguish `selected`, `not_selected`, `not_triggered`, and
`not_reached` independently for each sample/path. Only a selected condition
with its matching actual Event may show a changed value and its actual
`after_rule` successors; internal identifiers remain hidden.

The focused 375×812 Chrome exercise used the real React component and typed
client with mock HTTP and a stub router, not production CSS or a real account.
It supports a functional candidate only, not authenticated, database, or
full-page visual acceptance.

#### Explicit Profile-update reconciliation (2026-10-16 candidate)

After the user saves an updated Reality Profile, an existing model draft may be
continued only through an explicit action labelled `按当前资料继续调整` when
the saved source still matches the current Seed, locked Graph, Agent snapshot,
ordered Agents, and relationships, and the Profile revision increased. The
reconciliation view is titled `核对当前资料并延续模型`. It keeps the original
source labels and rules visible for reference and does not bind old resource or
variable ordinals to current entries.

The Reality Profile page may show `核对并继续调整行动模型` linking to
`/app/start?model_draft=current` only after a Profile save succeeds. While saving
or after a failed save, it must not display that success link. Dashboard stale
copy may offer continuation for a Profile-only revision change; if people or
relationships changed, it must direct the user to configure from the new source.
Before Apply, the editor re-reads preparation and compares the complete current
source. A further source change keeps the old draft read-only with no Save or Run;
a `409 model_reconciliation_scope_changed` has the same fail-closed behavior.

Each affected resource and environment rule requires a new, visible current
selector choice, with no selector preselected. Resource amounts must fit the
selected current resource's available bounds. An environment assumption equal
to its current baseline, empty, or otherwise invalid cannot be applied. A
Profile-linked commitment requires explicit detachment, which keeps the user's
commitment text, or removal of the rule. Before removal, show the dependent
action and strategy cascade and require explicit confirmation. When removal
would delete a variant's last self action, include that strategy in the preview;
cancelling preserves the rule and strategy. Removing a main predecessor must
list every dependent rule before confirmation. Unaffected text,
dependencies, and valid strategy details remain reviewable; every action and
strategy still requires a fresh confirmation.

Applying reconciliation updates only the in-progress client draft. It does not
save, start a Run, carry forward the previous planning/Symbolic/outcome
permissions, or change a historical result. Save appends a new unconfirmed
revision; the client then reads GET again and verifies the saved source before
enabling fresh per-rule/per-strategy confirmation and a new Run. An unknown
Save or Run response locks editing/source refresh until the exact original body
and idempotency key are replayed. Recovery is established only while the
component remains mounted; reload and cross-device recovery are not claimed.
Stale Seed/Graph/Agent/relationship scope remains read-only and must use the
separate blank-current-draft path.

These are functional acceptance requirements for the persistent personal
digital-life sandbox direction. They do not make Career the product's final
domain or change the frozen V2 Core. Mock-HTTP and viewport checks do not prove
authenticated account, database/RLS, production-style visual, or full-product
acceptance.

#### World guard v3 candidate (2026-10-19)

The owner explicitly opts into the v3 rule protocol from current source
preparation. Existing saved v1/v2 drafts remain in their original protocol
until a separate Save; preparation never silently upgrades them. The editor
shows the existing schedule/preceding-rule trigger separately from one optional
guard. A resource guard requires an explicit resource, comparison, and
in-range threshold. An environment guard requires an explicit declared
environment item and an initial or same-path declared replacement value.
Guarded actions are restricted to the main self or the matching variant's own
strategy path. Any guard edit invalidates the affected rule and dependent
confirmations; Save stores all rules unconfirmed and Run requires fresh
confirmation.

Successful, saved v3 Results show guard observations independently by path,
sample, and executed tick. Labels and values are safe projections; internal
rule, sample, step, World, Event, and source identifiers are not rendered. The
UI may show a textual step reference only for the matching selected Core Event;
it is not a clickable link, and temporary diagnostics have no formal step link.
It distinguishes an offered candidate that lost selection from an unreachable
tick. An unreachable tick has no fabricated state values and must not be
described as waiting for a future trigger. Guard output is conditional
simulation evidence, not a real-world probability or promised timing.

Show no-eligible diagnostics only when a whole path has zero selected Core
Events across all three samples. A sample or path with one or more selected
Events may end before later ticks and still form part of a saved Run;
unreached later ticks alone are not a failure. When a whole path has zero
events, show the safe diagnostics with the status “not saved,” including which
other path may have had simulated events. Explain that no complete Run or
Report was created. After this known response,
unlock editing, clear rule confirmations and separate planning,
relationship-response, and outcome-correction authorizations, and require
fresh confirmations with a new request key before another attempt. If the
response is unknown, keep the editor locked and retain the complete original
body/key until exact replay resolves it.

The initial-World authority helper has a producer-reported 19/19
review-target run, including controller-rebinding and initial-World
structure/source tamper cases. Independent readonly review found no unresolved
targeted P1/P2; the independent review/runtime command passed 2 files / 30
tests, exit 0, in 60.11 seconds. Root reports the UI and revision-recovery
command passed 2 files / 7 tests, exit 0, in 20.80 seconds (session 63034).
Test freeze is complete; the functional/source candidate is READY, not a phase
PASS. The SQL source fixture was rebuilt from frozen source, but its pgTAP
checks have not run against PostgreSQL. An earlier pre-fix seven-file runtime
run had one JSON-compatibility failure after 63 passes; it later passed a
targeted check, but the full seven-file runtime set is not thereby confirmed
green. Synthetic UI and source tests cannot stand in for migration execution,
authenticated account behavior, or database/RLS acceptance.
