# Astraloom Product UX North Star

This document defines the product UX north star for Astraloom and audits the current primary app surfaces against it.

## 1. Product Definition

中文：

“Astraloom 会先理解你的现实处境，再用命理气候作为时间视角，推演几种未来路径可能如何展开。”

English:

“Astraloom grounds your real-world situation first, then uses destiny climate as a timing lens to simulate possible future paths.”

Astraloom is a reality-first, destiny-weighted future path simulation tool. It is not a normal fortune-telling product, not a chatbot, not an admin dashboard, and not an RPG game.

The product should feel like a quiet premium consulting tool: a user submits a real case, Astraloom builds a grounded social model, destiny climate adjusts timing and reaction tendencies, and the result shows possible paths with evidence, uncertainty, and observable next signals.

## 2. What Astraloom Is Not

- 不是算命报告
- 不是命理神谕
- 不是聊天机器人
- 不是后台控制台
- 不是 RPG 剧情游戏
- 不是高确定性预测器

UX implication: avoid mystic spectacle, chat-first prompts, console-like operational density, role-play choice loops, and deterministic future wording.

## 3. What Astraloom Is

- 现实信息摄取
- AI 现实节点抽取
- 外部现实来源 grounding
- 命理调权
- 路径演化
- 依据回放
- 不确定性提示

UX implication: every main screen should make the real-world material, reality nodes, path evolution, evidence replay, and uncertainty easier to inspect than internal implementation details.

## 4. User Mental Model

When users enter Astraloom, they should feel:

- 我正在提交一个真实案例
- 系统在读取现实信息
- AI 在帮我抽取现实结构
- 命理只是解释我的反应和时间气候
- 系统把几条路径展开给我看
- 我能看到每个结论的依据

The product should never imply that destiny creates real people, real facts, hidden motives, or guaranteed outcomes.

## 5. Product Tone

Target qualities:

- 可信
- 克制
- 高级
- 安静
- 有现实依据感
- 有沙盘推演感
- 命理存在但不玄幻
- AI 存在但不炫技
- Debug 存在但不压主体验

Copy should prefer: real-world situation, reality material, reality node, grounded pressure, path, simulation, evidence, uncertainty, next observation.

Copy should avoid making "destiny" the main product noun. Destiny is a timing lens and weighting layer, not the core identity.

## 6. Visual Direction

The desired visual system:

- warm ivory background
- soft green accent
- deep ink contrast
- calm source-backed evidence cards
- restrained motion
- premium consulting tool
- not mystical
- not gamified
- not dashboard-like

Practical visual rules:

- Use warm ivory and soft green as calm product signals, not as decorative gradients.
- Use deep ink for hierarchy and confidence, but avoid heavy dark panels becoming the dominant page feeling.
- Evidence cards should read like consulting notes: concise title, source/basis, uncertainty, next observation.
- Motion should show progress or unfolding only; do not use spectacle, stars, glow, tarot, runes, crystals, or magical reveal animations.
- Repeated metrics are allowed only when they support user comprehension. Avoid dashboard-like KPI walls.

## 7. Information Hierarchy

Main view should only show:

- 当前能力状态
- 现实材料 / 现实节点
- 关键路径
- Top findings
- 下一步观察

Folded or secondary areas should contain:

- Debug
- raw event
- technical IDs
- graph details
- evidenceEventIds
- traceId
- modelVersion

Rule: if an item answers "how do we debug the pipeline?", fold it. If it answers "why should I trust or question this path?", keep it available in the main reading path.

## 8. One Core Question Per Page

### Dashboard

Core question:

“这是什么？现在能不能真实推演？我从哪里开始？”

Main content should emphasize:

- product identity in reality-first language
- runtime capability status
- start entry point
- recent/current progress

Avoid:

- destiny-first framing
- dashboard KPI density
- generic marketing hero language

### Start

Core question:

“我要提供什么，才能让推演更可信？”

Main content should emphasize:

- real question / real case description
- optional reality materials
- what improves grounding
- destiny context as optional timing lens

Avoid:

- making birth data feel like the main product input
- long dry questionnaires
- promising that more data guarantees truth

### Running

Core question:

“系统正在如何把现实信息变成沙盘？”

Main content should emphasize:

- reality intake mode
- stages from reality reading to path comparison
- reality nodes / pressures
- path events
- generated evidence count

