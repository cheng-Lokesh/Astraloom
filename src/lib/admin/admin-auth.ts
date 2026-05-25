import "server-only";

import type { NextRequest } from "next/server";

export type AdminAuthResult =
  | {
      ok: true;
      errorCode: null;
      status: 200;
    }
  | {
      ok: false;
      errorCode: "admin_token_not_configured" | "admin_unauthorized";
      status: 401 | 503;
    };

export function verifyAdminRequest(request: NextRequest): AdminAuthResult {
  const expectedToken = process.env.MIROFISH_ADMIN_TOKEN;

  if (!expectedToken) {
    return {
      ok: false,
      errorCode: "admin_token_not_configured",
      status: 503,
    };
  }

  const providedToken = request.headers.get("x-mirofish-admin-token");

  if (!providedToken || providedToken !== expectedToken) {
    return {
      ok: false,
      errorCode: "admin_unauthorized",
      status: 401,
    };
  }

  return {
    ok: true,
    errorCode: null,
    status: 200,
  };
}
