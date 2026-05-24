import "server-only";

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function hasHighRiskSignal(text: string) {
  return /自杀|伤害自己|杀死|暴力|跟踪|监控|胁迫|威胁|suicide|self-harm|kill|stalk|coerce/i.test(
    text,
  );
}

export function jsonError(errorCode: string, traceId: string, status: number) {
  return Response.json(
    { ok: false, trace_id: traceId, error_code: errorCode },
    { status },
  );
}
