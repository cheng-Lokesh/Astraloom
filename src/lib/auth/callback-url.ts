const defaultNextPath = "/app/new/intake";

export function getCanonicalAuthCallbackUrl(appUrl: string, next = defaultNextPath) {
  const callbackUrl = new URL("/auth/callback", appUrl);
  callbackUrl.searchParams.set("next", getSafeNextPath(next));
  return callbackUrl.toString();
}

export function getSafeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return defaultNextPath;
  }

  return next;
}
