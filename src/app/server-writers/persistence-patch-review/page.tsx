import { buildWriterPersistencePatchReview } from "@/lib/server-writers/persistence-patch-review";

import { WriterPersistencePatchReviewClientPage } from "./writer-persistence-patch-review-client";

export default async function WriterPersistencePatchReviewPage() {
  const payload = await buildWriterPersistencePatchReview();

  return <WriterPersistencePatchReviewClientPage payload={payload} />;
}
