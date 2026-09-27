import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RealityProfileClient } from "./reality-profile-client";

describe("Reality Profile editor", () => {
  it("renders each review field and keeps unknown as the honest initial state", () => {
    const html = renderToStaticMarkup(createElement(RealityProfileClient));

    expect(html).toContain("生活气候");
    expect(html).toContain("资源");
    expect(html).toContain("限制");
    expect(html).toContain("明确未知");
    expect(html).toContain("保存当前正式链资料");
    expect(html).toContain("disabled");
  });
});
