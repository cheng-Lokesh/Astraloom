# Current observations functional candidate
Journey: show current saved profile, real observation deadlines and separate simulated changes.
Contract: saved_profile + current_reality_profile source + profileRevision + safe classified items; absent profile not_modeled, unknown stays unknown. Existing world/nextAction unchanged.
nextChange recorded_deadlines: server assessedAt, <=8 saved before_time constraints sorted by epoch, upcoming > now, expired <= now with result unverified, never fulfilled; no constraints not_modeled.
Only upcoming supplies next observation; no History, simulation ticks or events supply dates. 本人记录的现实近况 is not Symbolic/Destiny climate.
RED a9ef795: npx vitest run src/lib/sandbox-overview/current-observations.test.ts --reporter=dot; exit 1, four intended failures.
Date-copy RED 38a172b: dashboard page.m2 target exit1, one intended failure; GREEN uses fixed Asia/Shanghai formatting with explicit UTC+8 and machine-readable time.
GREEN command: npx vitest run src/lib/sandbox-overview/current-observations.test.ts src/lib/sandbox-overview/overview.server.test.ts src/app/app/dashboard/page.m2.test.ts src/app/api/sandbox-overview/route.test.ts --coverage --coverage.include=src/lib/sandbox-overview/overview.server.ts --coverage.reportsDirectory=coverage/current-observations --reporter=dot
GREEN: four files/40 tests exit 0; projection coverage statements90.24%, branches90.78%, functions95.45%, lines100%.
Checks: npm run type-check exit0; git diff --check exit0.
Tests cover owner/current-chain read, safe source/classification/revision, timezone/same-instant/equality, expired-only/unknown, bounds/unsafe text, API envelope/component copy.
No schema/migration, V2 Core, historical Run, remote or publication changes. Authenticated browser verification belongs to controller.
Functional candidate only; no final stage acceptance claim.
