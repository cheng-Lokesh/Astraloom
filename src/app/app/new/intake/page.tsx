import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { FormalIntakeClient } from "./formal-intake-client";

export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  if (!auth.user?.id) {
    redirect("/login");
  }

  return (
    <AppShell>
      <FormalIntakeClient />
    </AppShell>
  );
}
