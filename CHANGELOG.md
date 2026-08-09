# Changelog

This file is the permanent, lightweight version record for Astraloom. Entries are
newest first.

## [v0.1.0] - 2026-08-09

### Release metadata

- Branch: `governance/phase-3-version-baseline`
- Version baseline commit SHA: `a42da5df1c983fe723ce5612f607775694fb1943`
- Previous project revision: `38ad3353332a2e68b7ed3a15ce583a308914c010`
- Screenshot: [latest locally running home page](docs/version-screenshots/v0.1.0/home.png)

### Added

- Established the permanent version-record rules in `AGENTS.md`.
- Added this project-level changelog and the `v0.1.0` Git tag.
- Captured a real, locally running baseline screenshot of the homepage.

### Current baseline functionality

- Reality-first scenario-simulation website with a public Astraloom observatory
  homepage and routes for intake, people, agents, a read-only relationship graph,
  simulation running, results, archive, settings, support, and billing.
- Product flow retains the evidence chain from Seed Context through Key People,
  Agent Profiles, Relation Graph, Simulation Ticks, Event Logs, Claims, Reports,
  and Feedback Calibration.
- The current implementation includes Phase 3 graph snapshot persistence routes and
  its Supabase migration from the preceding revision.

### Changed

- This is the initial version-record baseline; existing product behavior was not
  changed or rewritten.

### Fixed

- No product bug fix is included in this baseline.

### Improvement over the previous revision

- The current state can now be identified, compared, and recovered through a tagged
  version entry, a concise change record, and a real page screenshot.

### Page status

- Homepage visual baseline captured from `http://127.0.0.1:3000/` in the latest
  locally running application.

### Known issues

- No known product issue was discovered while recording this baseline. This release
  records the existing state and does not constitute a full end-to-end product audit.
- The existing `npm run lint` command did not complete within two minutes and
  produced no diagnostic output; it was stopped without treating that timeout as a
  successful lint pass.
