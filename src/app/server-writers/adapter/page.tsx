import { buildDisabledServiceRoleAdapterStatus } from "@/lib/server-writers/service-role-adapter";

import { ServiceRoleAdapterClientPage } from "./service-role-adapter-client";

export default function ServiceRoleAdapterPage() {
  return (
    <ServiceRoleAdapterClientPage
      payload={buildDisabledServiceRoleAdapterStatus()}
    />
  );
}
