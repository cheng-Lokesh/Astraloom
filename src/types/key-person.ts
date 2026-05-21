export type KeyPersonStatus = "candidate" | "confirmed" | "rejected";

export type KeyPersonSource = "key_people_text" | "seed_context_text" | "manual";

export type KeyPersonDraft = {
  id: string;
  seedContextId: string;
  label: string;
  role: string;
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
