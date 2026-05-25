import "server-only";

export type AiTesterIdentity = {
  userId: string;
  email?: string | null;
};

export type AiTesterGate = {
  allowed: boolean;
  errorCode: "ai_tester_not_allowlisted" | null;
  matchedBy: "user_id" | "email" | null;
};

export function checkAiTesterAllowlist({
  userId,
  email,
}: AiTesterIdentity): AiTesterGate {
  const allowedUserIds = parseAllowlist(process.env.ALLOWED_AI_TESTER_USER_IDS);
  const allowedEmails = parseAllowlist(process.env.ALLOWED_AI_TESTER_EMAILS, {
    normalize: (value) => value.toLowerCase(),
  });
  const normalizedEmail = email?.trim().toLowerCase() ?? "";

  if (allowedUserIds.has(userId)) {
    return { allowed: true, errorCode: null, matchedBy: "user_id" };
  }

  if (normalizedEmail && allowedEmails.has(normalizedEmail)) {
    return { allowed: true, errorCode: null, matchedBy: "email" };
  }

  return {
    allowed: false,
    errorCode: "ai_tester_not_allowlisted",
    matchedBy: null,
  };
}

function parseAllowlist(
  value: string | undefined,
  options: { normalize?: (item: string) => string } = {},
) {
  return new Set(
    (value ?? "")
      .split(/[\s,;]+/)
      .map((item) => options.normalize?.(item.trim()) ?? item.trim())
      .filter(Boolean),
  );
}
