# Brand Rename Notes

Date: 2026-05-28

The display brand is now Astraloom.

Package identity was updated to `astraloom-app` in `package.json` and `package-lock.json`.

Local browser data compatibility is intentionally preserved. Existing localStorage keys that begin with `mirofish.` remain unchanged for now so users do not lose local scenario drafts, people, graph data, simulation runs, safety reviews, reports, feedback, support drafts, entitlement state, locale choice, or observability events.

The old admin env/header contract names are also intentionally unchanged:

- `MIROFISH_ADMIN_TOKEN`
- `x-mirofish-admin-token`

Those names should only change in a future migration that accepts both old and new names during a transition window and updates deployment configuration at the same time.
