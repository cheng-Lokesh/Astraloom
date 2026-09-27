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
    expect(html).toContain("目标");
    expect(html).toContain("价值观");
    expect(html).toContain("人生主题");
    expect(html).toContain("压力");
    expect(html).toContain("外部变量");
    expect(html).toContain("用于推演的结构化资源");
    expect(html).toContain("新增结构化资源");
    expect(html).toContain("每次受控行动的资源变化量");
    expect(html).toContain("明确未知");
    expect(html).toContain("保存当前正式链资料");
    expect(html).toContain("disabled");
  });
});
