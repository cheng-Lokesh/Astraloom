# Project Astraloom Safety Rules

Safety downgrade overrides product flow, paid unlock, and report generation.

## Product Safety Position

Astraloom provides scenario simulation and relationship dynamics review. It does not provide medical, legal, financial, psychological, emergency, or personal-safety professional advice.

## High-Risk Categories

Trigger safety downgrade for:

- Self-harm or suicide.
- Violence or threats.
- Stalking, coercive control, surveillance, or partner monitoring.
- Medical diagnosis or treatment.
- Legal decisions.
- Financial investment or debt decisions.
- Harassment, revenge, blackmail, or manipulation.
- Minor safety concerns.
- Claims that require knowing another person's private thoughts or intent with certainty.

## Downgrade Behavior

When high-risk content is detected:

1. Stop deterministic or high-confidence generation.
2. Do not create strong Claims.
3. Do not use paid unlock to reveal more aggressive conclusions.
4. Show conservative safety messaging.
5. Encourage professional or emergency support where appropriate.
6. Preserve a safe audit/support trail when relevant.

## SafetyVerifier v1

The Local MVP now uses a deterministic `SafetyVerifier` before key product
actions. It is not an LLM classifier and does not connect to Supabase, payment,
or external services.

Verifier input:

- `SeedContextDraft`
- optional Agent Profiles
- optional Relation Edges
- optional Simulation Run
- optional Claims

Verifier output:

- `safetyLevel`: `safe`, `caution`, `downgraded`, or `blocked`
- `flags`
- `userMessage`
- `allowedActions`
- `blockedActions`
- `reportRestrictions`

Required flags:

- `self_harm`
- `violence`
- `stalking`
- `surveillance`
- `partner_monitoring`
- `medical`
- `legal`
- `investment`
- `therapy`
- `minor_safety`
- `revenge`
- `coercion`
- `third_party_mind_reading`
- `deterministic_fate`
- `guaranteed_reconciliation`

Gate points:

- Intake submit: blocked content stops progression before saving a runnable
  scenario.
- Simulation running: blocked content stops tick/Event Log generation.
- Report rendering: blocked content stops report rendering; downgraded content
  hides high-risk strong Claims.
- Paid unlock: paid unlock must run SafetyVerifier first and cannot bypass
  blocked or downgraded decisions.

Downgraded mode allows only relationship structure review and low-risk
communication options. It must not display monitoring, tracking, revenge,
coercion, medical, legal, investment, therapy, third-party mind-reading, or
deterministic fate instructions.

## Forbidden Safety Behavior

- Do not present simulation output as professional advice.
- Do not recommend irreversible actions as direct instruction.
- Do not claim another person will definitely behave a certain way.
- Do not tell users the product can reveal hidden thoughts.
- Do not make payment a path around safety downgrade.
- Do not increase certainty because a user paid.

## Report Safety Rules

Every report must include:

- Confidence language.
- Evidence references.
- A clear non-deterministic framing.
- Safety disclaimer when risk is present.
- Action suggestions phrased as options, preparation, reflection, or communication strategies, not commands.

## Payment Safety Rules

Paid unlock may reveal:

- More complete evidence.
- More detailed event chain.
- More specific NPC path summaries.
- More strategy depth.

Paid unlock may not:

- Change claim direction.
- Raise confidence without evidence.
- Remove downgrade.
- Create fear pressure.
- Promise prevention of harm.

## Free Preview Safety Rules

Free preview must:

- Stay low-cost.
- Stay coarse when evidence is incomplete.
- Avoid deep NPC inference.
- Avoid precise claims without Event Logs.
