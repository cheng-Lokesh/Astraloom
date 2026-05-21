import { buildWriterPersistenceReview } from "@/lib/server-writers/persistence-review";

import { WriterPersistenceReviewClientPage } from "./writer-persistence-review-client";

export default async function WriterPersistenceReviewPage() {
  const payload = await buildWriterPersistenceReview();

  return <WriterPersistenceReviewClientPage payload={payload} />;
}
