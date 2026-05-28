type FuseDestinySituationPromptInput = {
  destinyBase: unknown;
  destinyClimate: unknown;
  situationExtraction: unknown;
  locale?: string;
};

const promptVersion = "fuse-destiny-situation-v1";

export function buildFuseDestinySituationPrompt(
  input: FuseDestinySituationPromptInput,
) {
  return {
    promptVersion,
    system:
      [
        "You do one narrow job for Astraloom: map non-deterministic destiny themes to observable situation anchors.",
        "Return valid JSON only. Do not wrap the JSON in markdown, comments, or explanation.",
        "Do not force mappings. If fusionConfidence is below 0.35, place the theme in unmappedThemes, not mappedThemes.",
        "Treat destiny information as symbolic context for reflection, never as proof of fate, character, blame, or guaranteed outcomes.",
        "Do not claim that one person harms, curses, controls, saves, completes, or is destined for the user.",
        "Every mapped theme must reference both destiny evidence and real-world extraction evidence.",
        "Do not create sandbox events or final findings in this step.",
      ].join(" "),
    user: JSON.stringify({
      task: "Fuse destiny themes with extracted situation anchors without inventing people, motives, or outcomes.",
      json_only: true,
      hard_rules: [
        "Map only when there is a clear anchor in both destinyClimate and situationExtraction.",
        "fusionConfidence must reflect evidence quality, not narrative appeal.",
        "fusionConfidence below 0.35 must be excluded from mappedThemes and included in unmappedThemes.",
        "narrativeDirection must follow confidence and evidence: reveal for strong new pattern, remind for known repeated pattern, reframe for moderate reinterpretation, flag for uncertainty or risk boundary.",
        "Use neutral language. Do not use deterministic or fear-based destiny wording.",
        "Do not recommend a path or decide what the user should do.",
      ],
      forbidden_outputs: [
        "deterministic fate claims",
        "private motive claims about third parties",
        "banned relation language such as 克你, 注定, 必然, 天命, 烂桃花, 破财, 大凶, 一定会",
        "medical, legal, investment, or therapy advice",
        "sandbox events, integrated findings, graph edges, payment claims, or entitlement claims",
      ],
      output_contract: {
        fusionResult: {
          mappedThemes: [
            {
              id: "stable string, for example map_1",
              destinyThemeId: "id or label from destinyClimate",
              situationAnchorId:
                "person, event, option, worry, or topic id from situationExtraction",
              themeLabel: "short neutral label",
              realityLabel: "short neutral situation label",
              narrativeDirection: "reveal | remind | reframe | flag",
              fusionConfidence: "number from 0.35 to 1.0",
              rationale:
                "short explanation grounded in explicit evidence; no prediction",
              destinyEvidenceRefs: ["destiny theme/event ids or labels"],
              situationEvidenceRefs: ["situation extraction ids or source refs"],
              safetyNotes: ["short note if language needs caution"],
            },
          ],
          unmappedThemes: [
            {
              id: "stable string, for example unmapped_1",
              destinyThemeId: "id or label from destinyClimate",
              reason:
                "no clear real-world anchor | low confidence | safety boundary | insufficient extraction",
              fusionConfidence: "number from 0.0 to 0.34",
              evidenceRefs: ["destiny refs only or extraction refs if present"],
            },
          ],
          unmappedSituationAnchors: [
            {
              id: "person, event, option, worry, or topic id",
              reason:
                "no clear destiny theme | low confidence | safety boundary | insufficient destiny data",
              evidenceRefs: ["situation extraction ids or source refs"],
            },
          ],
          meta: {
            overallFusionConfidence: "number from 0.0 to 1.0",
            evidenceCoverage: "low | medium | high",
            safetyDowngraded: "boolean",
          },
        },
      },
      validator_notes: [
        "Root object must contain fusionResult only.",
        "mappedThemes items must have fusionConfidence >= 0.35.",
        "unmappedThemes items must have fusionConfidence < 0.35.",
        "Each mappedThemes item must include destinyEvidenceRefs and situationEvidenceRefs.",
        "No output may include deterministic fate claims, banned words, or final findings.",
      ],
      input: {
        destinyBase: input.destinyBase,
        destinyClimate: input.destinyClimate,
        situationExtraction: input.situationExtraction,
        locale: input.locale ?? "zh-CN",
      },
    }),
  };
}
