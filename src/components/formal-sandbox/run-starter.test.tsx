import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormalRunStartError } from "./run-starter";

describe("formal Run start errors", () => {
  it("directs users to add explicit resource inputs when the World model is missing", () => {
    const html = renderToStaticMarkup(createElement(FormalRunStartError, { errorCode: "world_model_required" }));

    expect(html).toContain("Add an explicit resource and per-step usage amount before starting.");
    expect(html).toContain('href="/app/reality-profile"');
    expect(html).toContain("Update Reality Profile");
  });

  it("keeps unrelated failures on the locked Graph retry guidance", () => {
    const html = renderToStaticMarkup(createElement(FormalRunStartError, { errorCode: "graph_not_found" }));

    expect(html).toContain("Run could not start: graph_not_found");
    expect(html).toContain("Review the locked Graph and retry.");
  });
});
