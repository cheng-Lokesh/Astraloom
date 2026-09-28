import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LanguageProvider } from "@/components/language-provider";
import { LifeClimateClient } from "./life-climate-client";

describe("Life climate Track B entry", () => {
  it("orients users to the multi-horizon assumption builder without implying a forecast", () => {
    const html = renderToStaticMarkup(
      createElement(LanguageProvider, null, createElement(LifeClimateClient)),
    );

    expect(html).toContain("Long-horizon life-climate paths");
    expect(html).toContain("Choose a 1-, 3-, or 5-year horizon");
    expect(html).toContain("within one theme");
    expect(html).toContain("A conditional scenario, not a prediction");
    expect(html).toContain("Relative stages");
    expect(html).toContain("Reading your saved life structure");
    expect(html).not.toMatch(/trace_id|raw scenario|api[_ -]?key/i);
  });
});
