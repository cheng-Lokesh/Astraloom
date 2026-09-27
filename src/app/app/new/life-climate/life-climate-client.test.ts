import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LanguageProvider } from "@/components/language-provider";
import { LifeClimateClient } from "./life-climate-client";

describe("Life climate Track B entry", () => {
  it("orients users to the one-year conditional comparison without implying a forecast", () => {
    const html = renderToStaticMarkup(
      createElement(LanguageProvider, { children: createElement(LifeClimateClient) }),
    );

    expect(html).toContain("One-year life-climate comparison");
    expect(html).toContain("A conditional scenario, not a prediction");
    expect(html).toContain("Four relative stages");
    expect(html).toContain("Reading your saved life structure");
    expect(html).not.toMatch(/trace_id|raw scenario|api[_ -]?key/i);
  });
});
