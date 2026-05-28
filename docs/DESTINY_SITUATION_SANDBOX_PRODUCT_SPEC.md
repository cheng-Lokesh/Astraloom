# Astraloom Destiny-Situation Sandbox Product Spec

## 1. Product Definition

Astraloom is a destiny-situation dynamic sandbox.

It helps a user bring two things into one visible simulation surface:

- A basic destiny or birth-information base pattern.
- A current real-world question or situation.

Astraloom does not stop at a static reading. It builds a Destiny Profile, reads the current Destiny Climate, extracts the real-world situation, identifies key people, maps destiny themes to real people and pressures, builds a Situation Map, runs visible sandbox events, and produces findings that can be inspected through evidence.

The product promise is:

> Turn a user's basic destiny context and current question into an inspectable dynamic sandbox of people, pressures, interactions, path divergence, findings, and evidence.

Astraloom is not:

- A plain fortune report.
- A plain AI advice tool.
- A chatbot.
- A therapy product.
- A CRM.
- An RPG.
- A deterministic prediction engine.

Astraloom must never claim that fate is certain, that a person will definitely behave a certain way, or that payment makes an output more true.

## 2. User Input Principle

The user should provide only the minimum input needed to start the sandbox:

1. Basic destiny or birth information.
2. One free-form current question or situation description.

The current question description may naturally include people, recent events, choices, worries, limits, timing, or desired output. The UI should not split these into a long questionnaire by default.

Clarification is allowed only when the system cannot safely or usefully proceed. Clarification must be limited to one to three questions. Clarification questions should ask for missing essentials, such as:

- Missing or ambiguous birth basics needed to form the Destiny Profile.
- The actual current question when the description is too vague.
- A safety-critical boundary when the situation touches high-risk content.

The system should infer structure from the free-form description wherever possible, then let users inspect and calibrate the result instead of forcing extensive pre-run data entry.

## 3. User-Facing Flow

### Dashboard

The dashboard presents Astraloom as a destiny-situation sandbox, not as a report generator or chat app.

It should show:

- A primary start action for a new sandbox.
- Recent sandbox snapshots when available.
- Evidence, calibration, support, and settings entry points.

It must not show:

- Fear-based hooks.
- Deterministic predictions.
- "Ask the AI anything" as the main product frame.
- Payment as a path to more certainty.

### Start

The start surface asks for:

- Basic destiny or birth information.
- One free-form current question or situation description.
- Minimal consent and safety acknowledgement.

The start surface may include a time window selector if useful, but it must not become a long questionnaire.

After submit, Astraloom automatically prepares the internal pipeline:

- Destiny Profile.
- Destiny Climate.
- Situation Extraction.
- Key People.
- Destiny-Situation Fusion.
- Situation Map.

### Clarification If Needed

If the input is insufficient, the system asks one to three targeted clarification questions.

Clarification should be used only for:

- Missing essential birth or destiny context.
- Ambiguous current question.
- Missing safety boundary.
- Inputs that are too short to extract a situation.

Clarification must not become a hidden long form.

### Dynamic Sandbox Running

The running view makes the intermediate process visible.

It should show stages such as:

- Building Destiny Profile.
- Reading Destiny Climate.
- Extracting situation structure.
- Identifying key people.
- Mapping destiny themes to real people and pressures.
- Building Situation Map.
- Running Sandbox Events.
- Comparing path divergence.
- Building findings and evidence replay.

The running surface should show progress, event previews, and blocked or downgraded states clearly.

It must not ask the user to make continuous RPG-style choices during the run.

### Result

The result view is a sandbox result, not a mystical article.

It should show:

- Destiny Profile summary.
- Current Destiny Climate summary.
- Situation Map.
- Key people and pressure roles.
- Destiny themes mapped to real people, constraints, and opportunities.
- Sandbox event timeline.
- Pressure changes.
- Path divergence.
- Findings with confidence and evidence.

Findings must remain non-deterministic and evidence-backed.

### Evidence Replay

Evidence Replay lets the user inspect how the system reached a finding.

It should connect:

`input -> extraction -> Destiny Profile -> Destiny Climate -> Key People -> Situation Map -> Sandbox Events -> Path Divergence -> Findings -> evidence`

Each important finding should point to the relevant sandbox events, people, pressure changes, and source input fragments.

Evidence Replay must not expose private chain-of-thought. It should expose product evidence, event logs, structured inputs, snapshots, and confidence notes.

### Improve Next Run

After viewing results, the user can calibrate future runs.

Calibration can include:

- A finding felt accurate, partly right, off, unclear, or not happened yet.
- A person or pressure role was misread.
- A strategy or option was useful or not useful.
- A missing context note should influence the next run.

Calibration must not rewrite historical events or claims. It should create future-run guidance and confidence adjustments.

## 4. Internal Engine Flow

### DestinyProfile

Builds the user's base symbolic pattern from basic destiny or birth information.

Responsibilities:

