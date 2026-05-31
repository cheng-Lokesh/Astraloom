# Astraloom Grounded Destiny Path Simulator Product Spec

## 1. Product Definition

Astraloom is a reality-first, destiny-weighted personal future path simulator.

It first understands the user's current real-world situation, then uses destiny climate as a timing lens and personal reaction modifier to simulate how several possible future paths may unfold.

The product promise is:

> Astraloom grounds your current real-world situation first, then uses destiny climate as a timing lens to simulate possible future paths.

Chinese user-facing expression:

> Astraloom 会先理解你当前所处的现实环境，再结合你的命理气候，模拟几种未来路径可能如何展开。

Astraloom does not use destiny to generate society. It builds a Grounded Reality Model from the user's current question, real-world nodes, resources, opportunities, constraints, and evidence fragments. Destiny is then applied only as a Destiny Person Modifier: it adjusts the user's tendency, stress response, opportunity response, boundary style, timing sensitivity, and path weights inside that already-grounded model.

The core chain is:

`SeedContext -> Grounded Reality Model -> Destiny Person Modifier -> Grounded Path Simulation -> Findings -> Evidence Basis`

Astraloom is not:

- A plain fortune report.
- A plain AI advice tool.
- A chatbot.
- A therapy product.
- A CRM.
- An RPG.
- A deterministic prediction engine.
- A destiny-generated society engine.
- A system that proves destiny by inventing real-world facts.

Astraloom must never claim that fate is certain, that a person will definitely behave a certain way, that destiny proves someone exists in reality, or that payment makes an output more true.

## 2. Core Grounding Principles

Reality is the substrate. Destiny is a modifier.

Astraloom must follow these principles:

- The real world cannot be generated from destiny alone.
- Destiny cannot create society.
- Destiny cannot directly assert that a specific person must exist in the user's real life.
- Destiny cannot fill missing real-world facts.
- Future path simulation must be based on real-world nodes, real-world resources, real-world opportunities, and real-world constraints.

Destiny may be used only for:

- User personal tendencies.
- Stress responses.
- Opportunity responses.
- Boundary style.
- Timing climate.
- Path weighting.

Reality basis may come from:

- User input.
- Inferable real-world semantics.
- Sample data.
- Future external data interfaces.

Destiny basis may come from:

- `DestinyProfile`.
- `DestinyClimate`.

When reality basis and destiny basis conflict, reality basis wins. When a real-world fact is missing, the system should mark it as unknown, ask a limited clarification question if essential, or simulate multiple grounded possibilities without pretending that destiny supplied the missing fact.

## 3. User Input Principle

The user should provide only the minimum input needed to start the sandbox:

1. Basic destiny or birth information.
2. One free-form current question or situation description.

The current question description may naturally include people, recent events, choices, worries, limits, timing, or desired output. The UI should not split these into a long questionnaire by default.

Clarification is allowed only when the system cannot safely or usefully proceed. Clarification must be limited to one to three questions. Clarification questions should ask for missing essentials, such as:

- Missing or ambiguous birth basics needed to form the Destiny Profile.
- The actual current question when the description is too vague.
- A safety-critical boundary when the situation touches high-risk content.

The system should infer grounded structure from the free-form description wherever possible, then let users inspect and calibrate the result instead of forcing extensive pre-run data entry. Inferred structure must stay within plausible real-world semantics. It must not be filled from destiny.

## 4. User-Facing Flow

### Dashboard

The dashboard presents Astraloom as a grounded future path simulator, not as a report generator, chat app, or destiny-generated world.

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
- Seed Context.
- Grounded Reality Model.
- Destiny Person Modifier.
- Grounded Path Simulation.
- Findings.
- Evidence Basis.

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

- Building Seed Context.
- Building Grounded Reality Model from user input and real-world semantics.
- Building Destiny Profile.
- Reading Destiny Climate.
- Applying Destiny Person Modifier to the user's tendencies, stress response, opportunity response, boundary style, and timing sensitivity.
- Running Grounded Path Simulation.
- Comparing path divergence.
- Building Findings and Evidence Basis.

