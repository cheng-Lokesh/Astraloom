import { buildWriterPersistenceFixtureHarness } from "@/lib/server-writers/persistence-fixtures";

import { WriterPersistenceFixturesClientPage } from "./writer-persistence-fixtures-client";

export default async function WriterPersistenceFixturesPage() {
  const payload = await buildWriterPersistenceFixtureHarness();

  return <WriterPersistenceFixturesClientPage payload={payload} />;
}
