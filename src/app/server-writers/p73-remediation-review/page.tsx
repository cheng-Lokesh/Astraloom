import { buildStage73RemediationReview } from "@/lib/server-writers/stage73-remediation-review";

import { Stage73RemediationReviewClientPage } from "./stage73-client";

export default async function Stage73RemediationReviewPage() {
  const payload = await buildStage73RemediationReview();

  return <Stage73RemediationReviewClientPage payload={payload} />;
}
