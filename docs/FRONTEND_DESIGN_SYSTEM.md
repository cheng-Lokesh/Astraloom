# Astraloom Frontend Design System

This document turns `docs/PRODUCT_UX_NORTH_STAR.md` into reusable frontend rules for Astraloom. The system is intentionally lightweight: CSS tokens, `mf-*` classes, and small React primitives in `src/components/ui-foundation.tsx`. Do not introduce a large UI framework for these needs.

## 1. Design Intent

Astraloom should feel like a quiet premium consulting tool for reality-first future path simulation.

The UI should communicate:

- Real-world materials come first.
- AI can structure reality, but does not show off.
- Destiny climate is a subtle timing and reaction weighting layer.
- Path simulation is observable and evidence-linked.
- Debug exists, but does not dominate the main experience.

The UI must avoid mystic, RPG, chatbot, and admin-dashboard cues.

## 2. Color Tokens

Defined in `src/app/globals.css`.

Core tokens:

- `--mf-background`: warm ivory page background.
- `--mf-surface`: default warm surface.
- `--mf-surface-soft`: quiet secondary surface.
- `--mf-surface-elevated`: crisp elevated white surface.
- `--mf-ink`: deep ink primary text.
- `--mf-muted`: body and support text.
- `--mf-subtle`: labels, metadata, low-emphasis text.
- `--mf-border`: normal border.
- `--mf-border-strong`: emphasized border.
- `--mf-accent`: soft green action/accent.
- `--mf-accent-soft`: green-tinted support surface.

Semantic tokens:

- `--mf-source-backed`, `--mf-source-backed-soft`, `--mf-source-backed-text`: validated source-backed evidence.
- `--mf-local-assumption`, `--mf-local-assumption-soft`, `--mf-local-assumption-text`: local assumption / limited grounding.
- `--mf-danger`, `--mf-danger-soft`, `--mf-danger-text`: error or destructive action.
- `--mf-debug`, `--mf-debug-soft`, `--mf-debug-text`: technical/debug surfaces.
- `--mf-destiny-climate`, `--mf-destiny-climate-soft`, `--mf-destiny-climate-text`: restrained destiny weighting layer.

Rules:

- Use green for trust, evidence, readiness, and grounded source states.
- Use amber for limited capability, local assumption, missing grounding, or caution.
- Use muted gray for debug, technical metadata, raw state, and IDs.
- Use destiny color sparingly. It should never overpower reality evidence.

## 3. Card Hierarchy

Primary card classes and components:

- `RealityCard` / `.mf-card-reality`: real-world nodes, reality materials, external sources. Evidence cards use a subtle green left border and should look like consulting notes.
- `PathCard` / `.mf-card-path`: path evolution, branch comparison, sandbox moments.
- `FindingCard` / `.mf-card-finding`: Top findings and important result cards. This is one of the strongest surfaces.
- `CapabilityCard` / `.mf-card-capability`: runtime capability and honest-mode explanations.
- `DestinyWeightingCard` / `.mf-card-destiny`: destiny climate, timing lens, reaction weighting.
- `DebugCard` / `.mf-card-debug`: technical inspection and raw state. Dashed border, muted background, lower elevation.
- `WarningPanel` / `.mf-warning-panel`: risk, downgrade, limited-mode warnings.
- `EmptyState` / `.mf-empty-state`: no data, no events, no findings, not-ready states.

Hierarchy rules:

- Finding and reality cards carry the clearest hierarchy.
- Path cards should feel active but not game-like.
- Destiny cards should feel subtle and secondary to reality.
- Debug cards must be visually weaker than primary product cards.
- Do not make every surface look identical. Card variants exist to express product meaning.

## 4. Buttons

Use `Button` and `ButtonLink` from `src/components/ui-foundation.tsx`.

Variants:

- `primary`: main next step or primary submit.
- `secondary`: supportive action, alternate route, sample view.
- `accent`: constructive source-backed or grounding-related action.
- `warning`: limited-mode or caution-related action.
- `ghost`: debug, advanced, secondary disclosure, low-emphasis action.
- `danger`: destructive or irreversible action.
- `onDark`: primary action on dark panels.
- `ghostOnDark`: secondary action on dark panels.

Rules:

