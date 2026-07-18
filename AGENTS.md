<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Astraloom Governance

Before implementing any feature code, read these documents:

- `docs/PRODUCT_CONSTITUTION.md`
- `docs/MVP_SCOPE.md`
- `docs/DATA_CONTRACTS.md`
- `docs/API_CONTRACTS.md`
- `docs/UI_ACCEPTANCE.md`
- `docs/SAFETY_RULES.md`
- `docs/CODEX_TASK_TEMPLATE.md`

Treat Codex as the implementation crew, not the product owner. The founder is the product director and architecture approver.

# Default Delivery Platform

- Unless the founder explicitly mentions another platform or client, all requests default to the website only.
- Do not automatically extend website work to WeChat Mini Programs, native mobile apps, desktop apps, browser extensions, or other clients.
- If another platform is explicitly requested, limit the additional work to the platform(s) named in that request.

Non-negotiables:

- Astraloom is an AI Life Simulator and relationship/decision sandbox, not astrology, fortune-telling, therapy, mind-reading, CRM, or a generic chatbot.
- The core loop is `Seed Context -> Key People -> Agent Profiles -> Relation Graph -> Simulation Ticks -> Event Logs -> Report Claims -> Feedback Calibration`.
- The relation graph is read-only to users.
- Users may confirm, merge, delete, rename, or supplement people, but must not manually edit relation edge weights.
- Every important report claim must reference `evidence_event_ids`.
- Free preview must stay low-cost and cannot run full NPC deep scans.
- Paid unlock reveals evidence and strategy depth; it cannot invent stronger claims or bypass safety.
- High-risk scenarios must trigger safety downgrade before generation or unlock.
- Do not add social/community/feed/native-app/broad multi-domain prediction features in MVP.
