# Context Recovery Protocol

Use this when the conversation window is full or after a compacted session.

## Minimal Read Set

1. `docs/implementation-state.md`
2. `docs/stage-index.md`
3. `docs/decision-log.md`
4. `docs/codex-next-task.md`

Do not reread every historical writer document unless the current task directly touches that stage.

## Work Loop

1. Identify the current stage from `docs/implementation-state.md`.
2. Confirm the next stage from `docs/codex-next-task.md`.
3. Implement one narrow stage at a time.
4. Update the compact docs only with durable facts.
5. Run reusable scripts instead of pasting long commands into chat.
6. Keep final replies short: changed files, verification, next step.

## Default Safety Position

All system writer work remains read-only until a later explicit authorization phase. Any code that would create service-role clients, run transactions, apply migrations, call AI providers, call Stripe, unlock reports, or write system-owned rows is out of scope.

## QA Shortcuts

- Core lint/build/safety check, with local Next server stopped: `powershell -ExecutionPolicy Bypass -File scripts/qa-stage.ps1`
- Stage67 API invariant check, with local Next server running: `powershell -ExecutionPolicy Bypass -File scripts/qa-stage.ps1 -Stage 67 -SkipBuild`
- Stage69 API invariant check, with local Next server running: `powershell -ExecutionPolicy Bypass -File scripts/qa-stage.ps1 -Stage 69 -SkipBuild`
- Stage70 API invariant check, with local Next server running: `powershell -ExecutionPolicy Bypass -File scripts/qa-stage.ps1 -Stage 70 -SkipBuild`
- Stage71 API invariant check, with local Next server running: `powershell -ExecutionPolicy Bypass -File scripts/qa-stage.ps1 -Stage 71 -SkipBuild`
- Secret scan only: `powershell -ExecutionPolicy Bypass -File scripts/secret-scan.ps1`
- Route smoke check: `powershell -ExecutionPolicy Bypass -File scripts/route-check.ps1 -PagePath "/server-writers/p67-reconciliation" -ApiPath "/api/system-writers/p67-reconciliation"`
