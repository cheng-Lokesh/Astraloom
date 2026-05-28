"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { StatusPill } from "@/components/status-pill";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { buildAgentProfiles } from "@/lib/agents/build";
import { buildClaimLedgerDraft } from "@/lib/claims/build";
import { buildEmptyFeedbackLedgerDraft } from "@/lib/feedback/build";
import {
  extractPeopleCandidates,
  mergePeopleCandidates,
} from "@/lib/people/extract";
import { buildRelationEdges } from "@/lib/relations/build";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { queueSimulationRunDraft, buildSimulationRunDraft } from "@/lib/runs/build";
import type { SafetyDecision } from "@/lib/safety/safety-types";
import { verifySafety } from "@/lib/safety/safety-verifier";
import type { SafetySnapshot } from "@/lib/simulation/simulation-types";
import { createTrialWorkspace } from "@/lib/trial/sample-workspace";
import type { AgentEcologyDraft } from "@/types/agent-profile";
import type { ClaimLedgerDraft } from "@/types/claim";
import type { KeyPeopleDraft } from "@/types/key-person";
import type { RelationGraphDraft } from "@/types/relation-edge";
import type { SeedContextDraft, TimeWindow } from "@/types/seed-context";
import type { SimulationRunDraft } from "@/types/simulation-run";

type SimpleStage = "tell" | "review" | "result";

type PipelineArtifacts = {
  seedContext: SeedContextDraft;
  keyPeople: KeyPeopleDraft;
  agentEcology: AgentEcologyDraft;
  relationGraph: RelationGraphDraft;
  simulationRun: SimulationRunDraft | null;
  claims: ClaimLedgerDraft | null;
};

const sampleForm = {
  destinyBirthInfo:
    "Born 1992-08-16 around 07:40, Shanghai. Use this only as a symbolic base pattern, not as deterministic fate.",
  currentQuestionDescription:
    "I am deciding between a higher-paying new role and staying with my current team for a promised promotion. My current manager controls promotion timing, the recruiter controls the offer deadline, a trusted colleague has budget context, and my partner is affected by schedule and income changes. My manager said promotion support is likely but did not give a date. The recruiter asked for an answer next week. I want to compare accepting the new role, staying to negotiate a written promotion timeline, or asking both sides for one more week while keeping communication professional.",
};

const simpleSteps = [
  "Tell the situation",
  "Review what Astraloom understood",
  "See the sandbox result",
];

function snapshotFromDecision(decision: SafetyDecision): SafetySnapshot {
  return {
    safetyLevel: decision.safetyLevel,
    flags: decision.flags,
    allowedActions: decision.allowedActions,
    blockedActions: decision.blockedActions,
    reportRestrictions: decision.reportRestrictions,
  };
}

function existingArtifacts(): PipelineArtifacts | null {
  const repos = getRepositories();
  const seedResult = repos.seedContexts.load();
  const seedContext = seedResult.ok ? seedResult.data : null;
  if (!seedContext) return null;

  const keyPeopleResult = repos.keyPeople.load(seedContext.id);
  const agentResult = repos.agentProfiles.load(seedContext.id);
  const graphResult = repos.relationGraphs.load(seedContext.id);
  const runResult = repos.simulations.load(seedContext.id);
  const claimResult = repos.reports.load(seedContext.id);

  const keyPeople = keyPeopleResult.ok ? keyPeopleResult.data : null;
  const agentEcology = agentResult.ok ? agentResult.data : null;
  const relationGraph = graphResult.ok ? graphResult.data : null;

  if (!keyPeople || !agentEcology || !relationGraph) return null;

  return {
    seedContext,
    keyPeople,
    agentEcology,
    relationGraph,
    simulationRun: runResult.ok ? runResult.data : null,
    claims: claimResult.ok ? claimResult.data : null,
  };
}

function initialStage(artifacts: PipelineArtifacts | null): SimpleStage {
  if (artifacts?.simulationRun?.events.length && artifacts.claims?.claims.length) {
    return "result";
  }
  if (artifacts) return "review";
  return "tell";
}

function firstSentence(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  const [sentence] = normalized.split(/(?<=[.!?])\s+/);
  return sentence || normalized;
}

