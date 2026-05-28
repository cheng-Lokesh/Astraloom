import type {
  DestinyClimateDraft,
  DestinyClimatePanel,
} from "@/types/destiny";
import type {
  DestinySituationFusionDraft,
  DestinySituationFusionMapping,
} from "@/types/destiny-fusion";
import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function pressureRoleForPanel(panel: DestinyClimatePanel, person: KeyPersonDraft) {
  if (panel.label === "resource pressure") return "resource pressure holder";
  if (panel.label === "boundary pressure") return "boundary pressure point";
  if (panel.label === "emotional pull") return "emotional pull anchor";
  if (panel.label === "opportunity shift") return "opportunity shift carrier";
  if (panel.label === "information uncertainty") return "information gap signal";
  if (person.roleType === "authority") return "authority pressure point";
  if (person.roleType === "support") return "support calibration point";
  return "situation pressure signal";
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
    : [
        {
          id: `kp_${hashText(`${seedContext.id}:self_context`)}`,
          seedContextId: seedContext.id,
          label: "Current situation",
          displayName: "Current situation",
          role: "Situation-level pressure",
          relationshipToUser: "self_context",
          roleType: "context",
          confidence: 45,
          knownEvidence: seedContext.currentQuestionDescription ?? seedContext.situationSummary,
          missingFields: ["Specific people"],
          evidenceRefs: [`seed:${seedContext.id}:current_question_description`],
          userNote: "",
          confirmed: true,
          status: "confirmed" as const,
          source: "seed_context_text" as const,
          evidenceText: seedContext.currentQuestionDescription ?? seedContext.situationSummary,
          createdAt: now,
          updatedAt: now,
        },
      ];
  const panels = destinyClimate.panels.length
    ? destinyClimate.panels
    : destinyClimate.activeThemes.map((theme) => ({
        id: `panel_${theme.id}`,
        label: theme.label,
        intensity: "mild" as const,
        direction: "steady" as const,
        userFacingSummary: theme.userFacingSummary,
        evidenceRefs: theme.evidenceRefs,
      }));
  const mappings = panels.slice(0, 5).map((panel, index) => {
    const person = people[index % people.length];
    const destinyBasis = panel.evidenceRefs.length
      ? panel.evidenceRefs
      : destinyClimate.evidenceRefs;
    const realClues = realClueRefs(seedContext, person);

    return {
      id: `fusion_${hashText(`${seedContext.id}:${panel.id}:${person.id}`)}`,
      themeId: panel.id,
      themeLabel: panel.label,
      personId: person.id,
      personLabel: person.displayName ?? person.label,
      pressureRole: pressureRoleForPanel(panel, person),
      sourceTags: [
        "destiny climate",
        "real situation",
        "integrated simulation",
      ],
      userFacingSummary: `${panel.label} is mapped to ${person.displayName ?? person.label} as a ${pressureRoleForPanel(panel, person)}. This is a symbolic-to-situation mapping, not a certainty claim.`,
      evidenceRefs: {
        destinyBasis,
        realClues,
      },
      confidence: Math.min(82, Math.max(28, Math.round((person.confidence + destinyClimate.confidence.score) / 2))),
    } satisfies DestinySituationFusionMapping;
  });

  return {
    id: `fusion_${hashText(`${seedContext.id}:${destinyClimate.id}`)}`,
    seedContextId: seedContext.id,
    version: "destiny-situation-fusion-local-v0",
    mappings,
    sourceTags: ["destiny climate", "real situation", "integrated simulation"],
    evidenceRefs: {
      destinyBasis: Array.from(
        new Set(mappings.flatMap((mapping) => mapping.evidenceRefs.destinyBasis)),
      ),
      realClues: Array.from(
        new Set(mappings.flatMap((mapping) => mapping.evidenceRefs.realClues)),
      ),
    },
    createdAt: now,
    updatedAt: now,
  };
}
