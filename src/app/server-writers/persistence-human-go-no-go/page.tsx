import { buildWriterPersistenceHumanGoNoGo } from "@/lib/server-writers/persistence-human-go-no-go";

import { WriterPersistenceHumanGoNoGoClientPage } from "./writer-persistence-human-go-no-go-client";

export default async function WriterPersistenceHumanGoNoGoPage() {
  const payload = await buildWriterPersistenceHumanGoNoGo();

  return <WriterPersistenceHumanGoNoGoClientPage payload={payload} />;
}