The running surface should show progress, event previews, and blocked or downgraded states clearly.

It must not ask the user to make continuous RPG-style choices during the run.

### Result

The result view is a sandbox result, not a mystical article.

It should show:

- Destiny Profile summary.
- Current Destiny Climate summary.
- Grounded Reality Model summary.
- Key people and pressure roles.
- Destiny Person Modifier notes applied to the user only.
- Real-world constraints, resources, options, and opportunities.
- Grounded event timeline.
- Pressure changes.
- Path divergence.
- Findings with confidence and evidence.

Findings must remain non-deterministic and evidence-backed.

### Evidence Replay

Evidence Replay lets the user inspect how the system reached a finding.

It should connect:

`SeedContext -> Grounded Reality Model -> Destiny Person Modifier -> Grounded Path Simulation -> Findings -> Evidence Basis`

Each important finding should point to the relevant real-world inputs, inferred reality semantics, sample data when used, simulation events, pressure changes, and destiny modifier notes. Destiny references can explain timing and user reaction weighting, but cannot serve as proof of a real-world fact.

Evidence Replay must not expose private chain-of-thought. It should expose product evidence, event logs, structured inputs, snapshots, and confidence notes.

### Improve Next Run

After viewing results, the user can calibrate future runs.

Calibration can include:

- A finding felt accurate, partly right, off, unclear, or not happened yet.
- A person or pressure role was misread.
- A strategy or option was useful or not useful.
- A missing context note should influence the next run.

Calibration must not rewrite historical events or claims. It should create future-run guidance and confidence adjustments.

## 5. Internal Engine Flow

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
- Do not create real people, institutions, opportunities, constraints, or events.
- Do not fill missing real-world facts.

### DestinyClimate

Reads the current climate around the Destiny Profile for the selected run window.

Responsibilities:

- Identify current-period pressures and opportunities.
- Mark confidence and uncertainty.
- Provide climate themes for fusion with the real situation.

Boundaries:

- Do not produce standalone predictions.
- Do not turn climate into professional advice.
- Do not assert that a real-world event, person, institution, or opportunity exists.
- Do not replace Grounded Reality Model evidence.

### SeedContext

Captures the minimum starting context for the run.

Responsibilities:

- Preserve the user's current question and situation description.
- Preserve basic destiny or birth information when provided.
- Preserve time window, consent, and safety acknowledgement.
- Preserve source fragments for evidence replay.
- Mark missing essentials without inventing them.

Boundaries:

- Do not require a long questionnaire.
- Ask clarification only when essential.
- Do not infer reality from destiny.

### Grounded Reality Model

Builds the realistic social, resource, opportunity, and constraint model from the user's current situation.

Responsibilities:

- Identify the main question.
- Extract real-world nodes: people, roles, groups, institutions, constraints, resources, recent events, choices, and options.
- Use user input, inferable real-world semantics, sample data, and future external data interfaces as the only reality basis.
- Preserve source fragments and inference labels for Evidence Basis.
- Mark unknown facts, ambiguity, and missing fields.
- Allow user inspection, correction, merge, deletion, rename, or supplement where the advanced flow exposes it.

Boundaries:

- Do not use destiny to create people, institutions, constraints, resources, opportunities, or events.
- Do not claim a person exists unless grounded in user input, sample data, future external data, or explicit user confirmation.
- Do not infer private thoughts as fact.
- Do not edit relation edge weights directly from user input.
- Do not become a CRM.

### Destiny Person Modifier

Applies destiny-derived weighting to the user inside the Grounded Reality Model.

Responsibilities:

- Translate `DestinyProfile` and `DestinyClimate` into personal modifiers.
- Adjust only the user's likely tendencies, stress responses, opportunity responses, boundary style, timing sensitivity, and path weights.
- Explain how a modifier changes the user's possible reaction to already-grounded people, pressures, choices, and timing.
- Keep modifier notes inspectable and separate from reality evidence.

Boundaries:

