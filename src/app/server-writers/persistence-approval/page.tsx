import { buildWriterPersistenceApprovalPacket } from "@/lib/server-writers/persistence-approval-packet";

import { WriterPersistenceApprovalPacketClientPage } from "./writer-persistence-approval-packet-client";

export default async function WriterPersistenceApprovalPacketPage() {
  const payload = await buildWriterPersistenceApprovalPacket();

  return <WriterPersistenceApprovalPacketClientPage payload={payload} />;
}
