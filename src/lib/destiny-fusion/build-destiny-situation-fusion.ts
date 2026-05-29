import type {
  DestinyClimateDraft,
  DestinyClimatePanel,
  DestinyInterpretationItem,
  DestinyThemeLabel,
} from "@/types/destiny";
import type {
  DestinySituationFusionDraft,
  DestinySituationFusionMapping,
} from "@/types/destiny-fusion";
import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";

const sourceTags = [
  "destiny climate",
  "real situation",
  "integrated simulation",
] as const;

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function normalize(value: string) {
  return value.toLowerCase();
}

function personText(person: KeyPersonDraft) {
  return normalize(
    [
      person.label,
      person.displayName,
      person.role,
      person.relationshipToUser,
      person.roleType,
      person.knownEvidence,
      person.evidenceText,
      person.userNote,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function pressureRoleForTheme(
  label: DestinyThemeLabel,
  person: KeyPersonDraft,
) {
  const text = personText(person);

  if (label === "resource pressure") {
    if (/boss|manager|authority|client|budget|resource|hr|lead/.test(text)) {
      return "resource or authority pressure holder";
    }
    return "resource pressure holder";
  }

  if (label === "boundary pressure") {
    if (/family|parent|partner|boss|manager|collaborator|friend/.test(text)) {
      return "boundary negotiation point";
    }
    return "boundary pressure point";
  }

  if (label === "information uncertainty") {
    if (/ambiguous|authority|hr|intermediary|recruiter|manager|contact/.test(text)) {
      return "information gap signal";
    }
    return "unclear information channel";
  }

  if (label === "emotional pull") {
    if (/partner|ex|family|friend|close|parent/.test(text)) {
      return "emotional pull anchor";
    }
    return "emotional context signal";
  }

  if (label === "opportunity shift") {
    if (/recruiter|client|collaborator|new|lead|project/.test(text)) {
      return "opportunity shift carrier";
    }
    return "possible opening signal";
  }

  if (label === "expression friction") {
    return "communication timing point";
  }

  if (label === "relationship tension") {
    return "relationship expectation signal";
  }

  return "situation pressure signal";
}

function themePersonScore(label: DestinyThemeLabel, person: KeyPersonDraft) {
  const text = personText(person);
  const base = Math.round(person.confidence / 10);
  const keywordScores: Record<DestinyThemeLabel, Array<[RegExp, number]>> = {
    "resource pressure": [
      [/boss|manager|authority|client|budget|resource|hr|lead/, 24],
      [/recruiter|company|team|project/, 12],
    ],
    "boundary pressure": [
      [/family|parent|partner|boss|manager|collaborator|friend/, 22],
      [/boundary|limit|time|exhausted|last-minute/, 16],
    ],
    "information uncertainty": [
      [/ambiguous|authority|hr|intermediary|recruiter|manager|contact/, 22],
      [/unclear|vague|quiet|delayed|not confirmed|approval/, 16],
    ],
    "emotional pull": [
      [/partner|ex|family|friend|close|parent|relationship/, 24],
      [/warm|quiet|emotion|connection/, 12],
    ],
    "opportunity shift": [
      [/recruiter|client|new|collaborator|project|offer|opportunity/, 24],
      [/advisor|lead|friend/, 10],
    ],
    "expression friction": [
      [/message|talk|communicate|explain|negotiate|ask|said|told/, 22],
      [/conflict|unclear|delayed|quiet/, 14],
    ],
    "self-rhythm": [
      [/self|me|work time|pace|exhausted|time/, 18],
      [/manager|partner|family/, 8],
    ],
    "relationship tension": [
      [/partner|family|friend|colleague|manager|relationship|parent/, 22],
      [/expectation|quiet|pressure|connection/, 10],
    ],
  };

  return keywordScores[label].reduce(
    (score, [pattern, points]) => score + (pattern.test(text) ? points : 0),
    base,
  );
}

function bestPersonForTheme(
  label: DestinyThemeLabel,
  people: KeyPersonDraft[],
  index: number,
) {
  return [...people].sort((left, right) => {
    const scoreDelta = themePersonScore(label, right) - themePersonScore(label, left);
    if (scoreDelta !== 0) return scoreDelta;
    return people.indexOf(left) - people.indexOf(right);
  })[0] ?? people[index % people.length];
}

function realClueRefs(seedContext: SeedContextDraft, person: KeyPersonDraft) {
  return [
    `seed:${seedContext.id}:question`,
    ...person.evidenceRefs,
    seedContext.currentQuestionDescription
      ? `seed:${seedContext.id}:current_question_description`
      : `seed:${seedContext.id}:situation_summary`,
  ];
}

function interpretationForPanel(
  panel: DestinyClimatePanel,
  climate: DestinyClimateDraft,
) {
  const items: DestinyInterpretationItem[] = [
    ...(climate.pressureThemes ?? []),
    ...(climate.opportunityThemes ?? []),
    ...(climate.relationshipThemes ?? []),
    ...(climate.observationSignals ?? []),
  ];

  return items.filter((item) => item.label === panel.label).slice(0, 3);
}

function lowConfidenceNotes({
  seedContext,
  climate,
  keyPeople,
}: {
  seedContext: SeedContextDraft;
  climate: DestinyClimateDraft;
  keyPeople: KeyPersonDraft[];
}) {
  const notes: string[] = [];

  if (climate.confidence.missingFields.includes("birthTime")) {
    notes.push("Birth time is missing, so hour-pillar related fusion stays directional.");
  }

  if (climate.mode === "rough") {
    notes.push("Destiny mode is rough, so real-situation evidence should carry more weight.");
  }

  if (climate.mode === "skipped") {
    notes.push("Destiny mode is skipped, so mappings rely on real-situation and sandbox evidence.");
  }

  if (keyPeople.length < 2) {
    notes.push("Few key people were extracted, so person-theme mapping confidence is limited.");
  }

  const situationText =
    seedContext.currentQuestionDescription ||
    seedContext.situationSummary ||
    seedContext.questionText;
  if (situationText.trim().length < 80) {
    notes.push("The current situation is brief, so fusion should be treated as a starting hypothesis.");
  }

  return notes;
}

function fallbackPerson(
  seedContext: SeedContextDraft,
  now: string,
): KeyPersonDraft {
  return {
    id: `kp_${hashText(`${seedContext.id}:self_context`)}`,
    seedContextId: seedContext.id,
    label: "Current situation",
    displayName: "Current situation",
    role: "Situation-level pressure",
    relationshipToUser: "self_context",
    roleType: "context",
    confidence: 45,
    knownEvidence:
      seedContext.currentQuestionDescription ?? seedContext.situationSummary,
    missingFields: ["Specific people"],
    evidenceRefs: [`seed:${seedContext.id}:current_question_description`],
    userNote: "",
    confirmed: true,
    status: "confirmed" as const,
    source: "seed_context_text" as const,
    evidenceText:
      seedContext.currentQuestionDescription ?? seedContext.situationSummary,
    createdAt: now,
    updatedAt: now,
  };
}

function panelsForClimate(climate: DestinyClimateDraft) {
  return climate.panels.length
    ? climate.panels
    : climate.activeThemes.map((theme) => ({
        id: `panel_${theme.id}`,
        label: theme.label,
        intensity: "mild" as const,
        direction: "steady" as const,
        userFacingSummary: theme.userFacingSummary,
        evidenceRefs: theme.evidenceRefs,
      }));
}

export function buildDestinySituationFusionDraft({
  seedContext,
  destinyClimate,
  keyPeople,
  now = new Date().toISOString(),
}: {
  seedContext: SeedContextDraft;
  destinyClimate: DestinyClimateDraft;
  keyPeople: KeyPersonDraft[];
  now?: string;
}): DestinySituationFusionDraft {
  const people = keyPeople.length
    ? keyPeople
    : [fallbackPerson(seedContext, now)];
  const panels = panelsForClimate(destinyClimate);
  const runLowConfidenceNotes = lowConfidenceNotes({
    seedContext,
    climate: destinyClimate,
    keyPeople,
  });
  const rhythmNote = `Decision rhythm is ${destinyClimate.decisionRhythm.overall}; fusion uses this as timing context, not a prediction.`;

  const mappings = panels.slice(0, 5).map((panel, index) => {
    const person = bestPersonForTheme(panel.label, people, index);
    const role = pressureRoleForTheme(panel.label, person);
    const interpretations = interpretationForPanel(panel, destinyClimate);
    const destinyBasis = Array.from(
      new Set([
        ...(panel.evidenceRefs.length ? panel.evidenceRefs : destinyClimate.evidenceRefs),
        ...interpretations.flatMap((item) => item.evidenceRefs),
      ]),
    );
    const realClues = realClueRefs(seedContext, person);
    const interpretationNotes = [
      ...interpretations.map(
        (item) => `${item.label}: ${item.userFacingSummary}`,
      ),
      rhythmNote,
    ];
    const whyLinked = `${panel.label} is linked to ${person.displayName ?? person.label} because their role/evidence matches ${role}. This is an observable pressure mapping, not a judgment about the person.`;
    const confidence = Math.min(
      84,
      Math.max(
        24,
        Math.round(
          (person.confidence + destinyClimate.confidence.score) / 2 +
            Math.min(10, themePersonScore(panel.label, person) / 6) -
            runLowConfidenceNotes.length * 3,
        ),
      ),
    );

    return {
      id: `fusion_${hashText(`${seedContext.id}:${panel.id}:${person.id}`)}`,
      themeId: panel.id,
      themeLabel: panel.label,
      personId: person.id,
      personLabel: person.displayName ?? person.label,
      pressureRole: role,
      linkedInterpretationIds: interpretations.map((item) => item.id),
      mappingExplanation: {
        destinyTheme: panel.label,
        realPersonOrPressure: `${person.displayName ?? person.label} / ${role}`,
        whyLinked,
        evidenceBasis: [...destinyBasis, ...realClues],
        confidence,
      },
      interpretationNotes,
      lowConfidenceNotes: runLowConfidenceNotes,
      sourceTags: [...sourceTags],
      userFacingSummary: `${whyLinked} Evidence basis includes destiny interpretation notes and real-situation clues; confidence is ${confidence}%.`,
      evidenceRefs: {
        destinyBasis,
        realClues,
      },
      confidence,
    } satisfies DestinySituationFusionMapping;
  });

  return {
    id: `fusion_${hashText(`${seedContext.id}:${destinyClimate.id}`)}`,
    seedContextId: seedContext.id,
    version: "destiny-situation-fusion-local-v0",
    mappings,
    sourceTags: [...sourceTags],
    evidenceRefs: {
      destinyBasis: Array.from(
        new Set(mappings.flatMap((mapping) => mapping.evidenceRefs.destinyBasis)),
      ),
      realClues: Array.from(
        new Set(mappings.flatMap((mapping) => mapping.evidenceRefs.realClues)),
      ),
    },
    localWarnings: runLowConfidenceNotes,
    createdAt: now,
    updatedAt: now,
  };
}