- Do not create new real-world facts.
- Do not create or prove another person's existence.
- Do not assign destiny-derived motives to another real person as fact.
- Do not convert symbolic mapping into certainty.
- Do not say a person secretly intends something.
- Do not use paid mode to increase certainty.

### Grounded Path Simulation

Runs possible future paths from the Grounded Reality Model with Destiny Person Modifier weights applied.

Responsibilities:

- Freeze the Grounded Reality Model before simulation.
- Generate path branches from grounded nodes, constraints, resources, opportunities, and uncertainty.
- Apply Destiny Person Modifier only to user reaction tendency, stress sensitivity, opportunity response, boundary style, timing climate, and path weighting.
- Track participants, causes, before/after states, pressure changes, branch id, confidence, and evidence.
- Attach every event to traceable reality basis and, where relevant, destiny modifier basis.

Boundaries:

- Do not let an LLM directly decide final conclusions.
- Do not generate strong claims without events.
- Do not run unsafe high-confidence generation after safety downgrade.
- Do not let destiny generate society, people, or missing facts.

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
- Show how reality constraints and destiny modifiers change path weights separately.

Boundaries:

- Do not frame one path as guaranteed.
- Do not give medical, legal, investment, therapy, or emergency instructions.

### Findings

Builds evidence-backed findings from Grounded Path Simulation and path divergence.

Responsibilities:

- Summarize key discoveries.
- Include confidence and risk level.
- Reference evidence event ids.
- Separate reality basis from destiny basis.
- Separate free preview depth from deeper evidence inspection without changing claim truth.

Boundaries:

- Findings without evidence must not be shown as strong findings.
- Paid or full-depth mode must not create stronger claims, increase confidence, or lower risk.

### EvidenceReplay

Provides the inspection layer for every important output.

Responsibilities:

- Show relevant input fragments.
- Show Grounded Reality Model records.
- Show Destiny Profile and Destiny Climate snapshots.
- Show Destiny Person Modifier notes.
- Show grounded nodes, relation edges where present, and event deltas.
- Show which events support each finding.
- Show whether each evidence item came from user input, inferable real-world semantics, sample data, future external data interfaces, `DestinyProfile`, or `DestinyClimate`.
- Capture calibration feedback for future runs.

Boundaries:

- Do not reveal private model chain-of-thought.
- Do not expose secrets, service keys, raw provider payloads, or unnecessary sensitive input.
- Do not present destiny as evidence for a real-world fact.

## 6. User-Facing Terminology

Use these terms in user-facing product copy:

- Destiny Profile.
- Current Destiny Climate.
- Current question.
- Grounded Reality Model.
- Destiny Person Modifier.
- Grounded Path Simulation.
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
- "Your current situation appears to include..."
- "Your destiny climate may make this timing feel..."
- "This path receives more weight because..."

Avoid these terms or frames in user-facing copy:

- Fate is certain.
- Guaranteed.
- Destined.
- Inevitable.
- Must happen.
- This person must exist.
- Destiny shows this person exists.
- The system knows who you really met.
- This person is certainly in your life.
- Destiny fills the missing reality fact.
- This person counters or harms your fate.
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

## 7. Internal Technical Terminology

Internal code and docs may use explicit engine terms:

- `DestinyProfile`
- `DestinyClimate`
- `SeedContext`
- `GroundedRealityModel`
- `DestinyPersonModifier`
- `GroundedPathSimulation`
- `EvidenceBasis`
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
- New product-direction docs should prefer `GroundedRealityModel`, `DestinyPersonModifier`, `GroundedPathSimulation`, and `EvidenceBasis` over destiny-first framing.
- Legacy terms such as `DestinySituationFusion` and `SituationMap` may remain in existing code until an explicit implementation task renames them, but their product meaning is subordinate to the grounded chain.
- Generated artifacts should carry version, trace id, source, confidence, and error state where relevant.
- Safety decisions must be captured before generation, report display, and paid/full-depth gates.

