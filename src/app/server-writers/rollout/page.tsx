import { buildWriterRolloutChecklist } from "@/lib/server-writers/rollout";

import { WriterRolloutClientPage } from "./writer-rollout-client";

export default function WriterRolloutPage() {
  return <WriterRolloutClientPage payload={buildWriterRolloutChecklist()} />;
}
