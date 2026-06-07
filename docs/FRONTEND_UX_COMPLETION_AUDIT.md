# Astraloom Frontend UX Completion Audit

## 1. Summary: PASS

Primary user flow status: PASS.

Whole-site UX completion status: PASS for the requested scope.

Astraloom now reads as a reality-first, destiny-weighted path simulation product across Dashboard, Start, Running, Result, Archive, Settings, Support, and Start Clarify. Runtime capability remains visible without dominating the first viewport. Debug and technical inspection remain available but are folded behind accuracy/debug or advanced areas.

Advanced structure routes under `/app/new/*` and admin surfaces still contain implementation vocabulary by design. They are not part of the ordinary user flow and remain accessible only as weakened advanced or internal entry points.

## 2. Product Positioning Check

PASS.

The first ten seconds on Dashboard communicate:

- Astraloom grounds real-world situation before path simulation.
- Destiny is a timing and response-weighting lens, not a fact generator.
- The product is not a fortune report, chatbot, admin console, or RPG.
- The next action is clearly the real-case start CTA in both English and Chinese.

The visual tone is warm ivory, soft green, deep ink, restrained, and consulting-tool oriented. No mystical, tarot, crystal, RPG, or gamified visual direction appears in the primary flow.

## 3. Dashboard Check

PASS.

Dashboard behaves like a product home:

- Hero explains "Ground reality first. Then simulate possible paths."
- Primary CTA starts a real case.
- Sample entry is secondary.
- Capability card shows current mode, DeepSeek status, external reality status, manual material status, and source-backed state.
- Advanced links are present but low-emphasis.
- Mobile width no longer overflows after min-width and long-text wrapping fixes.

## 4. Start Check

PASS.

Start reads as a real case submission page:

- Current reality question is the main input.
- Real-world materials are visible and encouraged.
- Birth information is visually and semantically secondary under destiny weighting.
- Copy states that destiny does not create real-world facts.
- Capability status clearly says when a run cannot be a full grounded simulation.
- Loading steps distinguish saving input, DeepSeek reality intake, external search, grounded model building, destiny weighting, and path sandbox generation.

English and Chinese mode labels are separated correctly.

## 5. Running Check

PASS for the requested frontend UX scope.

Running feels like a sandbox unfolding:

- Top state shows current mode, source-backed status, DeepSeek participation, and external search participation.
- Stage progress distinguishes completed, running, skipped, unavailable, fallback, and failed states.
- Reality model overview, destiny weighting, and four path cards are separated.
- Technical details are folded.
- Accuracy debug is folded and named consistently in both Chinese and English.

Underlying extraction accuracy remains a model/product quality topic, not a frontend completion blocker.

## 6. Result Check

PASS.

Result first screen answers:

- Whether the result is source-backed.
- Whether DeepSeek and external sources participated.
- The top 3 findings.
- Source types for each finding.
- Confidence and uncertainty.
- Next observations and path comparison.

The report avoids deterministic fate language and does not claim to know another person's real thoughts. Debug is folded at the bottom.

## 7. AppShell / Navigation Check

PASS.

The shell no longer reads like an admin dashboard:

- Brand subtitle communicates the reality-first personal path sandbox positioning in both English and Chinese.
- Desktop primary navigation focuses Home / Start / Sandbox / Result.
- Archive, Settings, Support, and Advanced structure are in More.
- Mobile navigation focuses Start / Sandbox / Result.
- Header is sticky, compact, and does not horizontally overflow in the checked viewport.
- Language switching remounts the main content so English mode does not retain Chinese DOM substitutions.

## 8. Runtime Capability Check

PASS.

Runtime capability is visible on the primary pages:

- Current mode is shown.
- DeepSeek participation is shown.
- External source participation is shown.
- Source-backed / not source-backed status is shown.
- Local assumption and manual reality states are not presented as full grounded simulation.

The banner is compact by default and expands into details.

## 9. Debug Noise Check

PASS.

Debug content is preserved but lowered:

- Accuracy debug remains available.
- Technical IDs and raw inspection fields are inside folded sections.
- Event cards use path-event, evidence basis, reality basis, destiny weighting, and confidence language.
- Archive, Settings, and Support use calmer user-facing labels instead of letting technical object names dominate.

Internal type names and data-contract identifiers still use Agent / Claim / Relation Edge where they are implementation contracts. They should not be renamed without a schema or API migration.

## 10. Mobile Check

PASS for the requested smoke verification.

Browser checks covered:

- `/app/dashboard`
- `/app/start`
- `/app/simulation/running`
- `/app/simulation/result`
- `/app/archive`
- `/app/settings`
- `/app/support`
- `/app/start/clarify`

Observed:

- No horizontal overflow in the checked in-app browser viewport.
- Dashboard hero and capability card no longer push beyond page width.
- Local sandbox long user text wraps instead of widening the page.
- Main CTAs remain visible and tap-sized.
- Debug and technical content remain folded.

A final real-device screenshot pass is still recommended before public launch, but it is not a blocker for this requested completion pass.

## 11. Chinese / English Check

PASS.

Chinese primary flow is natural across the requested pages. English mode no longer retains Chinese UI copy after language switching.

Allowed English-mode Chinese text observed:

- The Chinese language switch button.
- User-provided Chinese case content.
- Chinese font sample text in Settings.

Technical terms are kept in folded debug or advanced areas where needed for auditability.

## 12. Remaining Follow-Up Issues

- Advanced structure routes under `/app/new/*` still contain legacy implementation vocabulary. They are intentionally weakened behind More / Advanced structure.
- The grounded simulation UI is source-aware, but extraction quality depends on the current reality intake and search implementation.
- Archive, Settings, and Support are now usable and calmer, but can be further polished later as secondary product surfaces.
- A dedicated 390px visual screenshot pass would be useful before public launch.

## 13. Minimal Completion List

Completed after the interrupted pass:

- Fixed English copy leakage in Start and Running capability/status labels.
- Rewrote Support page user-facing copy into clean Chinese and English.
- Fixed language switching so English mode remounts clean content instead of retaining Chinese DOM replacements.
- Fixed Dashboard and local sandbox cards that could overflow on mobile-width layouts.
- Verified `/app/start/clarify` in both Chinese and English through the browser.
- Updated this audit from stale incomplete wording to current PASS status.

Validation:

- Browser smoke audit passed for requested pages.
- `npm run check` passed in this completion pass.
