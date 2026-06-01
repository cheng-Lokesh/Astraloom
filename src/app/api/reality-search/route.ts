import { NextResponse } from "next/server";

import { searchExternalReality } from "@/lib/reality-intake/external-reality-search";
import type {
  ExternalRealityExpectedSourceType,
  ExternalRealitySearchQuestion,
  RealityIntakePrimaryDomain,
} from "@/types/reality-intake";

export const runtime = "nodejs";

const sourceTypes: ExternalRealityExpectedSourceType[] = [
  "job_market",
  "policy",
  "company",
  "news",
  "city",
  "industry",
  "education",
  "migration",
  "finance",
  "relationship_context",
  "other",
];

const domains: RealityIntakePrimaryDomain[] = [
  "career",
  "relationship",
  "collaboration",
  "family",
  "migration",
  "study",
  "finance",
  "self_direction",
  "other",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sourceType(value: unknown): ExternalRealityExpectedSourceType {
  return sourceTypes.includes(value as ExternalRealityExpectedSourceType)
    ? (value as ExternalRealityExpectedSourceType)
    : "other";
}

function confidence(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 50;
  return Math.max(5, Math.min(80, Math.round(numeric)));
}

function searchQuestions(value: unknown): ExternalRealitySearchQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).flatMap((item, index) => {
    if (!isRecord(item) || typeof item.question !== "string") return [];
    const question = item.question.trim();
    if (!question) return [];
    return [{
      id:
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : `search_question_${index + 1}`,
      question,
      reason: typeof item.reason === "string" ? item.reason.trim() : "",
      expectedSourceType: sourceType(item.expectedSourceType),
      priority:
        typeof item.priority === "number" && Number.isFinite(item.priority)
          ? item.priority
          : 50,
      confidence: confidence(item.confidence),
    }];
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        searchUsed: false,
        provider: "noop",
        sources: [],
        warnings: ["Invalid JSON request body."],
        validationErrors: ["request_json_parse_failed"],
      },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      {
        ok: false,
        searchUsed: false,
        provider: "noop",
        sources: [],
        warnings: ["Request body must be an object."],
        validationErrors: ["request_body_invalid"],
      },
      { status: 400 },
    );
  }

  const questions = searchQuestions(body.searchQuestions);
  const locale = body.locale === "zh" ? "zh" : "en";
  const primaryDomain = domains.includes(body.primaryDomain as RealityIntakePrimaryDomain)
    ? (body.primaryDomain as RealityIntakePrimaryDomain)
    : "other";

  const result = await searchExternalReality({
    searchQuestions: questions,
    locale,
    primaryDomain,
  });

  return NextResponse.json(result);
}