- Normalize birth or destiny basics.
- Create a stable profile for the current run.
- Identify broad themes, tendencies, pressure channels, and uncertainty.
- Record source fields and missing fields.

Boundaries:

- Do not claim deterministic fate.
- Do not create findings alone.
- Do not override real-world evidence.

### DestinyClimate

Reads the current climate around the Destiny Profile for the selected run window.

Responsibilities:

- Identify current-period pressures and opportunities.
- Mark confidence and uncertainty.
- Provide climate themes for fusion with the real situation.

Boundaries:

- Do not produce standalone predictions.
- Do not turn climate into professional advice.

### SituationExtraction

Extracts structured real-world context from the free-form current question description.

Responsibilities:

- Identify the main question.
- Extract recent events, decisions, constraints, desired output, and safety boundaries.
- Preserve source fragments for evidence replay.

Boundaries:

- Do not require a long questionnaire.
- Ask clarification only when essential.

### KeyPeople

Identifies real people, groups, institutions, or roles that materially affect the situation.

Responsibilities:

- Extract candidates.
- Assign relationship-to-user and role type.
- Attach confidence, missing fields, and evidence references.
- Allow user inspection, correction, merge, deletion, rename, or supplement where the advanced flow exposes it.

Boundaries:

- Do not infer private thoughts as fact.
- Do not edit relation edge weights directly from user input.

### DestinySituationFusion

Maps destiny themes and climate signals onto the current real-world people and pressures.

Responsibilities:

- Link themes to observable people, constraints, choices, and timing.
- Separate symbolic interpretation from real evidence.
- Create fusion notes that can be inspected later.

Boundaries:

- Do not convert symbolic mapping into certainty.
- Do not say a person secretly intends something.
- Do not use paid mode to increase certainty.

### SituationMap

Builds the inspectable map of the current sandbox.

Responsibilities:

- Represent the user, parallel self variants, key people, groups, and pressure nodes.
- Represent relations and pressure edges.
- Preserve graph lock state for simulation.
- Expose evidence entry points.

Boundaries:

- The map is read-only to users.
- Users must not directly edit trust, hostility, dependency, attraction, competition, resource control, information gap, emotional debt, or other edge weights.
- It must not become a CRM.

### SandboxEvents

Runs visible interaction events over the selected time window.

Responsibilities:

- Freeze the Situation Map before the run.
- Generate events from deterministic or explicitly gated rules.
- Track participants, causes, before/after states, pressure changes, and evidence.
- Attach every event to traceable sources.

Boundaries:

- Do not let an LLM directly decide final conclusions.
- Do not generate strong claims without events.
- Do not run unsafe high-confidence generation after safety downgrade.

### PathDivergence

Compares how paths diverge across branches.

Example branches may include:

- Baseline path.
- Cautious self path.
- Decisive self path.

Responsibilities:

- Show where pressure rises, eases, or shifts.
- Show which people or constraints become more central.
- Show where information gaps matter.
- Show likely sensitivity points without deterministic claims.

Boundaries:

- Do not frame one path as guaranteed.
- Do not give medical, legal, investment, therapy, or emergency instructions.

### Findings

Builds evidence-backed findings from events and path divergence.

Responsibilities:

- Summarize key discoveries.
- Include confidence and risk level.
- Reference evidence event ids.
- Separate free preview depth from deeper evidence inspection without changing claim truth.

Boundaries:

- Findings without evidence must not be shown as strong findings.
- Paid or full-depth mode must not create stronger claims, increase confidence, or lower risk.

### EvidenceReplay

Provides the inspection layer for every important output.

Responsibilities:

- Show relevant input fragments.
- Show extraction records.
- Show Destiny Profile and Destiny Climate snapshots.
- Show key people and fusion notes.
- Show Situation Map edges and event deltas.
- Show which events support each finding.
- Capture calibration feedback for future runs.

Boundaries:

- Do not reveal private model chain-of-thought.
- Do not expose secrets, service keys, raw provider payloads, or unnecessary sensitive input.

## 5. User-Facing Terminology

Use these terms in user-facing product copy:

- Destiny Profile.
- Current Destiny Climate.
- Current question.
- Situation Map.
- Key people.
- Pressure.
- Interaction event.
- Path divergence.
- Finding.
- Evidence.
- Evidence Replay.
- Confidence.
- Risk window.
- Opportunity window.
- Calibration.
- Improve next run.

Use careful framing:

- "This pattern suggests..."
- "The sandbox shows..."
- "Based on the evidence in this run..."
- "This pressure may increase if..."
- "This path appears more sensitive to..."

Avoid these terms or frames in user-facing copy:

- Fate is certain.
- Guaranteed.
- Destined.
- We know what they really think.
- Pay to reveal the truth.
- Pay to avoid disaster.
- Fortune-telling as the product identity.
- Mind reading.
- Diagnosis.
- Treatment.
- Investment instruction.
- Legal instruction.
- Therapy advice.

## 6. Internal Technical Terminology

Internal code and docs may use explicit engine terms:

- `DestinyProfile`
- `DestinyClimate`
- `SituationExtraction`
- `KeyPeople`
- `DestinySituationFusion`
- `SituationMap`
- `RelationEdge`
- `AgentProfile`
- `SandboxEvent`
- `SimulationTick`
- `PathDivergence`
- `Finding`
- `Claim`
- `EvidenceReplay`
- `evidence_event_ids`
- `CalibrationProfile`
- `SafetyVerifier`
- `SafetySnapshot`

Internal terminology rules:

- User-visible graph data must trace to Agent Profiles, Relation Edges, Sandbox Events, and evidence.
- Every important finding or claim must reference `evidence_event_ids`.
- Generated artifacts should carry version, trace id, source, confidence, and error state where relevant.
- Safety decisions must be captured before generation, report display, and paid/full-depth gates.

## 7. Safety And Product Boundaries

Safety downgrade overrides product flow, full-depth mode, and report generation.

High-risk content must trigger conservative behavior for:

- Self-harm or suicide.
- Violence or threats.
- Stalking, surveillance, coercive control, or partner monitoring.
- Medical diagnosis or treatment.
- Legal decisions.
- Investment, debt, or financial decisions.
- Harassment, revenge, blackmail, or manipulation.
- Minor safety concerns.
- Requests requiring certainty about another person's private thoughts or intent.
- Deterministic fate or guaranteed reconciliation claims.

Astraloom must:

- Preserve non-deterministic framing.
- Keep findings evidence-backed.
- Keep the relation graph read-only.
- Prevent paid/full-depth mode from bypassing safety.
- Prevent paid/full-depth mode from increasing accuracy, certainty, confidence, or risk changes.
- Phrase actions as options, reflection prompts, preparation steps, or communication strategies.
- Keep professional-advice categories out of scope.

Astraloom must not:

- Become a fortune report.
- Become a chatbot-first advice surface.
- Become a therapy product.
- Become a CRM relation editor.
- Become an RPG with continuous user choices.
- Claim deterministic prediction.
- Infer hidden motives or private thoughts as fact.
- Use fear-based copy.

## 8. Out Of Scope For Now

The following are explicitly out of scope for this product-spec phase and near-term implementation unless a future task opens them with explicit gates:

- Real payment.
- Stripe.
- Production deployment.
- Production database migrations.
- Service-role writers.
- Browser-write access to generated artifacts.
- Production entitlement grants.
- Production payment webhooks.
- Full social/community features.
- Broad all-life prediction in one run.
- Continuous RPG-style branching choices.
- Editable relation edge weights.
- Medical, legal, investment, or therapy advice.

Mock payment or full-depth preview language, if present in local MVP surfaces, must remain a depth/inspection concept only. It must not imply stronger truth or more accurate fate.

## 9. Acceptance Criteria For Future Implementation

Future implementation is acceptable only when all of the following are true:

1. The primary start flow asks only for basic destiny or birth information and one free-form current question or situation description, plus minimal safety consent.
2. Clarification appears only when the input is insufficient, and asks no more than one to three questions.
3. The system creates a Destiny Profile with source fields, missing fields, confidence, and non-deterministic framing.
4. The system creates a Destiny Climate for the selected run window without producing standalone fate claims.
5. Situation Extraction derives the main question, real-world pressures, people, options, constraints, and evidence fragments from the free-form description.
6. Key People are extracted with role, relationship-to-user, confidence, missing fields, and evidence references.
7. Destiny-Situation Fusion maps destiny themes to real people and pressures while clearly separating symbolic context from observable evidence.
8. Situation Map shows people, pressure nodes, relation edges, confidence, and evidence entry points.
9. Situation Map remains read-only; users cannot edit relation edge weights.
10. Dynamic sandbox running shows visible stages and event previews rather than hiding the process behind a spinner.
11. Sandbox Events include participants, causes, before/after state, pressure changes, branch id, confidence, and evidence.
12. Path Divergence compares branches without claiming certainty.
13. Findings are generated only from Sandbox Events and must reference `evidence_event_ids`.
14. Evidence Replay connects input, extraction, Destiny Profile, Destiny Climate, Situation Map, Sandbox Events, Path Divergence, Findings, and evidence.
15. Calibration can improve future runs but cannot rewrite historical events, findings, or claims.
16. SafetyVerifier or equivalent safety gating runs before runnable generation, report display, and full-depth unlock.
17. High-risk inputs are downgraded or blocked before strong claims, paid/full-depth access, or unsafe suggestions.
18. Full-depth mode reveals more evidence and strategy depth only; it does not create stronger findings, raise confidence, lower risk, or claim more accuracy.
19. User-facing copy avoids deterministic fate, fear-based language, mind-reading claims, and professional-advice overreach.
20. No real payment, Stripe write, production deployment, production migration, or service-role writer is introduced by this implementation.
21. Existing advanced/detail pages may continue to expose people, agents, graph, running events, result, evidence, and calibration details.
22. `npm run check` passes after implementation, or any failure is documented with file, command, and blocker.

