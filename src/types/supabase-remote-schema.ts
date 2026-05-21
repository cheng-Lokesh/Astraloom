export type RemoteSchemaCheckStatus =
  | "missing_config"
  | "schema_present"
  | "schema_incomplete"
  | "auth_failed"
  | "network_error";

export type RemoteTableCheck = {
  tableName: string;
  present: boolean;
  statusCode: number | null;
  detail: string;
};

export type SupabaseRemoteSchemaStatus = {
  status: RemoteSchemaCheckStatus;
  checkedAt: string;
  projectUrlConfigured: boolean;
  publishableKeyConfigured: boolean;
  checkedTableCount: number;
  presentTableCount: number;
  tables: RemoteTableCheck[];
};
