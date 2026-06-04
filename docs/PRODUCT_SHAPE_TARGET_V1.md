# Astraloom Product Shape Target V1

This document records the current product-shape target before backend expansion.

## Current Target

Astraloom should first feel like a user-facing situation sandbox entry point.

The user should be able to start by writing one natural-language question or one paragraph about a real situation. Optional reality materials, birth/destiny context, and advanced capability state must support the run, but they must not dominate the first operation path.

Reference demo:

- `docs/assets/astraloom-use-page-demo-v3.png`
- `docs/assets/astraloom-use-page-demo-v3.html`

## First-Screen Principle

The first screen asks one core question:

> What are you facing right now?

Required first-screen elements:

- A large natural-language input.
- A simple time-window selector.
- One primary action: generate sandbox.
- A short explanation of what happens after submit.
- A clear note that reality facts come from user-confirmed material.
- A quiet capability status area.

Secondary or folded elements:

- Optional screenshots, chat summaries, offer terms, company notes, or market notes.
- Optional birth/destiny context.
- Runtime details, source mode labels, and fallback warnings.
- Sample/demo links.

## Product Boundaries

Keep:

- Reality-first situation intake.
- Destiny as timing lens and user reaction weighting only.
- Observable paths, uncertainty, and next signals.
- Minimal clarification: one to three questions only when essential.
- Safety downgrade for high-risk scenarios.

Avoid:

- Generic chatbot framing.
- Fortune-telling or deterministic fate language.
- Long questionnaire as the default start path.
- CRM-like graph editing.
- Result/report-first first impression.
- Backend or AI capability expansion before the user-facing product shape is coherent.

## Limited Product-Shape Build Order

1. Make `/app/start` match the low-friction usage-page target.
2. Make `/app/start/clarify` ask only essential follow-up questions.
3. Make `/app/simulation/running` explain progress in user language, not debug language.
4. Make `/app/simulation/result` show paths, evidence, uncertainty, and next observations without becoming a deterministic report.
5. Only after the above is coherent, continue backend grounding, AI intake, search, storage, and paid-depth work.

## Acceptance

The product-shape pass is acceptable when:

- A new user understands they can start by describing one real situation.
- Birth/destiny context is visibly optional or secondary.
- Reality materials are available but not required up front.
- The page does not look like a backend dashboard, astrology form, generic chat app, or final report.
- Important uncertainty and capability limits remain visible without blocking the first action.
