import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export type LlmRateLimitJobType = "key_people_extract" | "agents_generate";

type RateLimitBucket = {
  windowStartedAt: number;
  count: number;
};

const oneHourMs = 60 * 60 * 1000;

const limits: Record<LlmRateLimitJobType, number> = {
  key_people_extract: 10,
  agents_generate: 5,
};

function rateLimitStore() {
  const globalStore = globalThis as typeof globalThis & {
    __mirofishLlmRateLimits?: Map<string, RateLimitBucket>;
  };
  globalStore.__mirofishLlmRateLimits ??= new Map();
  return globalStore.__mirofishLlmRateLimits;
}

export async function checkLlmRateLimit(input: {
  userId: string;
  jobType: LlmRateLimitJobType;
  now?: number;
}) {
  const persistent = await checkPersistentRateLimit(input);
  if (persistent) return persistent;

  return checkInMemoryRateLimit(input);
}

function checkInMemoryRateLimit(input: {
  userId: string;
  jobType: LlmRateLimitJobType;
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const key = `${input.jobType}:${input.userId}`;
  const store = rateLimitStore();
  const current = store.get(key);

  if (!current || now - current.windowStartedAt >= oneHourMs) {
    store.set(key, { windowStartedAt: now, count: 1 });
    return {
      allowed: true,
      limit: limits[input.jobType],
      remaining: limits[input.jobType] - 1,
      resetAt: new Date(now + oneHourMs).toISOString(),
    };
  }

  if (current.count >= limits[input.jobType]) {
    return {
      allowed: false,
      limit: limits[input.jobType],
      remaining: 0,
      resetAt: new Date(current.windowStartedAt + oneHourMs).toISOString(),
    };
  }

  current.count += 1;

  return {
    allowed: true,
    limit: limits[input.jobType],
    remaining: limits[input.jobType] - current.count,
    resetAt: new Date(current.windowStartedAt + oneHourMs).toISOString(),
  };
}

async function checkPersistentRateLimit(input: {
  userId: string;
  jobType: LlmRateLimitJobType;
  now?: number;
}) {
  const serviceRole = createSupabaseServiceRoleClient();
  if (!serviceRole.ok) return null;

  const now = input.now ?? Date.now();
  const windowStartedAt = new Date(
    Math.floor(now / oneHourMs) * oneHourMs,
  ).toISOString();
  const resetAt = new Date(Date.parse(windowStartedAt) + oneHourMs).toISOString();
  const limit = limits[input.jobType];
  const key = `${input.userId}:${input.jobType}:${windowStartedAt}`;

  const { data: existing, error: lookupError } = await serviceRole.supabase
    .from("llm_rate_limits")
    .select("count")
    .eq("idempotency_key", key)
    .maybeSingle();

  if (lookupError) return null;

  const currentCount =
    existing && typeof existing.count === "number" ? existing.count : 0;

  if (currentCount >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt,
    };
  }

  const nextCount = currentCount + 1;
  const { error: upsertError } = await serviceRole.supabase
    .from("llm_rate_limits")
    .upsert(
      {
        idempotency_key: key,
        user_id: input.userId,
        job_type: input.jobType,
        window_started_at: windowStartedAt,
        count: nextCount,
      },
      { onConflict: "idempotency_key" },
    );

  if (upsertError) return null;

  return {
    allowed: true,
    limit,
    remaining: limit - nextCount,
    resetAt,
  };
}
