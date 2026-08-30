# M1 formal account sandbox acceptance evidence

Date: 2026-08-30
Branch: `productization/phase-4-account-sandbox-loop`
Canonical start: `0bbb9a76cb35c0d985e3c643535a28675d7cd192`

This record intentionally excludes test identities, credentials, UUIDs,
fictional scenario text, secrets, database dumps, screenshots, and raw logs.

## Stage ledger

| Stage | Commit | Result |
| --- | --- | --- |
| M1.0 contract/gap proof | `768bc119185bebe76f58345303dd59cb88c5fd59` | PASS |
| M1.1 security precondition | `6cd05ac4fd9619a7888e78a2c647086824a7405d` | PASS |
| M1.2 formal run bundle | `68f260475ebd43ded2320928ae1a5a03d7c27fd6` | PASS |
| M1.3 formal APIs | `0e9a2dc55b79ee5a680cb75a4dd8b7c4200ec4e1` | PASS |
| M1.4 formal Graph/Running/Result UI | `0e8f3c8cbdd30f58450b0ce27402430a86cf9093` | PASS |
| M1.5 History/Feedback/Calibration | `8b79db52926860772f2dc57829bb3817c9482356` | PASS |
| M1.6 authenticated acceptance/closeout | final revalidation on this branch | PASS |

## Authenticated product evidence

- A fresh local account submitted one Track A Seed, confirmed two People,
  generated one immutable five-Agent snapshot, and locked one four-edge Graph.
- The account completed two 30-day formal runs. Each persisted nine Events, one
  evidence-linked Claim, and one Report. History showed both runs newest-first
  and reopened the older immutable Result.
- Feedback on the first completed run was append-only. The second run captured
  the bounded prior feedback signal; the first run's Graph, input, Events,
  Claim, Report, and result hashes remained byte-stable.
- Refresh, sign-out/sign-in, and a separate browser session recovered the same
  two account runs from the API-backed History.
- A second fresh account saw empty History and could not read the first
  account's status/result. Anonymous History and Result access was rejected.
  pgTAP additionally proved bidirectional SELECT, mutation, delete, association,
  start-run, idempotency, and protected-RPC boundaries.
- Browser checks reconciled HTTP/JSON responses, visible state, server behavior,
  and database invariants. Formal pages never used localStorage for completion,
  Result, History, or Feedback and never displayed a false completed state.
- Responsive checks passed at 375, 768, and 1280 CSS pixels, including keyboard
  access, visible focus, labels, non-colour state cues, and long-content flow.

## Automated gates

- pgTAP: Phase 2 (7 + 10), Phase 3 (74 + 174 + 163), and M1 (27 + 64 + 19),
  totaling 538 passing assertions against the existing non-reset local database.
- Full Vitest: 58 files and 572 tests passed.
- Golden regression: all eight implemented Golden Cases passed.
- V2 suites: Evidence 83, World 116, Trajectory 63, Analysis 47,
  Claims/Reports 23, Calibration 40, and Stage 8 Migration/Async 22 tests passed.
- Repository coverage: 90.85% statements, 81.21% branches, 95.55% functions,
  and 93.52% lines. Every V2 suite-specific threshold passed.
- ESLint, generated route types plus TypeScript, and Next.js production build
  passed. `git diff --check` passed.
- The canonical V2 directory has no Phase 4 diff. No real AI, Stripe, Docker
  lifecycle action, remote migration, or service-role user-state acceptance
  was used.

## Acceptance hardening and known gap

Real account rows exposed three Phase 3 pgTAP assertions that incorrectly used
global counts for fixture-specific claims. They are now fixture-owner scoped;
all security and immutability expectations remain unchanged. A browser check
also exposed server/client draft hydration divergence on Intake. Draft recovery
now begins after hydration; local drafts remain compatible and the formal data
path remains API-only. The final recheck had no M1 console error or warning.

The conservative lexical safety verifier can flag benign words containing a
short safety token. Acceptance did not weaken that boundary: the fictional
input was rephrased and the safe path then passed. Improving tokenization is a
separate future product decision, not part of M1 and not a reason to expand M1.

## Stop boundary

M1 ends with the formal account Track A sandbox loop. This branch does not
start Track B, real AI, Stripe/payment productization, broader writer/admin
cleanup, V2 Core redesign, or any M2 milestone.

## Final revalidation (2026-08-30)

The previous `persistence_failed` configuration condition remains resolved
locally: the formal start route uses a server-only service-role client only
after it authenticates the caller. The local value remains ignored, unprinted,
uncommitted, and absent from browser bundles.

The discovered formal Seed recovery defect is fixed and must not be treated as
the current blocker. RED coverage showed that People, Agents, and Graph
silently selected a newer submitted Seed even when an earlier owner-scoped Seed
had the complete saved chain. GREEN coverage now proves that an explicit,
Zod-validated `seed_id` is matched only against the account's safe
`/api/seed-context` projection; People, Agents, and Graph all request that
same Seed, selection persists in the page URL, and an absent or foreign value
is not probed and safely falls back to the owner's projected list. The UI shows
a labelled keyboard-accessible scenario selector without revealing scenario
text or using localStorage.

The same revalidation exposed a separate History-ordering defect: two valid
formal Runs created in one transaction could share `created_at`, leaving the
newest-first tie-break dependent on UUID order. RED pgTAP captured it. An
additive local migration changes only the canonical Run timestamp default to
`clock_timestamp()`; GREEN pgTAP proves the later Run has a later timestamp and
History returns it first. Existing migration files and V2 Core remain unchanged.

The full Vitest regression now passes, including the previously resource-sensitive
V2 Outcome/Calibration and Migration/Async scripts when run serially with no
residual acceptance process. The authenticated browser replay completed with
two new neutral local accounts and an anonymous context. M1.6 is PASS; no M2
work was started.

The repository-wide `scripts/secret-scan.ps1` still returns its documented
false positive for explanatory blank-key examples in pre-existing setup
documents. A narrowed scan of the actual Phase 4 changes, including this final
revalidation change, found no credential, private-key, PII, or high-entropy
access-token pattern. The tooling was not silenced or altered.

The final authenticated database check found two new account Runs with 18
Events, two evidence-linked Claims, two Reports, one append-only Feedback row,
and no orphan generated artifact. The earlier Result reopened unchanged after
feedback, refresh, re-login, and an independent browser context; the second
Run was created after the feedback and retained a calibration snapshot. A
second account had empty History and could not enumerate the first account's
Run; anonymous History was rejected. The replay recorded no M1 console error
or warning and passed 375/768/1280, keyboard, focus, label, non-colour, and
long-content checks.
