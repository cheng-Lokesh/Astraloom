import { buildWriterPersistenceNoGoPacket } from "@/lib/server-writers/persistence-no-go";

import { WriterPersistenceNoGoClientPage } from "./writer-persistence-no-go-client";

export default async function WriterPersistenceNoGoPage() {
  const payload = await buildWriterPersistenceNoGoPacket();

  return <WriterPersistenceNoGoClientPage payload={payload} />;
}
