import { buildWriterPersistenceAdapterDesign } from "@/lib/server-writers/persistence-adapter-design";

import { WriterPersistenceAdapterClientPage } from "./writer-persistence-adapter-client";

export default async function WriterPersistenceAdapterPage() {
  const payload = await buildWriterPersistenceAdapterDesign();

  return <WriterPersistenceAdapterClientPage payload={payload} />;
}
