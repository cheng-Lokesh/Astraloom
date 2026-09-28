import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { LanguageProvider } from "@/components/language-provider";
import ScenePage from "./page";

vi.mock("next/navigation", () => ({ usePathname: () => "/app/new/scene" }));

describe("Track selection on the formal Start page", () => {
  it("provides a direct entry to the bounded multi-horizon Track B flow alongside Track A", () => {
    const html = renderToStaticMarkup(
      createElement(LanguageProvider, null, createElement(ScenePage)),
    );

    expect(html).toContain("href=\"/app/new/life-climate\"");
    expect(html).toContain("Track A");
    expect(html).toContain("Track B");
    expect(html).toContain("1-, 3-, or 5-year");
  });
});