## 8. Safety And Product Boundaries

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
- Keep reality basis and destiny basis separate.
- Prevent destiny from creating real-world facts, people, institutions, opportunities, constraints, or events.
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
- Claim destiny proves that a real person exists.
- Claim the system knows who the user actually met unless the user or a grounded source provided that fact.
- Use destiny to fill missing reality facts.
- Infer hidden motives or private thoughts as fact.
- Use fear-based copy.

Forbidden user-facing expressions include:

- "命理显示现实中一定有这个人"
- "系统知道你真实遇到过谁"
- "这个人一定存在"
- "必然"
- "注定"
- "一定会"
- "克你"
- "Destiny shows this person must exist."
- "The system knows who you really met."
- "This person certainly exists."
- "Inevitable."
- "Destined."
- "Will definitely happen."

## 9. Out Of Scope For Now

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
- Destiny-generated society.
- Destiny as direct proof of real-world facts.

Mock payment or full-depth preview language, if present in local MVP surfaces, must remain a depth/inspection concept only. It must not imply stronger truth or more accurate fate.

## 10. Acceptance Criteria For Future Implementation

Future implementation is acceptable only when all of the following are true:

1. The primary start flow asks only for basic destiny or birth information and one free-form current question or situation description, plus minimal safety consent.
2. Clarification appears only when the input is insufficient, and asks no more than one to three questions.
3. The system creates a Destiny Profile with source fields, missing fields, confidence, and non-deterministic framing.
4. The system creates a Destiny Climate for the selected run window without producing standalone fate claims.
5. The system creates `SeedContext` from user input and marks missing essentials without inventing them.
6. The system creates a `GroundedRealityModel` before applying destiny modifiers.
7. `GroundedRealityModel` derives the main question, real-world pressures, people, options, constraints, resources, opportunities, and evidence fragments from user input, inferable real-world semantics, sample data, or future external data interfaces.
8. `GroundedRealityModel` never uses destiny to create people, institutions, opportunities, constraints, resources, or events.
9. `DestinyPersonModifier` uses only `DestinyProfile` and `DestinyClimate`.
10. `DestinyPersonModifier` is limited to user tendencies, stress response, opportunity response, boundary style, timing climate, and path weighting.
11. Destiny cannot directly assert that a specific real-world person exists.
12. Destiny cannot fill missing real-world facts.
13. Key People, when present, are grounded with role, relationship-to-user, confidence, missing fields, and evidence references.
14. Legacy Destiny-Situation Fusion, where still present, must behave as Destiny Person Modifier plus evidence annotation, not as a fact generator.
15. Grounded Path Simulation runs from real-world nodes, resources, opportunities, constraints, and uncertainty, with destiny used only as a modifier.
16. Dynamic sandbox running shows visible stages and event previews rather than hiding the process behind a spinner.
17. Sandbox Events include participants, causes, before/after state, pressure changes, branch id, confidence, and evidence.
18. Path Divergence compares branches without claiming certainty.
19. Findings are generated only from Grounded Path Simulation events and must reference `evidence_event_ids`.
20. Evidence Basis separates reality basis from destiny basis for every important output.
21. Evidence Replay connects `SeedContext`, `GroundedRealityModel`, `DestinyPersonModifier`, `GroundedPathSimulation`, `Findings`, and `EvidenceBasis`.
22. Calibration can improve future runs but cannot rewrite historical events, findings, or claims.
23. SafetyVerifier or equivalent safety gating runs before runnable generation, report display, and full-depth unlock.
24. High-risk inputs are downgraded or blocked before strong claims, paid/full-depth access, or unsafe suggestions.
25. Full-depth mode reveals more evidence and strategy depth only; it does not create stronger findings, raise confidence, lower risk, or claim more accuracy.
26. User-facing copy avoids deterministic fate, fear-based language, mind-reading claims, destiny-created reality claims, and professional-advice overreach.
27. No real payment, Stripe write, production deployment, production migration, or service-role writer is introduced by this implementation.
28. Existing advanced/detail pages may continue to expose people, agents, graph, running events, result, evidence, and calibration details.
29. `npm run check` passes after implementation, or any failure is documented with file, command, and blocker.
