import { readSupabaseMigration } from "@/lib/supabase/migration-file";

import { MigrationClientPage } from "./migration-client";

export default function SetupMigrationPage() {
  return <MigrationClientPage migration={readSupabaseMigration()} />;
}
