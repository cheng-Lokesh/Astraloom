import { buildServiceRoleIsolationHarness } from "@/lib/server-writers/service-role-isolation";

import { ServiceRoleIsolationClientPage } from "./service-role-isolation-client";

export default function ServiceRoleIsolationPage() {
  return (
    <ServiceRoleIsolationClientPage
      payload={buildServiceRoleIsolationHarness()}
    />
  );
}