Avoid:

- RPG-like live choices during the run
- vague loading text
- letting debug panels dominate above core unfolding

### Result

Core question:

“这次推演最重要的发现是什么？为什么可信？哪里不确定？”

Main content should emphasize:

- Top findings
- basis / evidence replay
- reality basis
- destiny weighting
- uncertainty
- next observations

Avoid:

- final-report certainty
- paid-depth language that implies higher truth
- showing IDs before user-readable basis

## 9. Destiny Display Principles

Destiny may only act as:

- 时间气候
- 用户反应倾向
- 压力敏感度
- 机会响应方式
- 边界风格
- 路径调权

Destiny must not:

- 创造现实人物
- 创造现实事实
- 断言某个人一定存在
- 断言未来必然发生
- 抢占现实依据

Required wording pattern:

- Good: "Destiny climate weights how you may react to pressure in this window."
- Good: "This timing lens changes the sensitivity of the path, not the facts of the situation."
- Bad: "Destiny says this person will appear."
- Bad: "This outcome is certain because the chart indicates it."

## 10. Runtime Capability Principles

The whole app must make the current runtime mode visible:

- `local_assumption`
- `manual_reality`
- `ai_reality_intake`
- `external_reality`
- `full_grounded_reality`

Mode rules:

- `local_assumption` cannot be packaged as a real grounded simulation.
- `manual_reality` can say it uses user-provided grounding, but not external sources.
- `ai_reality_intake` can say AI structured the reality intake, but not that it verified external reality.
- `external_reality` can emphasize source-backed context only for the external-source portions.
- `full_grounded_reality` can emphasize source-backed path simulation, while still preserving uncertainty.

The capability banner should remain near the start of Dashboard, Start, Running, and Result. It should be written for users first, with technical labels available but not dominant.

## 11. Forbidden UX Directions

- 不要玄学化
- 不要星空、塔罗、紫色神秘、符文、水晶风
- 不要 RPG 化
- 不要后台化
- 不要把技术 ID 放主视图
- 不要隐藏能力状态
- 不要让命理创造现实
- 不要过度动画
- 不要引入大型 UI 框架

## 12. Current UX Audit

### `/app/dashboard`

Current strengths:

- Shows `RuntimeCapabilityBanner` before the hero, so capability state is visible early.
- Provides a clear start action and sample action.
- Uses the warm ivory / soft green / deep ink visual direction already.

Issues against north star:

- English hero says "birth context and current situation" and CTA says "Start my destiny sandbox"; this still makes destiny feel like the primary product object.
- The page does not yet answer "can it truly run now?" in plain product language beyond the banner.
- "Local progress" is useful, but the page can read slightly like a product dashboard if future metrics are added.

Recommended light fix:

- Reword hero toward "real-world situation first, destiny climate as timing lens."
- Rename CTA language from "destiny sandbox" to "future path sandbox" or "path simulation."
- Keep capability banner above the hero.

### `/app/start`

Current strengths:

- Allows real-world materials, which is central to the north star.
- Explicitly says optional reality materials improve grounding.
- Uses safety boundaries that keep destiny non-deterministic.

Issues against north star:

- Page title and submit CTA still use "destiny sandbox", which over-weights the destiny layer.
- Birth information appears before the real case description. This can make the product feel destiny-first even though the intended model is reality-first.
- Manual Reality Intake is inside a folded section. This is acceptable for low-friction entry, but the page should still make "real materials improve trust" feel central.

Recommended light fix:

- Reword the title to "Start a future path simulation" or "Start your reality-first sandbox."
- Reword the intro to say the real case is primary and birth context is a timing lens.
- In a later UX pass, consider placing the real question before birth context or visually balancing them so the product no longer feels like a birth-chart form.

### `/app/simulation/running`

Current strengths:

- The process stages communicate how the sandbox unfolds.
- `RealityIntakeModeBanner` and `RuntimeCapabilityBanner` are present.
- Destiny climate, real situation, pressure map, path cards, and technical details are separated.
- Technical `traceId` is folded in the right rail, not in the primary flow.

Issues against north star:

- Hero and control copy still start from "destiny climate, current situation text, and possible paths"; reality should come first.
- `GroundedSimulationDebugPanel` is present in the main column as a collapsed details block. This is acceptable, but its title says "debug panel" and appears before the stage list, so it can still feel technical if visually prominent.
- The right rail has a dark technical feel. It is useful, but should not become the dominant visual tone.