function deriveQuestionText(description: string) {
  const questionMatch = description.match(/[^.!?\n]*\?+/);
  if (questionMatch?.[0]?.trim()) return questionMatch[0].trim();

  const lead = firstSentence(description);
  return lead.length > 140 ? `${lead.slice(0, 137).trim()}...` : lead;
}

function deriveSituationSummary(destinyInfo: string, description: string) {
  return [
    destinyInfo.trim()
      ? `Basic destiny/birth info: ${destinyInfo.trim()}`
      : "Basic destiny/birth info: not provided; continue with situation evidence only.",
    `Current question description: ${description.trim()}`,
  ].join("\n\n");
}

export default function SimpleModePage() {
  const [repos] = useState(() => getRepositories());
  const [initialArtifacts] = useState(() => existingArtifacts());
  const [stage, setStage] = useState<SimpleStage>(() =>
    initialStage(initialArtifacts),
  );
  const [artifacts, setArtifacts] = useState<PipelineArtifacts | null>(
    initialArtifacts,
  );
  const [destinyBirthInfo, setDestinyBirthInfo] = useState(
    initialArtifacts?.seedContext.destinyBirthInfo ?? "",
  );
  const [currentQuestionDescription, setCurrentQuestionDescription] = useState(
    initialArtifacts?.seedContext.currentQuestionDescription ??
      initialArtifacts?.seedContext.situationSummary ??
      "",
  );
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(
    initialArtifacts?.seedContext.timeWindow ?? "90_days",
  );
  const [privacyAck, setPrivacyAck] = useState(
    initialArtifacts?.seedContext.privacySafetyAck ??
      initialArtifacts?.seedContext.privacyAck ??
      false,
  );
  const [message, setMessage] = useState("");
  const [safetyDecision, setSafetyDecision] = useState<SafetyDecision | null>(
    null,
  );

  const activeStepIndex = stage === "tell" ? 0 : stage === "review" ? 1 : 2;
  const confirmedPeople = useMemo(
    () =>
      artifacts?.keyPeople.people.filter(
        (person) => person.confirmed && person.status === "confirmed",
      ) ?? [],
    [artifacts],
  );
  const npcCount =
    artifacts?.agentEcology.agents.filter((agent) => agent.agentType === "npc")
      .length ?? 0;
  const eventCount = artifacts?.simulationRun?.events.length ?? 0;
  const claimCount = artifacts?.claims?.claims.length ?? 0;

  function fillSample() {
    setDestinyBirthInfo(sampleForm.destinyBirthInfo);
    setCurrentQuestionDescription(sampleForm.currentQuestionDescription);
    setTimeWindow("90_days");
    setPrivacyAck(true);
    setMessage("Sample loaded. Review it, then prepare the sandbox.");
  }

  function openSampleResult() {
    createTrialWorkspace();
    const nextArtifacts = existingArtifacts();
    setArtifacts(nextArtifacts);
    setStage(initialStage(nextArtifacts));
    setMessage("Sample sandbox is ready.");
  }

  function prepareUnderstanding() {
    if (destinyBirthInfo.trim().length < 8) {
      setMessage("Add basic birth or destiny context before Astraloom builds the base pattern.");
      return;
    }
    if (currentQuestionDescription.trim().length < 60) {
      setMessage("Add one current question description with the people, pressure, or choice involved.");
      return;
    }
    if (!privacyAck) {
      setMessage("Acknowledge the privacy and safety boundary before continuing.");
      return;
    }

    const now = new Date().toISOString();
    const questionText = deriveQuestionText(currentQuestionDescription);
    const situationSummary = deriveSituationSummary(
      destinyBirthInfo,
      currentQuestionDescription,
    );
    const seedContext: SeedContextDraft = {
      id: artifacts?.seedContext.id ?? repos.seedContexts.createId(),
      questionText,
      trackType:
        timeWindow === "30_days" || timeWindow === "90_days"
          ? "crossroad"
          : "life_climate",
      timeWindow,
      destinyBirthInfo: destinyBirthInfo.trim(),
      currentQuestionDescription: currentQuestionDescription.trim(),
      situationSummary,
      recentEvents: currentQuestionDescription.trim(),
      recentEventsText: currentQuestionDescription.trim(),
      keyPeopleText: "",
      decisionOptions: currentQuestionDescription.trim(),
      decisionOptionsText: currentQuestionDescription.trim(),
      worries: "",
      forbiddenActions:
        "Do not treat the birth pattern as deterministic fate. Do not infer private thoughts with certainty. Do not provide medical, legal, investment, or therapy advice.",
      forbiddenActionsText:
        "Do not treat the birth pattern as deterministic fate. Do not infer private thoughts with certainty. Do not provide medical, legal, investment, or therapy advice.",
      safetyBoundaries:
        "Use the birth information as symbolic context only; keep findings evidence-backed and non-deterministic.",
      desiredOutput:
        "Show the destiny base pattern, real situation structure, key people mapping, interaction process, findings, and evidence.",
      desiredOutputText:
        "Show the destiny base pattern, real situation structure, key people mapping, interaction process, findings, and evidence.",
      privacyAck,
      privacySafetyAck: privacyAck,
      locale: "en",
      status: "submitted",
      createdAt: artifacts?.seedContext.createdAt ?? now,
      updatedAt: now,
    };
    const decision = verifySafety({ seedContext });
    setSafetyDecision(decision);

    if (decision.safetyLevel === "blocked") {
      setMessage(decision.userMessage);
      return;
    }

    const seedResult = repos.seedContexts.save(seedContext);
    if (!seedResult.ok) {
      setMessage(`Save failed: ${seedResult.errorCode}`);
      return;
    }

    const extractedPeople = mergePeopleCandidates(
      [],
      extractPeopleCandidates(seedContext),
    ).map((person) => ({
      ...person,
      confirmed: true,
      status: "confirmed" as const,
      updatedAt: now,
    }));
    const keyPeople: KeyPeopleDraft = {
      seedContextId: seedContext.id,
      people: extractedPeople,
      updatedAt: now,
    };
    const peopleResult = repos.keyPeople.save(keyPeople);
    if (!peopleResult.ok) {
      setMessage(`Save failed: ${peopleResult.errorCode}`);
      return;
    }

    const agentEcology: AgentEcologyDraft = {
      seedContextId: seedContext.id,
      includeParallelSelves: true,
      agents: buildAgentProfiles(seedContext, extractedPeople, true),
      updatedAt: now,
    };
    const agentResult = repos.agentProfiles.save(agentEcology);
    if (!agentResult.ok) {
      setMessage(`Save failed: ${agentResult.errorCode}`);
      return;
    }

    const relationGraph: RelationGraphDraft = {
      seedContextId: seedContext.id,
      version: "local-deterministic-v0",
      agents: agentEcology.agents,
      edges: buildRelationEdges(seedContext.id, agentEcology.agents),
      graphLocked: true,
      lockedAt: now,
      updatedAt: now,
    };
    const graphResult = repos.relationGraphs.save(relationGraph);
    if (!graphResult.ok) {
      setMessage(`Save failed: ${graphResult.errorCode}`);
      return;
    }

    setArtifacts({
      seedContext,
      keyPeople,
      agentEcology,
      relationGraph,
      simulationRun: null,
      claims: null,
    });
    setStage("review");
    setMessage(
      decision.safetyLevel === "downgraded"
        ? decision.userMessage
        : "Astraloom prepared the internal sandbox pieces for review.",
    );
  }

  function runSandbox() {
    if (!artifacts) {
      setMessage("Prepare the sandbox before running it.");
      return;
    }

    const decision = verifySafety({
      seedContext: artifacts.seedContext,
      agents: artifacts.agentEcology.agents,
      relationEdges: artifacts.relationGraph.edges,
    });
    setSafetyDecision(decision);
    if (decision.safetyLevel === "blocked") {
      setMessage(decision.userMessage);
      return;
    }

    const simulationRun = queueSimulationRunDraft(
      buildSimulationRunDraft(
        artifacts.seedContext,
        artifacts.agentEcology,
        artifacts.relationGraph.edges,
        "queued",
        snapshotFromDecision(decision),
      ),
    );
    const runResult = repos.simulations.save(simulationRun);
    if (!runResult.ok) {
      setMessage(`Save failed: ${runResult.errorCode}`);
      return;
    }

    const claims = buildClaimLedgerDraft(artifacts.seedContext.id, simulationRun);
    const claimResult = repos.reports.save(claims);
    if (!claimResult.ok) {
      setMessage(`Save failed: ${claimResult.errorCode}`);
      return;
    }

    const existingFeedback = repos.feedback.load(artifacts.seedContext.id);
    if (!existingFeedback.ok || !existingFeedback.data) {
      const feedbackResult = repos.feedback.save(
        buildEmptyFeedbackLedgerDraft(artifacts.seedContext.id, simulationRun.id),
      );
      if (!feedbackResult.ok) {
        setMessage(`Save failed: ${feedbackResult.errorCode}`);
        return;
      }
    }

    setArtifacts({ ...artifacts, simulationRun, claims });
    setStage("result");
    setMessage("Sandbox result is ready.");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SurfaceCard emphasis="strong" className="p-7">
          <StatusPill tone="ready">Simple Mode</StatusPill>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-[#11150f]">
            Enter basic destiny context and one current question.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
            Astraloom builds the base pattern, organizes the real situation,
            identifies key people, maps themes to people, runs interaction
            events, and keeps findings tied to evidence.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {simpleSteps.map((step, index) => (
              <div
                key={step}
                className={`rounded-md border p-3 ${
                  index === activeStepIndex
                    ? "border-[#568262]/40 bg-[#eef5ee]"
                    : index < activeStepIndex
                      ? "border-black/8 bg-white"
                      : "border-black/8 bg-[#f7f8f4]"
                }`}
              >
                <div className="text-xs font-semibold uppercase text-[#568262]">
                  Step {index + 1}
                </div>
                <div className="mt-1 text-sm font-semibold text-[#11150f]">
                  {step}
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        {message ? (
          <p className="rounded-md border border-[#568262]/20 bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3d]">
            {message}
          </p>
        ) : null}

        {safetyDecision?.safetyLevel === "downgraded" ? (
          <SafetyDowngradeNotice decision={safetyDecision} />
        ) : null}

        {stage === "tell" ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <SurfaceCard className="p-6">
              <h2 className="text-xl font-semibold text-[#11150f]">
                Enter the base and the current question
              </h2>
              <div className="mt-5 space-y-4">
                <Field label="Basic destiny / birth info">
                  <textarea
                    value={destinyBirthInfo}
                    onChange={(event) => setDestinyBirthInfo(event.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-md border border-black/10 bg-[#f7f8f4] px-3 py-2 text-sm leading-6 text-[#11150f]"
                    placeholder="Birth date, time, place, and any basic destiny context you want considered. Unknown parts are okay."
                  />
                </Field>
                <Field label="Current question description">
                  <textarea
                    value={currentQuestionDescription}
                    onChange={(event) =>
                      setCurrentQuestionDescription(event.target.value)
                    }
                    rows={8}
                    className="w-full resize-none rounded-md border border-black/10 bg-[#f7f8f4] px-3 py-2 text-sm leading-6 text-[#11150f]"
                    placeholder="Describe the current problem in your own words. Include people, recent signals, options, worries, and boundaries only if they naturally matter."
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                  <Field label="Time window">
                    <select
                      value={timeWindow}
                      onChange={(event) =>
                        setTimeWindow(event.target.value as TimeWindow)
                      }
                      className="w-full rounded-md border border-black/10 bg-[#f7f8f4] px-3 py-2 text-sm text-[#11150f]"
                    >
                      <option value="30_days">30 days</option>
                      <option value="90_days">90 days</option>
                      <option value="1_year">1 year</option>
                      <option value="3_years">3 years</option>
                      <option value="5_years">5 years</option>
                    </select>
                  </Field>
                  <label className="mt-6 flex items-start gap-3 rounded-md border border-black/8 bg-[#f7f8f4] p-3 text-sm leading-6 text-[#62695d]">
                    <input
                      type="checkbox"
                      checked={privacyAck}
                      onChange={(event) => setPrivacyAck(event.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#568262]"
                    />
                    <span>
                      I understand this is a local sandbox, not deterministic
                      fate, mind reading, or professional advice.
                    </span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={prepareUnderstanding}>
                    Review what Astraloom understood
                  </Button>
                  <Button type="button" variant="secondary" onClick={fillSample}>
                    Fill sample
                  </Button>
                  <Button type="button" variant="secondary" onClick={openSampleResult}>
                    Open sample result
                  </Button>
                </div>
              </div>
            </SurfaceCard>

            <AdvancedLinks />
          </section>
        ) : null}

        {stage === "review" && artifacts ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <SurfaceCard className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#11150f]">
                    Review what Astraloom understood
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#62695d]">
                    These are the people, model roles, and relationship signals
                    prepared from your situation. You can continue or inspect
                    the advanced pages first.
                  </p>
                </div>
                <StatusPill tone="ready">Ready to run</StatusPill>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <Metric label="People understood" value={confirmedPeople.length} />
                <Metric label="Agent models" value={artifacts.agentEcology.agents.length} />
                <Metric label="Relation signals" value={artifacts.relationGraph.edges.length} />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <SummaryList
                  title="People and roles"
                  items={confirmedPeople.map(
                    (person) => `${person.label}: ${person.role}`,
                  )}
                />
                <SummaryList
                  title="Relationship signals"
                  items={artifacts.relationGraph.edges.slice(0, 5).map((edge) =>
                    edge.relationshipType.replaceAll("_", " "),
                  )}
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="button" onClick={runSandbox}>
                  See sandbox result
                </Button>
                <Button type="button" variant="secondary" onClick={() => setStage("tell")}>
                  Edit situation
                </Button>
                <ButtonLink href="/app/new/people" variant="secondary">
                  Advanced review
                </ButtonLink>
              </div>
            </SurfaceCard>

            <AdvancedLinks />
          </section>
        ) : null}

        {stage === "result" && artifacts ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <SurfaceCard className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#11150f]">
                    Sandbox result is ready
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#62695d]">
                    The result was built from the hidden internal loop: people,
                    agent models, locked relation graph, Event Logs, claims,
                    and a feedback ledger.
                  </p>
                </div>
                <StatusPill tone="ready">Complete</StatusPill>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <Metric label="Events" value={eventCount} />
                <Metric label="Claims" value={claimCount} />
                <Metric label="People" value={confirmedPeople.length} />
                <Metric label="NPC agents" value={npcCount} />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/app/simulation/result">
                  Open result sandbox
                </ButtonLink>
                <ButtonLink href="/app/simulation/running" variant="secondary">
                  Inspect events
                </ButtonLink>
                <Button type="button" variant="secondary" onClick={() => setStage("tell")}>
                  Start another pass
                </Button>
              </div>
            </SurfaceCard>

            <AdvancedLinks />
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-black/8 bg-[#f7f8f4] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[#11150f]">{value}</div>
    </div>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-md border border-black/8 bg-[#f7f8f4] p-4">
      <h3 className="text-sm font-semibold text-[#11150f]">{title}</h3>
      {items.length ? (
        <div className="mt-3 space-y-2">
          {items.map((item, index) => (
            <p key={`${item}-${index}`} className="text-sm leading-6 text-[#62695d]">
              {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[#62695d]">
          Nothing was detected yet.
        </p>
      )}
    </section>
  );
}

function AdvancedLinks() {
  return (
    <aside className="h-fit space-y-4">
      <section className="mf-panel-dark p-6">
        <h2 className="text-sm font-semibold text-[#b7e6c6]">
          Advanced inspection
        </h2>
        <div className="mt-4 grid gap-2">
          <ButtonLink href="/app/new/intake" variant="ghostOnDark">
            Seed context
          </ButtonLink>
          <ButtonLink href="/app/new/people" variant="ghostOnDark">
            People
          </ButtonLink>
          <ButtonLink href="/app/new/agents" variant="ghostOnDark">
            Agent models
          </ButtonLink>
          <ButtonLink href="/app/new/graph" variant="ghostOnDark">
            Relation graph
          </ButtonLink>
          <ButtonLink href="/app/simulation/running" variant="ghostOnDark">
            Event Logs
          </ButtonLink>
        </div>
      </section>
      <section className="mf-card p-5">
        <h2 className="text-sm font-semibold text-[#11150f]">
          What stays internal
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#62695d]">
          Simple Mode hides the intermediate names by default, but it still
          saves each artifact locally so the full inspection pages keep working.
        </p>
      </section>
    </aside>
  );
}
