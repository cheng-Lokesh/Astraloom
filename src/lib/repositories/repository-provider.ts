import { createAgentProfileRepository } from "./agent-profile-repository";
import { createBillingSupportRepository } from "./billing-support-repository";
import {
  createDestinyClimateRepository,
  createDestinyProfileRepository,
} from "./destiny-repository";
import { createFeedbackRepository } from "./feedback-repository";
import { createKeyPeopleRepository } from "./key-people-repository";
import { createRelationGraphRepository } from "./relation-graph-repository";
import { createReportRepository } from "./report-repository";
import { createSafetyReviewRepository } from "./safety-review-repository";
import { createSeedContextRepository } from "./seed-context-repository";
import { createSimulationRepository } from "./simulation-repository";
import type { RepositoryAdapter, RepositoryContext } from "./types";

export function createRepositories(
  context: Partial<RepositoryContext> = {},
) {
  const adapter: RepositoryAdapter = context.adapter ?? "localStorage";

  return {
    adapter,
    seedContexts: createSeedContextRepository(adapter),
    destinyProfiles: createDestinyProfileRepository(adapter),
    destinyClimates: createDestinyClimateRepository(adapter),
    keyPeople: createKeyPeopleRepository(adapter),
    agentProfiles: createAgentProfileRepository(adapter),
    relationGraphs: createRelationGraphRepository(adapter),
    simulations: createSimulationRepository(adapter),
    reports: createReportRepository(adapter),
    feedback: createFeedbackRepository(adapter),
    billingSupport: createBillingSupportRepository(adapter),
    safetyReviews: createSafetyReviewRepository(adapter),
  };
}

export const repositories = createRepositories();

export function getRepositories() {
  return repositories;
}