- One primary button per decision area.
- Debug and advanced entry points should use `ghost`.
- Dangerous actions must use `danger`.
- `loading` on `Button` shows a small pulse and disables the control.
- Disabled buttons should remain readable without pulling focus.

## 5. Forms

Use form primitives from `src/components/ui-foundation.tsx`:

- `FormSection`: groups related inputs.
- `FieldLabel`: consistent upper-label treatment.
- `HelperText`: low-emphasis support copy.
- `ErrorText`: validation or save errors.
- `TextInput`: single-line input.
- `Textarea`: multi-line real situation or material input.
- `Select`: option sets.
- `CheckboxRow`: binary settings and acknowledgement rows.
- `OptionalSection`: folded optional input groups.
- `MaterialInputCard`: user-provided reality material cards.

Form rules:

- The real case description should feel central, not like a dry questionnaire.
- Reality materials should look like evidence inputs.
- Optional sections should reduce friction but still communicate how grounding improves trust.
- Mobile forms should be single-column with large tap targets.
- Error text should be specific and calm.

## 6. Status Badges

Use `StatusBadge` or named badge components:

- `SourceBackedBadge`: source-backed evidence is available.
- `LocalAssumptionBadge`: local assumption mode; not source-backed.
- `AiIntakeBadge`: AI structured the reality intake.
- `ExternalRealityBadge`: external reality sources are attached.
- `FullGroundedBadge`: full grounded reality mode is available.
- `ConfidenceBadge`: confidence or signal strength.
- `WarningBadge`: caution, limitation, missing data.
- `DestinyWeightingBadge`: timing lens or destiny weighting.
- `DebugBadge`: technical/debug metadata.

Rules:

- Users should be able to distinguish local assumption, AI intake, external reality, full grounding, destiny weighting, and debug at a glance.
- Do not use badges as decoration. They must communicate state.
- Source-backed badges are green; local assumption badges are amber; debug badges are muted gray.

## 7. Debug Display Principles

Debug is allowed, but folded and visually weak.

Main surfaces may show:

- current capability state
- reality material count
- path/finding/event count
- user-readable evidence basis

Folded debug areas may show:

- raw event
- technical IDs
- `traceId`
- `modelVersion`
- `evidenceEventIds`
- graph details
- technical state snapshots

Rules:

- Use `DebugCard` or `.mf-card-debug` for debug blocks.
- Keep debug details closed by default on mobile.
- Do not place raw IDs in the main reading path.
- Debug copy should explain inspection purpose without sounding like an admin console.

## 8. Motion

Allowed motion classes:

- `.mf-hover-lift`: subtle hover lift for actionable cards.
- `.mf-card-fade-in`: quick card entrance.
- `.mf-progress-pulse`: small progress pulse.
- `.animate-stage-fill`: stage progress fill.
- `.mf-skeleton-shimmer`: loading skeleton shimmer.

Rules:

- Motion must clarify state, progress, or interactivity.
- Do not use mystical reveals, excessive animation, glow effects, or game-like motion.
- Respect `prefers-reduced-motion`; global CSS disables these animations for reduced-motion users.
- Do not add `framer-motion` or another motion dependency.

## 9. Responsive Rules

Mobile requirements:

- Forms collapse to one column.
- Cards stack in one column.
- Primary CTA remains easy to tap.
- `mf-button` uses a full-width mobile treatment by default.
- Debug and advanced sections should stay folded by default on mobile.
- Navigation should remain horizontally scrollable instead of overflowing the viewport.

Desktop requirements:

- Use page grids only where the right rail genuinely helps.
- Avoid dashboard-like KPI walls.
- Keep reading width controlled for long explanations.
- Technical sidebars should not dominate the first viewport.

## 10. Migration Guidance

Use this order when upgrading existing screens:

1. Replace generic surface wrappers with `RealityCard`, `PathCard`, `FindingCard`, `CapabilityCard`, `DestinyWeightingCard`, `DebugCard`, or `WarningPanel`.
2. Replace one-off buttons with `Button` or `ButtonLink` variants.
3. Replace form labels/inputs with the form primitives.
4. Replace ad hoc pills with named badges.
5. Move IDs and raw technical state into `DebugCard` or folded areas.

Do not change business logic, API behavior, simulation behavior, report/claim invariants, destiny calculations, confidence, payment, or evidence IDs as part of visual migration.
