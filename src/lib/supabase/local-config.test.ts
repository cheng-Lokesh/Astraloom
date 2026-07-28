import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const canonicalAppOrigin = "http://localhost:3000";
const canonicalCallback = `${canonicalAppOrigin}/auth/callback`;
const canonicalAuthApiUrl = "http://localhost:54321/auth/v1";

function validateLocalSupabaseConfig(config: string) {
  const sections = new Map<string, Array<{ key: string; value: string }>>();
  let section = "(root)";

  for (const rawLine of config.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      continue;
    }

    const entryMatch = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.+)$/);
    if (entryMatch) {
      const entries = sections.get(section) ?? [];
      entries.push({ key: entryMatch[1], value: entryMatch[2] });
      sections.set(section, entries);
    }
  }

  const entries = (name: string, key: string) =>
    (sections.get(name) ?? []).filter((entry) => entry.key === key);
  const errors: string[] = [];
  const authExternalUrls = entries("auth", "external_url");
  const misplacedExternalUrl = [...sections.entries()].some(
    ([name, sectionEntries]) =>
      name !== "auth" && sectionEntries.some((entry) => entry.key === "external_url"),
  );

  if (authExternalUrls.length !== 1 || misplacedExternalUrl) {
    errors.push("auth.external_url must be declared exactly once");
  } else if (authExternalUrls[0].value !== `"${canonicalAuthApiUrl}"`) {
    errors.push("auth.external_url must use the local Auth API URL");
  }

  const siteUrls = entries("auth", "site_url");
  if (siteUrls.length !== 1 || siteUrls[0].value !== `"${canonicalAppOrigin}"`) {
    errors.push("auth.site_url must use the canonical application origin");
  }

  const redirectUrls = entries("auth", "additional_redirect_urls");
  if (
    redirectUrls.length !== 1 ||
    redirectUrls[0].value !== `["${canonicalCallback}"]`
  ) {
    errors.push("auth.additional_redirect_urls must contain only the exact callback URL");
  }

  const analyticsEnabled = entries("analytics", "enabled");
  if (analyticsEnabled.length !== 1 || analyticsEnabled[0].value !== "false") {
    errors.push("analytics.enabled must be false in the analytics section");
  }

  return errors;
}

describe("local Supabase static configuration contract", () => {
  it("keeps the repository configuration in the CLI template's auth section with exact local origins", async () => {
    const config = await readFile(resolve(process.cwd(), "supabase/config.toml"), "utf8");

    expect(validateLocalSupabaseConfig(config)).toEqual([]);
  });

  it("rejects an otherwise valid external_url when it is declared outside the auth section", () => {
    const malformedConfig = [
      `external_url = "${canonicalAuthApiUrl}"`,
      "",
      "[auth]",
      `site_url = "${canonicalAppOrigin}"`,
      `additional_redirect_urls = ["${canonicalCallback}"]`,
      "",
      "[analytics]",
      "enabled = false",
    ].join("\n");

    expect(validateLocalSupabaseConfig(malformedConfig)).toContain(
      "auth.external_url must be declared exactly once",
    );
  });
});
