export type RepositoryAdapter = "localStorage" | "supabase";

export type RepositoryResult<T> =
  | {
      ok: true;
      data: T;
      errorCode: null;
      traceId: string;
    }
  | {
      ok: false;
      data: null;
      errorCode: string;
      traceId: string;
    };

export type RepositoryContext = {
  adapter: RepositoryAdapter;
  userId?: string | null;
};

export type DraftRepository<TDraft, TKey = string> = {
  load: (key?: TKey) => RepositoryResult<TDraft | null>;
  save: (draft: TDraft) => RepositoryResult<TDraft>;
  list: (key?: TKey) => RepositoryResult<TDraft[]>;
  clearDraft: (key?: TKey) => RepositoryResult<null>;
  markDeleted: (key?: TKey) => RepositoryResult<null>;
};

export function createRepositoryTraceId(prefix = "repo") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}:${crypto.randomUUID()}`;
  }

  return `${prefix}:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function ok<T>(data: T, traceId = createRepositoryTraceId()) {
  return {
    ok: true,
    data,
    errorCode: null,
    traceId,
  } satisfies RepositoryResult<T>;
}

export function fail<T = never>(
  errorCode: string,
  traceId = createRepositoryTraceId(),
) {
  return {
    ok: false,
    data: null,
    errorCode,
    traceId,
  } satisfies RepositoryResult<T>;
}

export function guardRepository<T>(operation: () => T, prefix: string) {
  const traceId = createRepositoryTraceId(prefix);

  try {
    return ok(operation(), traceId);
  } catch {
    return fail<T>("repository_operation_failed", traceId);
  }
}

export function missingKey<T>(prefix: string) {
  return fail<T>("repository_key_required", createRepositoryTraceId(prefix));
}

export function supabaseAdapterNotEnabled<T>(prefix: string) {
  return fail<T>(
    "supabase_repository_adapter_not_enabled",
    createRepositoryTraceId(prefix),
  );
}
