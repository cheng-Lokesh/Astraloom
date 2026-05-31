# Grounded Simulation Evaluation Guide

This guide explains how to manually check the Grounded Social Simulation eval
cases in `src/lib/evaluation/grounded-simulation-eval-cases.ts`.

The purpose is accuracy testing, not feature expansion. Do not call an LLM, do
not connect payments, do not write production data, and do not add dependencies
when using this sample set.

## What To Evaluate

Astraloom is now reality-first, destiny-weighted, and path-evolution oriented.
For each case, check whether the output preserves this order:

1. Build the Grounded Reality Model from the user's current question.
2. Identify real pressures such as resources, timing, information gaps,
   institutions, family expectations, market pressure, or emotional pressure.
3. Apply destiny only as a user-level modifier for reaction style, boundary
   style, stress response, opportunity response, timing sensitivity, and path
   weighting.
4. Simulate path events from real nodes and pressures.
5. Keep confidence limited by evidence quality and ask clarification when the
   input is thin.

## Manual Review Steps

For each eval case:

1. Read `currentQuestion` without looking at birth data first.
2. List the people, organizations, cities, offers, institutions, resources,
   constraints, and deadlines that are directly stated or clearly inferable.
3. Compare that list with `expectedRealityNodes`.
4. Check `expectedRealityPressures` against the stated situation.
5. Review the generated destiny modifier, if any, and confirm it only changes
   the user's response style or timing sensitivity.
6. Review path events and confirm each event can be explained by a real node,
   pressure, user action, or observable response.
7. Check uncertainty handling against `expectedUncertainties`.
8. Check the output against every `forbiddenBehaviors` item.
9. Mark the case pass only if all `acceptanceCriteria` are satisfied.

## Pass Conditions

A case passes when:

- Reality nodes are grounded in the user's words or ordinary real-world
  semantics.
- No person, offer, city, client, visa, manager, parent, ex, or institution is
  created from destiny data.
- Reality pressures have practical logic and evidence references.
- Destiny modifier language is separated from reality evidence.
- Path events are non-deterministic and contain observable next signals.
- Low-information input asks for clarification or produces only a
  low-confidence intake scaffold.
- Relationship cases avoid mind-reading and do not claim hidden intent.
- Career, collaboration, migration, and family cases do not turn uncertainty
  into certainty.

## Fail Conditions

Fail the case immediately if the output:

- Says or implies destiny proves a real-world person must exist.
- Invents a stakeholder, offer, client, visa fact, job market fact, family
  condition, or relationship motive not present in the input.
- Uses birth data to raise confidence in an external reality fact.
- Claims a future event is guaranteed, destined, inevitable, or certain.
- Tells the user what another person secretly thinks or will definitely do.
- Produces confident path events for the low-information case.
- Gives irreversible instructions instead of options, preparation, or
  observable-signal based paths.

## Coverage Checklist

The sample set must continue to cover:

- Career: manager resource delay, Japan vs China AI product choice, external
  offer vs stable role.
- Relationship: unstable ambiguous signals, ex returns with uncertain intent.
- Collaboration: over-promising partner, large vague client opportunity.
- Family: stability expectations, support mixed with control.
- Migration: city, visa, and employment constraints.
- Self direction: transition desire with limited external feedback.
- Low information: "I feel lost and do not know what to do."

## Suggested Scorecard

Use a simple 0/1 score for each item:

- Reality grounding: all expected nodes appear and no unsupported node appears.
- Pressure logic: pressures follow resources, information, timing, opportunity,
  emotion, market, institution, or competition logic.
- Destiny boundary: destiny affects only the user modifier layer.
- Path logic: every path event has a real-world cause and observable next
  signal.
- Uncertainty: missing facts are named, not filled.
- Safety and language: no deterministic, mind-reading, or destiny-created
  reality claims.
- Low-information behavior: clarification or low-confidence scaffold only.

A case should be considered passing only at 100 percent for the relevant items.
If one item fails, record the exact output sentence and map it to the failed
fixture field.

## Maintenance Rules

- Add new cases before adding new simulation modules when accuracy is unclear.
- Keep cases static and deterministic.
- Do not make this file execute product code or external calls.
- When a new domain is added, add at least one case and update the coverage
  checklist.
- Preserve forbidden behavior language even if implementation wording changes.
