# Codex Task: [Module Name]

Use this template for every implementation task. Do not ask Codex to freely implement the whole product.

## 1. Product Background

This feature is part of the Astraloom MVP loop:

`Seed Context -> Key People -> Agent Profiles -> Relation Graph -> Simulation Ticks -> Event Logs -> Report Claims -> Feedback Calibration`

This task only covers:

- [Write the exact module here]

## 2. Scope

Implement:

- [Function 1]
- [Function 2]
- [Function 3]

Do not implement:

- [Explicit non-goal 1]
- [Explicit non-goal 2]
- [Explicit non-goal 3]

## 3. Data Contracts

Read first:

- `/docs/PRODUCT_CONSTITUTION.md`
- `/docs/MVP_SCOPE.md`
- `/docs/DATA_CONTRACTS.md`

Use these tables:

- [Table]
- [Table]

Use these fields:

- [Field]
- [Field]

If schema changes are needed:

- Create a migration.
- Update `/docs/DATA_CONTRACTS.md`.
- Keep RLS and user ownership rules intact.

## 4. API Contracts

Read first:

- `/docs/API_CONTRACTS.md`
- `/docs/SAFETY_RULES.md`

Create or update:

- [API route]

Each API must include:

- Input validation.
- Auth check for user data.
- `user_id` ownership check.
- Stable `error_code`.
- `trace_id` where relevant.
- No secrets in responses.

## 5. UI Requirements

Read first:

- `/docs/UI_ACCEPTANCE.md`

Page:

- [Route]

User must be able to:

- [Operation 1]
- [Operation 2]

User must not be able to:

- [Forbidden operation 1]
- [Forbidden operation 2]

## 6. Safety And Product Rules

- Do not use fortune-telling, astrology-app, mind-reading, or deterministic fate wording.
- Do not claim certainty.
- Do not generate high-risk advice.
- Use scenario simulation, relationship dynamics, sandbox, evidence chain, and feedback calibration language.
- Do not allow users to edit relation edge weights.
- Do not create report Claims without `evidence_event_ids`.
- Do not add social, community, leaderboard, feed, native app, or broad multi-domain prediction features.
- Do not call LLM, Stripe, or privileged backend writers unless this task explicitly includes and gates them.

## 7. Acceptance Criteria

This task is complete only if:

- [Acceptance item 1]
- [Acceptance item 2]
- [Acceptance item 3]
- Product copy passes `/docs/UI_ACCEPTANCE.md`.
- Safety behavior passes `/docs/SAFETY_RULES.md`.
- Data changes match `/docs/DATA_CONTRACTS.md`.
- API changes match `/docs/API_CONTRACTS.md`.
- Tests pass or the reason for not running them is reported.
- TypeScript has no errors or known failures are reported.
- Relevant docs are updated.

## 8. Final Response Format

At the end of the task, report:

1. Files changed.
2. What was implemented.
3. What was intentionally not implemented.
4. How to manually verify.
5. Tests or checks run.
6. Known risks.
7. Recommended next task.

