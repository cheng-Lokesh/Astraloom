import { buildWriterMigrationProposal } from "@/lib/server-writers/migration-proposal";

import { WriterMigrationProposalClientPage } from "./writer-migration-proposal-client";

export default function WriterMigrationProposalPage() {
  return (
    <WriterMigrationProposalClientPage
      payload={buildWriterMigrationProposal()}
    />
  );
}
