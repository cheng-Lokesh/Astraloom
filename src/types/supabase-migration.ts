export type SupabaseMigrationFilePayload = {
  filePath: string;
  sql: string;
  lineCount: number;
  tableCount: number;
  policyCount: number;
  rlsEnabledCount: number;
};

export type SupabaseMigrationPayload = {
  filePath: string;
  sql: string;
  lineCount: number;
  tableCount: number;
  policyCount: number;
  rlsEnabledCount: number;
  migrationCount: number;
  migrations: SupabaseMigrationFilePayload[];
};
