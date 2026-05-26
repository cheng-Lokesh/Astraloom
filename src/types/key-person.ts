export type KeyPersonStatus =
  | "candidate"
  | "confirmed"
  | "deleted"
  | "merged"
  | "needs_confirmation"
  | "rejected";

export type KeyPersonSource = "key_people_text" | "seed_context_text" | "manual";

export type KeyPersonDraft = {
  id: string;
  seedContextId: string;
  label: string;
  displayName?: string;
  role: string;
  relationshipToUser: string;
  roleType: string;
  confidence: number;
  knownEvidence: string;
  missingFields: string[];
  evidenceRefs: string[];
  userNote: string;
  mergedIntoId?: string;
  confirmed: boolean;
  status: KeyPersonStatus;
  source: KeyPersonSource;
  evidenceText: string;
  createdAt: string;
  updatedAt: string;
};

export type KeyPeopleDraft = {
  seedContextId: string;
  people: KeyPersonDraft[];
  updatedAt: string;
};
