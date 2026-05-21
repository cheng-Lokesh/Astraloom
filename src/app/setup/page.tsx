import { buildSupabaseSetupStatus } from "@/lib/supabase/setup-status";
import { checkSupabaseRemoteSchema } from "@/lib/supabase/remote-schema";

import { SupabaseSetupClientPage } from "./setup-client";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const [setupStatus, remoteSchemaStatus] = await Promise.all([
    buildSupabaseSetupStatus(),
    checkSupabaseRemoteSchema(),
  ]);

  return (
    <SupabaseSetupClientPage
      remoteSchema={remoteSchemaStatus}
      status={setupStatus}
    />
  );
}
