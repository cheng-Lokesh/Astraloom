# Project MiroFish Product Constitution

This document is the product constitution for all Project MiroFish implementation work. If any task, code change, UI copy, data model, or architecture choice conflicts with this document or the whitepaper, the whitepaper and this constitution win.

## Product Identity

MiroFish is an AI Life Simulator and relationship/decision sandbox.

It helps users load a real-life situation into a small agent ecology, observe relationship dynamics over time, and review evidence-backed scenario outcomes.

MiroFish is not:

- An astrology app.
- A fortune-telling app.
- A therapy app.
- A mind-reading app.
- A CRM or relationship management editor.
- A generic chatbot.
- A deterministic prediction engine.

## Core Product Loop

Every MVP feature must serve this loop:

`Seed Context -> Key People Extraction -> Agent Profiles -> Relation Graph -> Simulation Ticks -> Event Logs -> Report Claims -> Feedback Calibration`

The product is healthy only when users can see how a claim traces back to people, relationships, simulation events, and evidence.

## Non-Negotiable Rules

1. Every important person must become an Agent Profile before simulation.
2. Every important relationship must become a Relation Edge.
3. Every simulation result must be backed by Event Logs.
4. Every important report claim must reference `evidence_event_ids`.
5. The relationship graph is read-only for users.
6. Users can confirm, merge, delete, rename, or supplement people, but cannot manually edit trust, hostility, dependency, attraction, competition, or other edge weights.
7. Free preview must stay low-cost and cannot run full NPC deep scans by default.
8. Paid unlock reveals deeper evidence, specific NPC paths, complete event chains, parallel-self differences, and strategy depth; it cannot invent stronger claims.
9. The product must never claim it predicts fate with certainty.
10. High-risk scenarios must trigger safety downgrade and conservative messaging before any generation or unlock.
11. Report text is downstream of Agent Profiles, Relation Edges, Simulation Ticks, Event Logs, and Claims. It must not become an independent mystic article.
12. Implementation must proceed in small, testable modules. Do not attempt to implement the whole whitepaper in one task.

## Forbidden Product Shapes

- Do not build a generic AI chat app.
- Do not build a fortune-telling report generator.
- Do not build a CRM-style relationship editor.
- Do not build a graph demo whose nodes and edges are not backed by Agent Profiles, Relation Edges, Event Logs, and evidence.
- Do not build a role-playing game with continuous user choices during simulation.
- Do not build social, community, leaderboard, or feed features in MVP.
- Do not build native app code in MVP.
- Do not build broad multi-domain life prediction in MVP.
- Do not hide the sandbox behind a long text report.

## Product Language

Allowed language:

- Scenario simulation.
- Relationship dynamics.
- Digital agents.
- Sandbox.
- Event log.
- Evidence chain.
- Confidence.
- Risk window.
- Opportunity window.
- Strategy guide.
- Feedback calibration.

Forbidden user-facing language:

- Fate is certain.
- Guaranteed to happen.
- Destined.
- We know what the other person really thinks.
- This person will definitely do X.
- Pay to reveal the truth.
- Pay to avoid disaster.
- Fortune, divination, mind reading, or equivalent wording as the product identity.

## Founder And Codex Roles

The founder acts as product director and architecture approver.

Codex acts as an execution construction team:

- It may implement code, tests, docs, and QA scripts.
- It must not freely expand product scope.
- It must read the relevant governance docs before feature work.
- It must return acceptance evidence after each task.
- It must call out product risks instead of silently choosing a different product shape.

