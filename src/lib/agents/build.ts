import type {
  AgentFieldSourceType,
  AgentProfileDraft,
  AgentProfileJson,
  AgentStance,
  AgentType,
} from "@/types/agent-profile";
import type { KeyPersonDraft } from "@/types/key-person";
import { getSeedContextNarrative } from "@/lib/seed-context/context-text";
import type { SeedContextDraft } from "@/types/seed-context";

type ProfileFieldSources = AgentProfileJson["fieldSources"];

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function scoreFromText(value: string, salt: string, min = 28, max = 82) {
  const seed = Number.parseInt(hashText(`${value}:${salt}`).slice(0, 6), 36);
  return min + (seed % (max - min + 1));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasText(value: string | undefined) {
  return Boolean(value?.trim());
}

function compactText(value: string | undefined, fallback: string, maxLength = 180) {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function evidenceRefsForSeed(seedContext: SeedContextDraft, stance: AgentStance) {
  const refs = [`seed:${seedContext.id}:self:${stance}`];

  if (hasText(seedContext.situationSummary)) {
    refs.push(`seed:${seedContext.id}:situation`);
  }

  if (hasText(seedContext.questionText)) {
    refs.push(`seed:${seedContext.id}:question`);
  }

  if (hasText(seedContext.recentEvents) || hasText(seedContext.recentEventsText)) {
    refs.push(`seed:${seedContext.id}:recent-events`);
  }

  if (hasText(seedContext.decisionOptions) || hasText(seedContext.decisionOptionsText)) {
    refs.push(`seed:${seedContext.id}:decision-options`);
  }

  if (hasText(seedContext.forbiddenActions) || hasText(seedContext.forbiddenActionsText)) {
    refs.push(`seed:${seedContext.id}:boundaries`);
  }

  return refs;
}

function missingSeedFields(seedContext: SeedContextDraft) {
  const missing = new Set<string>();

  if (!hasText(seedContext.situationSummary)) missing.add("situation_summary");
  if (!hasText(seedContext.questionText)) missing.add("main_question");
  if (!hasText(seedContext.recentEvents) && !hasText(seedContext.recentEventsText)) {
    missing.add("recent_events");
  }
  if (!hasText(seedContext.decisionOptions) && !hasText(seedContext.decisionOptionsText)) {
    missing.add("decision_options");
  }
  if (!hasText(seedContext.worries)) missing.add("risk_concerns");
  if (!hasText(seedContext.desiredOutput) && !hasText(seedContext.desiredOutputText)) {
    missing.add("desired_output");
  }

  seedContext.missingContextHints?.forEach((hint) => missing.add(hint));
  return Array.from(missing);
}

function sourceFromText(...values: Array<string | undefined>): AgentFieldSourceType {
  return values.some(hasText) ? "chat_inferred" : "default";
}

function selfFieldSources(seedContext: SeedContextDraft): ProfileFieldSources {
  return {
    stance: "default",
    role: hasText(seedContext.questionText) ? "user_confirmed" : "default",
    origin: "default",
    relationshipToUser: "default",
    motivation: sourceFromText(
      seedContext.questionText,
      seedContext.decisionOptions,
      seedContext.decisionOptionsText,
      seedContext.desiredOutput,
      seedContext.desiredOutputText,
    ),
    resources: sourceFromText(
      seedContext.recentEvents,
      seedContext.recentEventsText,
      seedContext.keyPeopleText,
    ),
    behaviorPolicy: sourceFromText(
      seedContext.decisionOptions,
      seedContext.decisionOptionsText,
      seedContext.forbiddenActions,
      seedContext.forbiddenActionsText,
    ),
    state: sourceFromText(seedContext.questionText, seedContext.worries),
    traits: sourceFromText(seedContext.situationSummary, seedContext.questionText),
    constraints: sourceFromText(
      seedContext.forbiddenActions,
      seedContext.forbiddenActionsText,
      seedContext.safetyBoundaries,
    ),
    missingFields: "default",
  };
}

function createAgentProfile(
  seedContextId: string,
  sourceKeyPersonId: string | null,
  agentType: AgentType,
  label: string,
  role: string,
  relationshipToUser: string,
  confidence: number,
  evidenceRefs: string[],
  profileJson: AgentProfileJson,
  now: string,
): AgentProfileDraft {
  return {
    id: `agent_${hashText(
      `${seedContextId}:${sourceKeyPersonId ?? agentType}:${label}`,
    )}`,
    seedContextId,
    sourceKeyPersonId,
    agentType,
    label,
    role,
    relationshipToUser,
    confidence,
    evidenceRefs,
    version: "local-deterministic-v0",
    traceId: `local-agent:${seedContextId}:${hashText(label)}`,
    profileJson,
    promptVersion: "unreleased",
    modelVersion: "unreleased",
    createdAt: now,
    updatedAt: now,
  };
}

function selfRole(seedContext: SeedContextDraft) {
  if (seedContext.trackType === "life_climate") return "Theme owner";
  return "Decision owner";
}

function selfMotivation(seedContext: SeedContextDraft, stance: AgentStance) {
  const question = compactText(seedContext.questionText, "the current scenario question", 150);
  const options = compactText(
    seedContext.decisionOptions ?? seedContext.decisionOptionsText,
    "the available branches",
    140,
  );
  const desiredOutput = compactText(
    seedContext.desiredOutput ?? seedContext.desiredOutputText,
    "evidence, branch comparison, and low-risk next-step signals",
    150,
  );
  const worries = compactText(
    seedContext.worries,
    "moving too quickly while important evidence is still incomplete",
    150,
  );
  const boundaries = compactText(
    seedContext.forbiddenActions ??
      seedContext.forbiddenActionsText ??
      seedContext.safetyBoundaries,
    "keep the run inside stated action and safety boundaries",
    150,
  );

  if (stance === "cautious_parallel") {
    return {
      primaryGoal: `Hold the scenario around "${question}" while increasing information quality before choosing among ${options}.`,
      fear: `Acting before the evidence is stable enough: ${worries}.`,
      avoidancePattern: `Delays commitment, asks for clearer signals, and protects boundaries: ${boundaries}.`,
    };
  }

  if (stance === "decisive_parallel") {
    return {
      primaryGoal: `Move "${question}" toward a concrete test or decision while preserving enough trace evidence to compare ${options}.`,
      fear: `Losing the opportunity window by waiting too long, while still respecting: ${boundaries}.`,
      avoidancePattern:
        "Avoids indefinite analysis loops; accepts more short-term friction when the next observable step is clear.",
    };
  }

  return {
    primaryGoal: `Compare ${options} for "${question}" and produce ${desiredOutput}.`,
    fear: `Misreading the scenario because key events, people, or boundaries are incomplete: ${worries}.`,
    avoidancePattern: `Keeps the decision reversible until enough evidence is visible, while preserving boundaries: ${boundaries}.`,
  };
}

function selfResources(seedContext: SeedContextDraft, stance: AgentStance) {
  const narrative = getSeedContextNarrative(seedContext);
  const decisionText = `${seedContext.questionText}\n${seedContext.decisionOptions ?? ""}\n${seedContext.decisionOptionsText ?? ""}`;
  const peopleText = seedContext.keyPeopleText;
  const eventText = `${seedContext.recentEvents ?? ""}\n${seedContext.recentEventsText ?? ""}`;
  const concernText = `${seedContext.worries ?? ""}\n${seedContext.forbiddenActions ?? ""}\n${seedContext.safetyBoundaries ?? ""}`;
  const stanceShift =
    stance === "cautious_parallel"
      ? { authority: -4, information: 10, socialCapital: 6, emotionalLeverage: 2 }
      : stance === "decisive_parallel"
        ? { authority: 8, information: -4, socialCapital: -3, emotionalLeverage: -1 }
        : { authority: 0, information: 0, socialCapital: 0, emotionalLeverage: 0 };

  return {
    authority: clampScore(
      scoreFromText(decisionText, `${stance}:authority`, 42, 68) +
        stanceShift.authority,
    ),
    information: clampScore(
      scoreFromText(`${narrative}\n${eventText}`, `${stance}:info`, 44, 78) +
        stanceShift.information,
    ),
    socialCapital: clampScore(
      scoreFromText(peopleText || narrative, `${stance}:social`, 38, 72) +
        stanceShift.socialCapital,
    ),
    emotionalLeverage: clampScore(
      scoreFromText(concernText || narrative, `${stance}:emotion`, 36, 74) +
        stanceShift.emotionalLeverage,
    ),
  };
}

function selfBehaviorPolicy(seedContext: SeedContextDraft, stance: AgentStance) {
  const baseInitiative = seedContext.trackType === "crossroad" ? 58 : 46;
  const hasOptions =
    hasText(seedContext.decisionOptions) || hasText(seedContext.decisionOptionsText);
  const hasBoundaries =
    hasText(seedContext.forbiddenActions) ||
    hasText(seedContext.forbiddenActionsText) ||
    hasText(seedContext.safetyBoundaries);

  if (stance === "cautious_parallel") {
    return {
      actionSpeed: hasOptions ? 32 : 26,
      initiative: baseInitiative - 16,
      cooperationBias: hasBoundaries ? 78 : 70,
      communicationStyle: "formal" as const,
    };
  }

  if (stance === "decisive_parallel") {
    return {
      actionSpeed: hasOptions ? 82 : 72,
      initiative: baseInitiative + 22,
      cooperationBias: hasBoundaries ? 54 : 48,
      communicationStyle: "sharp" as const,
    };
  }

  return {
    actionSpeed: hasOptions ? 56 : 46,
    initiative: baseInitiative,
    cooperationBias: hasBoundaries ? 66 : 60,
    communicationStyle: "formal" as const,
  };
}

function selfState(seedContext: SeedContextDraft, stance: AgentStance) {
  const pressureText = `${seedContext.questionText}\n${seedContext.worries ?? ""}\n${seedContext.recentEvents ?? ""}\n${seedContext.recentEventsText ?? ""}`;
  const stressBase = scoreFromText(pressureText, `${stance}:stress`, 42, 76);

  if (stance === "cautious_parallel") {
    return {
      stress: clampScore(stressBase + 4),
      trustInUser: 100,
      hostilityToUser: 0,
      currentIntention:
        "Collect clearer signals, protect stated boundaries, and avoid turning uncertainty into a hard conclusion.",
    };
  }

  if (stance === "decisive_parallel") {
    return {
      stress: clampScore(stressBase - 3),
      trustInUser: 100,
      hostilityToUser: 0,
      currentIntention:
        "Convert the scenario into a visible next step quickly, then let Event Logs show the tradeoffs.",
    };
  }

  return {
    stress: stressBase,
    trustInUser: 100,
    hostilityToUser: 0,
    currentIntention:
      "Keep the baseline scenario faithful to the saved Seed Context before graph freeze and simulation.",
  };
}

function selfTraits(seedContext: SeedContextDraft, stance: AgentStance) {
  const trackTrait =
    seedContext.trackType === "crossroad"
      ? "short-window decision focus"
      : "long-horizon climate focus";
  const optionTrait =
    hasText(seedContext.decisionOptions) || hasText(seedContext.decisionOptionsText)
      ? "branch-aware"
      : "needs clearer branch options";
  const eventTrait =
    hasText(seedContext.recentEvents) || hasText(seedContext.recentEventsText)
      ? "event-anchored"
      : "low event evidence";

  if (stance === "cautious_parallel") {
    return [
      "cautious comparison branch",
      "information-first pacing",
      "boundary-preserving communication",
      trackTrait,
      eventTrait,
    ];
  }

  if (stance === "decisive_parallel") {
    return [
      "decisive comparison branch",
      "action-first pacing",
      "higher tolerance for visible friction",
      trackTrait,
      optionTrait,
    ];
  }

  return ["current self baseline", trackTrait, optionTrait, eventTrait];
}

function selfConstraints(seedContext: SeedContextDraft, stance: AgentStance) {
  const boundaries = compactText(
    seedContext.forbiddenActions ??
      seedContext.forbiddenActionsText ??
      seedContext.safetyBoundaries,
    "No extra user boundary was provided.",
    180,
  );
  const variantConstraint =
    stance === "baseline"
      ? "Baseline should stay closest to the saved user context."
      : "Parallel self differences may alter pacing and communication only, not the user's facts.";

  return [
    "This is a simulation model, not a report claim or instruction.",
    "Do not infer another person's private thoughts, loyalty, deception, or hidden intent as fact.",
    variantConstraint,
    `User-stated boundary: ${boundaries}`,
  ];
}

function selfProfile(
  seedContext: SeedContextDraft,
  stance: AgentStance,
): AgentProfileJson {
  const confidence =
    stance === "baseline"
      ? hasText(seedContext.situationSummary) && hasText(seedContext.questionText)
        ? 88
        : 78
      : 74;
  const evidenceRefs = evidenceRefsForSeed(seedContext, stance);

  return {
    stance,
    role: selfRole(seedContext),
    origin: "seed_context",
    relationshipToUser: "self",
    source: {
      confidence,
      sourceType:
        hasText(seedContext.situationSummary) || hasText(seedContext.questionText)
          ? "user_confirmed"
          : "default",
      evidenceRefs,
    },
    fieldSources: selfFieldSources(seedContext),
    motivation: selfMotivation(seedContext, stance),
    resources: selfResources(seedContext, stance),
    behaviorPolicy: selfBehaviorPolicy(seedContext, stance),
    state: selfState(seedContext, stance),
    traits: selfTraits(seedContext, stance),
    constraints: selfConstraints(seedContext, stance),
    missingFields: missingSeedFields(seedContext),
  };
}

function personEvidenceText(person: KeyPersonDraft) {
  return compactText(
    [person.knownEvidence, person.evidenceText, person.userNote]
      .filter(Boolean)
      .join(" "),
    "Confirmed by the user, but no detailed evidence text was captured.",
    220,
  );
}

function personSignals(person: KeyPersonDraft, seedContext: SeedContextDraft) {
  const text = [
    person.label,
    person.role,
    person.roleType,
    person.relationshipToUser,
    person.knownEvidence,
    person.evidenceText,
    person.userNote,
    seedContext.questionText,
  ]
    .join(" ")
    .toLowerCase();

  return {
    authority: matchesAny(text, [
      "boss",
      "manager",
      "lead",
      "authority",
      "promotion",
      "budget",
      "老板",
      "经理",
      "上级",
      "领导",
      "晋升",
    ]),
    opportunity: matchesAny(text, [
      "recruiter",
      "offer",
      "opportunity",
      "client",
      "new role",
      "猎头",
      "机会",
      "录用",
      "客户",
    ]),
    support: matchesAny(text, [
      "trusted",
      "support",
      "partner",
      "family",
      "colleague",
      "advisor",
      "信任",
      "支持",
      "伴侣",
      "家人",
      "同事",
    ]),
    conflict: matchesAny(text, [
      "competitor",
      "conflict",
      "rival",
      "risk",
      "pressure",
      "friction",
      "竞争",
      "冲突",
      "压力",
      "风险",
    ]),
  };
}

function npcResources(person: KeyPersonDraft, seedContext: SeedContextDraft) {
  const signals = personSignals(person, seedContext);
  const evidence = `${person.role}\n${person.relationshipToUser}\n${person.knownEvidence}\n${person.evidenceText}\n${person.userNote}`;

  return {
    authority: clampScore(
      scoreFromText(evidence, `${person.id}:authority`, 24, 66) +
        (signals.authority ? 20 : 0) +
        (signals.opportunity ? 6 : 0),
    ),
    information: clampScore(
      scoreFromText(evidence, `${person.id}:info`, 34, 76) +
        (hasText(person.knownEvidence) || hasText(person.evidenceText) ? 8 : 0) +
        (signals.opportunity ? 8 : 0),
    ),
    socialCapital: clampScore(
      scoreFromText(evidence, `${person.id}:social`, 30, 70) +
        (signals.support ? 10 : 0) +
        (signals.authority ? 6 : 0),
    ),
    emotionalLeverage: clampScore(
      scoreFromText(evidence, `${person.id}:emotion`, 22, 68) +
        (signals.support ? 12 : 0) +
        (signals.conflict ? 8 : 0),
    ),
  };
}

function npcCommunicationStyle(person: KeyPersonDraft, seedContext: SeedContextDraft) {
  const signals = personSignals(person, seedContext);
  if (signals.support) return "warm" as const;
  if (signals.conflict) return "sharp" as const;
  if (signals.authority || signals.opportunity) return "formal" as const;
  return "unknown" as const;
}

function npcBehaviorPolicy(person: KeyPersonDraft, seedContext: SeedContextDraft) {
  const signals = personSignals(person, seedContext);
  const evidence = `${person.role}\n${person.relationshipToUser}\n${person.knownEvidence}\n${person.evidenceText}\n${person.userNote}`;

  return {
    actionSpeed: clampScore(
      scoreFromText(evidence, `${person.id}:speed`, 28, 70) +
        (signals.opportunity ? 12 : 0) -
        (person.missingFields.length ? 8 : 0),
    ),
    initiative: clampScore(
      scoreFromText(evidence, `${person.id}:initiative`, 28, 72) +
        (signals.authority || signals.opportunity ? 10 : 0),
    ),
    cooperationBias: clampScore(
      scoreFromText(evidence, `${person.id}:coop`, 32, 74) +
        (signals.support ? 12 : 0) -
        (signals.conflict ? 10 : 0),
    ),
    communicationStyle: npcCommunicationStyle(person, seedContext),
  };
}

function npcMotivation(person: KeyPersonDraft, seedContext: SeedContextDraft) {
  const evidence = personEvidenceText(person);
  const role = compactText(person.role || person.roleType, "a confirmed scenario actor", 100);
  const question = compactText(seedContext.questionText, "the saved scenario question", 140);

  return {
    primaryGoal: `Represent the observable pressure or support carried by ${role} in relation to "${question}".`,
    fear:
      "The model could overread limited evidence, so uncertain fields stay marked and conservative.",
    avoidancePattern: person.missingFields.length
      ? `Use neutral behavior where fields are missing; current evidence anchor: ${evidence}.`
      : `Stay anchored to confirmed role, evidence, and user note rather than inferred private motives: ${evidence}.`,
  };
}

function npcState(person: KeyPersonDraft, seedContext: SeedContextDraft) {
  const signals = personSignals(person, seedContext);
  const evidence = `${person.role}\n${person.relationshipToUser}\n${person.knownEvidence}\n${person.evidenceText}\n${person.userNote}`;

  return {
    stress: clampScore(
      scoreFromText(evidence, `${person.id}:stress`, 28, 78) +
        (signals.conflict || signals.opportunity ? 8 : 0),
    ),
    trustInUser: clampScore(
      scoreFromText(evidence, `${person.id}:trust`, 32, 70) +
        (signals.support ? 12 : 0) -
        (signals.conflict ? 8 : 0),
    ),
    hostilityToUser: clampScore(
      scoreFromText(evidence, `${person.id}:hostility`, 4, 36) +
        (signals.conflict ? 12 : 0) -
        (signals.support ? 4 : 0),
    ),
    currentIntention: person.userNote
      ? `Carry the user's correction into graph generation: ${compactText(person.userNote, "", 150)}`
      : "Carry confirmed role and evidence into graph generation without adding hidden motives.",
  };
}

function npcTraits(person: KeyPersonDraft, seedContext: SeedContextDraft) {
  const signals = personSignals(person, seedContext);
  const traits = [
    "confirmed key person",
    `${person.confidence}% confidence`,
    person.source === "manual" ? "added by user" : "extracted from Seed Context",
  ];

  if (signals.authority) traits.push("authority or timing influence");
  if (signals.opportunity) traits.push("opportunity or access signal");
  if (signals.support) traits.push("support or context signal");
  if (signals.conflict) traits.push("pressure or friction signal");
  if (person.missingFields.length) traits.push("incomplete fields visible");

  return traits;
}

function npcConstraints(person: KeyPersonDraft) {
  return [
    "This NPC is a bounded simulation actor, not a full biography.",
    "Do not infer private inner thoughts, loyalty, deception, love, or hidden intent as fact.",
    "Use only confirmed role, evidence, and user notes until Event Logs are created later.",
    person.missingFields.length
      ? `Missing fields must lower certainty: ${person.missingFields.join(", ")}.`
      : "No direct RelationEdge weights are created or edited at this step.",
  ];
}

function npcMissingFields(person: KeyPersonDraft) {
  const missing = new Set(person.missingFields);

  if (!hasText(person.role) && !hasText(person.roleType)) missing.add("role_type");
  if (!hasText(person.relationshipToUser)) missing.add("relationship_to_user");
  if (!hasText(person.knownEvidence) && !hasText(person.evidenceText)) {
    missing.add("evidence_text");
  }
  if (!hasText(person.userNote)) missing.add("optional_user_note");

  return Array.from(missing);
}

function npcProfile(person: KeyPersonDraft, seedContext: SeedContextDraft): AgentProfileJson {
  const confirmedSource: AgentFieldSourceType =
    person.status === "confirmed" ? "user_confirmed" : "chat_inferred";
  const inferredFromPerson: AgentFieldSourceType =
    hasText(person.knownEvidence) || hasText(person.evidenceText) || hasText(person.userNote)
      ? "chat_inferred"
      : "default";
  const evidenceRefs = person.evidenceRefs.length
    ? person.evidenceRefs
    : [`seed:${person.seedContextId}:person:${hashText(person.label)}`];
  const fieldSources: ProfileFieldSources = {
    stance: "default",
    role: confirmedSource,
    origin: confirmedSource,
    relationshipToUser: confirmedSource,
    motivation: inferredFromPerson,
    resources: inferredFromPerson,
    behaviorPolicy: inferredFromPerson,
    state: inferredFromPerson,
    traits: confirmedSource,
    constraints: "default",
    missingFields: confirmedSource,
  };

  return {
    stance: "confirmed_npc",
    role: person.role || person.roleType || "confirmed scenario actor",
    origin:
      person.source === "manual"
        ? "user_added"
        : person.source === "key_people_text"
          ? "named_in_intake"
          : "detected_from_intake",
    relationshipToUser: person.relationshipToUser || "other",
    source: {
      confidence: person.confidence,
      sourceType: confirmedSource,
      evidenceRefs,
    },
    fieldSources,
    motivation: npcMotivation(person, seedContext),
    resources: npcResources(person, seedContext),
    behaviorPolicy: npcBehaviorPolicy(person, seedContext),
    state: npcState(person, seedContext),
    traits: npcTraits(person, seedContext),
    constraints: npcConstraints(person),
    missingFields: npcMissingFields(person),
  };
}

export function getConfirmedPeople(people: KeyPersonDraft[]) {
  return people.filter(
    (person) => person.confirmed && person.status === "confirmed",
  );
}

export function buildAgentProfiles(
  seedContext: SeedContextDraft,
  confirmedPeople: KeyPersonDraft[],
  includeParallelSelves: boolean,
) {
  const now = new Date().toISOString();
  const baselineProfile = selfProfile(seedContext, "baseline");
  const agents: AgentProfileDraft[] = [
    createAgentProfile(
      seedContext.id,
      null,
      "self",
      "Current self",
      selfRole(seedContext),
      "self",
      baselineProfile.source.confidence,
      baselineProfile.source.evidenceRefs,
      baselineProfile,
      now,
    ),
  ];

  if (includeParallelSelves) {
    const cautiousProfile = selfProfile(seedContext, "cautious_parallel");
    const decisiveProfile = selfProfile(seedContext, "decisive_parallel");

    agents.push(
      createAgentProfile(
        seedContext.id,
        null,
        "parallel_self",
        "Cautious self",
        "Information-first comparison branch",
        "self",
        cautiousProfile.source.confidence,
        cautiousProfile.source.evidenceRefs,
        cautiousProfile,
        now,
      ),
      createAgentProfile(
        seedContext.id,
        null,
        "parallel_self",
        "Decisive self",
        "Action-first comparison branch",
        "self",
        decisiveProfile.source.confidence,
        decisiveProfile.source.evidenceRefs,
        decisiveProfile,
        now,
      ),
    );
  }

  confirmedPeople.forEach((person) => {
    const profile = npcProfile(person, seedContext);

    agents.push(
      createAgentProfile(
        seedContext.id,
        person.id,
        "npc",
        person.displayName ?? person.label,
        profile.role,
        profile.relationshipToUser,
        person.confidence,
        profile.source.evidenceRefs,
        profile,
        now,
      ),
    );
  });

  return agents;
}

function matchesAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}
