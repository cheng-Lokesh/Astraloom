# Astraloom Grounded Social Simulation Direction

## Product Direction

Astraloom is a reality-first, destiny-weighted personal future path simulator.

It first understands the user's current real-world situation, then uses destiny climate as a timing lens and personal reaction modifier to simulate how several possible future paths may unfold.

User-facing Chinese:

> Astraloom 会先理解你当前所处的现实环境，再结合你的命理气候，模拟几种未来路径可能如何展开。

User-facing English:

> Astraloom grounds your current real-world situation first, then uses destiny climate as a timing lens to simulate possible future paths.

This direction keeps Astraloom close to the grounded simulation spirit of MiroFish: build the real social model first, then use symbolic or personal context to adjust the user's reaction tendencies and timing sensitivity inside that model.

## Main Chain

The canonical product chain is:

`SeedContext -> Grounded Reality Model -> Destiny Person Modifier -> Grounded Path Simulation -> Findings -> Evidence Basis`

### SeedContext

Captures the user's free-form current question, basic destiny or birth information when provided, time window, consent, and source fragments. It marks missing essentials without inventing them.

### Grounded Reality Model

Builds the real-world situation model before any destiny adjustment.

It may use:

- User input.
- Inferable real-world semantics.
- Sample data.
- Future external data interfaces.

It identifies:

- People, roles, groups, and institutions.
- Recent events.
- Resources.
- Opportunities.
- Constraints.
- Choices and options.
- Safety boundaries.
- Unknown or ambiguous facts.

It must not use destiny to create or complete these facts.

### Destiny Person Modifier

Applies destiny only as a modifier to the user inside the already-grounded model.

It may use:

- `DestinyProfile`.
- `DestinyClimate`.

It may affect only:

- User personal tendencies.
- Stress responses.
- Opportunity responses.
- Boundary style.
- Timing climate.
- Path weighting.

It must not create people, institutions, social facts, events, opportunities, or constraints.

### Grounded Path Simulation

Simulates possible future paths from the Grounded Reality Model. Destiny Person Modifier can change how the user's reactions, pressure sensitivity, timing windows, and path weights are represented, but the future path must remain anchored in real-world nodes, resources, opportunities, and constraints.

### Findings

Findings summarize what the simulation suggests. They must stay non-deterministic, cite evidence, and separate real-world basis from destiny basis.

### Evidence Basis

Evidence Basis shows where each important output came from:

- Reality basis: user input, inferable real-world semantics, sample data, or future external data interfaces.
- Destiny basis: `DestinyProfile` or `DestinyClimate`.

Destiny basis can explain user tendency and timing weight. It cannot prove a real-world fact.

## Hard Boundaries

- The real world cannot be generated from destiny alone.
- Destiny cannot create society.
- Destiny cannot directly assert that a specific person must exist in the user's real life.
- Destiny cannot fill missing real-world facts.
- Destiny cannot be used to prove destiny by inventing confirming reality.
- Future simulation must be based on real-world nodes, real-world resources, real-world opportunities, and real-world constraints.

When a reality fact is unknown, Astraloom should mark it as unknown, ask limited clarification if essential, or simulate multiple grounded possibilities.

## Forbidden Expressions

Do not use these expressions or equivalent claims in user-facing copy:

- "命理显示现实中一定有这个人"
- "系统知道你真实遇到过谁"
- "这个人一定存在"
- "必然"
- "注定"
- "一定会"
- "克你"
- "以命理直接补齐现实事实"
- "Destiny shows this person must exist."
- "The system knows who you really met."
- "This person certainly exists."
- "Inevitable."
- "Destined."
- "Will definitely happen."

## Legacy Term Mapping

Existing code and older docs may still mention `SituationExtraction`, `KeyPeople`, `DestinySituationFusion`, `SituationMap`, `SandboxEvents`, or `PathDivergence`.

For product direction, interpret them under the grounded chain:

- `SituationExtraction` and `KeyPeople` feed the Grounded Reality Model.
- `DestinySituationFusion` must behave as Destiny Person Modifier plus evidence annotation, not a reality fact generator.
- `SituationMap` is a view of the Grounded Reality Model, not a destiny-created world.
- `SandboxEvents` and `PathDivergence` are parts of Grounded Path Simulation.
- Report claims and findings must be supported by Evidence Basis.

No runtime code, UI, destiny calculation, simulation, report, claim, API, payment, Stripe, or production database behavior should be changed merely because this direction document exists.
