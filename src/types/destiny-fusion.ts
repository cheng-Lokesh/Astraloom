import type { DestinyThemeSignal } from "./destiny";

export type DestinySituationFusionSourceTag =
  | "destiny climate"
  | "real situation"
  | "integrated simulation";

export type DestinySituationFusionMapping = {
  id: string;
  themeId: string;
  themeLabel: DestinyThemeSignal["label"];
  personId: string;
  personLabel: string;
  pressureRole: string;
  sourceTags: DestinySituationFusionSourceTag[];
  userFacingSummary: string;
  evidenceRefs: {
    destinyBasis: string[];
    realClues: string[];
  };
  confidence: number;
};

export type DestinySituationFusionDraft = {
  id: string;
  seedContextId: string;
  version: "destiny-situation-fusion-local-v0";
  mappings: DestinySituationFusionMapping[];
  sourceTags: DestinySituationFusionSourceTag[];
  evidenceRefs: {
    destinyBasis: string[];
    realClues: string[];
  };
  localWarnings?: string[];
  createdAt: string;
  updatedAt: string;
};
