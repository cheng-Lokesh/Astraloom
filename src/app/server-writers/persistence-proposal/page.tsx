import { buildWriterPersistenceImplementationProposal } from "@/lib/server-writers/persistence-implementation-proposal";

import { WriterPersistenceImplementationProposalClientPage } from "./writer-persistence-implementation-proposal-client";

export default async function WriterPersistenceImplementationProposalPage() {
  const payload = await buildWriterPersistenceImplementationProposal();

  return <WriterPersistenceImplementationProposalClientPage payload={payload} />;
}