Recommended light fix:

- Reorder copy to "reality information -> reality nodes/pressure -> destiny timing lens -> paths."
- Keep the debug panel collapsed by default and below the core unfolding story when possible.
- Preserve technical IDs only inside folded areas.

### `/app/simulation/result`

Current strengths:

- Starts with runtime capability and reality intake mode.
- Prioritizes Top findings, basis inspector, evidence replay, path comparison, situation map, sandbox events, and feedback.
- Technical details, debug panel, `ReportSummary`, event state snapshots, and calibration internals are folded.
- Findings filter out claims without `evidenceEventIds`, preserving report invariants.

Issues against north star:

- Some secondary labels still expose implementation language such as "Agent / Situation map summary" and internal correction fields.
- Feedback advanced areas include target IDs and relation weight labels; these are folded, which is correct, but they should stay out of the main reading path.
- Result can become dense. The first screen should remain Top findings + trust basis + uncertainty, not a full analysis console.

Recommended light fix:

- Keep advanced calibration folded.
- Rename user-facing "Agent" labels to "role model" or "situation role" where they appear outside technical folds.
- Keep IDs, weights, and debug state only inside technical or advanced folds.

### `src/components/app-shell.tsx`

Current strengths:

- Minimal shell, restrained colors, no mystic visual motifs.
- Navigation is simple and does not create a dashboard/admin feeling by itself.

Issues against north star:

- Brand subtitle "Dynamic destiny sandbox" makes destiny the product identity.
- Navigation label "Sandbox" is fine, but the shell does not reinforce reality-first grounding.

Recommended light fix:

- Change subtitle to "Reality-first path simulator" or "Future path simulator."

### `src/components/runtime-capability-banner.tsx`

Current strengths:

- Makes current runtime mode visible across pages.
- Distinguishes source-backed from non-source-backed states.
- Shows DeepSeek, external search, and source availability.

Issues against north star:

- The banner is slightly technical in labels: "Runtime capability", `DeepSeek Reality Intake`, and yes/no availability read like an operations surface.
- `Full source-backed reality` is appropriate only if the underlying state truly has external grounding and should still preserve uncertainty.

Recommended light fix:

- Keep this component prominent.
- In a future copy pass, add user-facing explanations before technical labels, for example "What this run can honestly claim."
- Never let `local_assumption` copy imply source-backed simulation.

### `src/components/grounded-social/grounded-simulation-debug-panel.tsx`

Current strengths:

- Correctly states that reality nodes come from user input or grounded inference, and destiny only weights reactions.
- Keeps detailed reality nodes, pressures, modifier fields, path events, uncertainty, and evidence refs in a collapsible details component.
- Provides the right inspection layer for accuracy and debugging.

Issues against north star:

- The component name and title expose "debug panel" to users. That is acceptable in folded technical areas, but not as a primary surface label.
- It uses many technical field labels such as `nodeType`, `sourceNodeId / targetNodeId`, `destinyModifierEffect`, and `realityNodeIds`.
- In Chinese mode, some technical bilingual labels are acceptable for internal review but should not become the normal user reading path.

Recommended light fix:

- Keep it folded by default.
- Use this component in Running and Result only as an inspection layer, not as the first answer to the page's core question.
- If exposed to broader users later, rename the summary to "Inspect grounding and uncertainty" while keeping raw field names inside deeper nested folds.

## 13. Immediate Non-Goals

This north star does not authorize:

- API logic changes
- destiny calculation changes
- simulation logic changes
- report or claim invariant changes
- Claim ID changes
- `evidenceEventIds` changes
- confidence increases
- payment integration
- new large UI dependencies

## 14. Acceptance Checklist For Future UX Work

Before shipping a UX change, verify:

- Does the first screen explain the real-world case model before destiny?
- Is runtime capability visible?
- Does `local_assumption` stay clearly labeled as limited?
- Are technical IDs folded?
- Can the user see why a finding is plausible and where it is uncertain?
- Does destiny only adjust timing, reaction, pressure sensitivity, opportunity response, boundary style, or path weighting?
- Does the UI avoid mystic, RPG, dashboard, and chatbot cues?
- Are evidence, uncertainty, and next observations more prominent than internal machinery?
