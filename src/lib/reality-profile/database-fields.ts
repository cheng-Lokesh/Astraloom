import { realityProfileDraftSchema, type RealityProfileDraft } from "./profile";

// The only camelCase-to-column mapper. It never accepts owner or row identities.
export function toRealityProfileDatabaseFields(rawProfile: RealityProfileDraft) {
  const profile = realityProfileDraftSchema.parse(rawProfile);
  return {
    life_climate_value: profile.lifeClimate.classification === "unknown" ? null : profile.lifeClimate.value,
    life_climate_classification: profile.lifeClimate.classification,
    life_climate_evidence_summary: profile.lifeClimate.evidenceSummary,
    resources_value: profile.resources.classification === "unknown" ? null : profile.resources.value,
    resources_classification: profile.resources.classification,
    resources_evidence_summary: profile.resources.evidenceSummary,
    constraints_value: profile.constraints.classification === "unknown" ? null : profile.constraints.value,
    constraints_classification: profile.constraints.classification,
    constraints_evidence_summary: profile.constraints.evidenceSummary,
    life_goals: profile.goals,
    core_values: profile.values,
    life_themes: profile.lifeThemes,
    pressures: profile.pressures,
    external_variables: profile.externalVariables,
    life_model_domains: profile.lifeModelDomains,
    world_model_inputs: profile.worldInputs,
  };
}
