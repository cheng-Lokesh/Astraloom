import { buildStage72Remediation } from "@/lib/server-writers/stage72-remediation";

import { Stage72RemediationClientPage } from "./stage72-client";

export default async function Stage72RemediationPage() {
  const payload = await buildStage72Remediation();

  return <Stage72RemediationClientPage payload={payload} />;
}
