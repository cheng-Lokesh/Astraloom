# 产品交付状态账本

更新日期：2026-10-15
仓库：`C:\Users\clf04\Documents\AI推演\Astraloom-stage2`

产品交付权威是用户确认的固定九阶段路线与当前总控交付目标：持续存在的个人数字生命沙盘，并保留独立、有限且明确授权的 Hypothesis。旧[未来模拟器 V2](FUTURE_SIMULATOR_V2.md)文档在此账本中仅作为已验收 V2 Core 不可变边界的依据；与最新用户计划冲突时，以用户计划为准，但不因此改写 V2 Core。[产品宪章](PRODUCT_CONSTITUTION.md)可作实现约束参考，不覆盖最新用户目标。阶段完成度不以猜测百分比表示；目前九阶段均没有足以证明全阶段完成的独立验收证据，也没有阶段级 PASS 裁决。

## 九阶段状态

| 阶段 | 目标 | 状态 |
|---|---|---|
| 1. 正式沙盘闭环 | 把 Seed、People、Agent、Graph、Track A、Result、History 和 Feedback 接成可恢复的正式账户链。 | 未证明完成。存在正式运行候选代码；本轮没有验证真实 Auth、数据库/RLS、重新登录历史、持久化 Feedback 或完整校准旅程。 |
| 2. “我的沙盘”产品壳 | 首页和导航表达个人数字生命沙盘，并如实呈现当前链、运行、历史和下一步。 | 部分界面/投影候选存在；新用户完整产品旅程及跨设备账户行为未证明。 |
| 3. 完整数字生命建模 | 持续维护可查看、可纠正的 Reality、人物、Agent、关系、资源、限制、假设和 World 模型。 | 14 维档案、声明动作和策略化 World 等局部候选存在；完整模型持续更新与历史不变性旅程未证明。 |
| 4. Track A 近程推演 | 完成 30/90 天多 Agent 运行、事件、路径、证据和可控状态转移。 | 受控动作/关系回应候选存在；完整运行、真实账户接通及用户旅程未证明。 |
| 5. 历史、复盘与校准 | 保存多个不可变 Run，录入现实结果，并让校正只影响下一轮。 | Outcome、纠错和下一 Run 使用候选存在；长期真实复盘与可验证统计校准未完成。 |
| 6. Track B 长期人生气候 | 提供 1/3/5 年、低确定性、粗粒度的长期结构路径比较。 | B1/B2 局部候选存在；完整 Track B 产品与最终验收未证明。 |
| 7. Agent 生态与 What-if Fork | 建立持续记忆、观察/反思、NPC 状态变化、平行路径及可比较 Fork。 | 受控 proposal/transition 能力存在；NPC 自主性、长期 Memory、Fork 全链路未交付。 |
| 8. 安全、隐私、质量与商业支持 | 完成跨用户安全、数据权利、可靠运行、成本、支付和运营能力。 | 局部安全合同与实现存在；数据导出/删除、完整 Ops/商业运行和全量真实验收未完成。 |
| 9. 封闭 Beta、Launch 与最终验收 | 验证真实用户回访、成本、运行、隐私和发布/回滚能力，并独立完成整体验收。 | 未证明启动封闭 Beta、Launch 或最终独立整体验收。 |

## 当前可见实现与证据边界

- 关系回应仍是 `formal-default-planner-v2` 的局部候选：同路径的用户请求之后，NPC 的消极回应只影响该路径首个实际选中的资源分配；基础调整 5%，另有独立确认的 Symbolic 假设时合计最多 10%。本地观察值为 `1 → 0.9`；Symbolic 关闭为 `0.95`，开启为 `0.9`；积极/中性回应不降额。它不改变核心 RNG/抽样身份，但会改变因果事件链，不能据此宣称 Track A 或 Destiny 完成。
- 有关候选的源文件边界见[数字生命规则模型](../src/lib/digital-life/model.ts)、[关系回应授权与解析](../src/lib/formal-planning/relationship-response.ts)、[受控 proposal](../src/lib/formal-planning/proposals.ts)、[安全结果投影](../src/lib/formal-planning/projection.ts)和[结果界面](../src/app/app/simulation/result/frozen-relationship-response.tsx)。相关局部测试包括[关系回应测试](../src/lib/formal-planning/relationship-response.test.ts)、[规划投影测试](../src/lib/formal-planning/projection.test.ts)与[结果组件测试](../src/app/app/simulation/result/frozen-relationship-response.test.ts)。这些是本地代码/合成样本证据，不是已部署或真实账户验收。
- 最近 main/variant 空 trace 的 P1 修复记录：5 项定向测试失败 0，另有实际 Node 探针退出码 0。样本中 main 的三个关系 sample 正常；child 有 9 条 commitment，3 条空 trace 不含主路径关系摘要；将被篡改的 child `activePathKey` 改为 `main` 后，投影会拒绝。该窄证据只支持对应 trace/投影边界，不构成整个规划路径或安全验收。证据见[关系回应运行时专项测试](../src/lib/formal-sandbox/relationship-response.runtime.test.ts)及[规划投影](../src/lib/formal-planning/projection.ts)。
- 2026-10-13 上一批 UI 静态检查覆盖 2 个文件、9 项测试、失败 0；Root 确认 V2 Core 未改变。另有 safe DTO/JSON round-trip、源码检查及 375px 合成 UI 检查。均未验证真实 Auth、RLS、数据库写入或真实用户浏览器旅程。
- 2026-10-13 历史交付快照：提交 `ac491b87a5dcc98ecaea1d1a3584f51dca0694cc` 限定 11 个路径（7 code、3 docs、1 ledger），当时已对 current dev ref 非强制推送，退出码 0；live `ls-remote` 确认远端同为该提交，HEAD/upstream 为 `0/0`，index 为空。Root 在精确 `ac491` HEAD 上隔离 Webpack build 退出码 0、输出 110 pages；production preview `52340`（session `82866`）在 215ms 内 ready。HTTP：首页 200；无效和有效 revision 均为 200 且 `no-store`；未配置时 new correction 的 null client 安全返回 500 且 `no-store`。这些是历史构建/预览证据，不证明 Auth 通过或真实数据库读取；其后功能提交 `0a134be37f72e7767cccd669760dea08ea9c203f` 与文档专用提交 `61947053e4570abe4103cdd9b8308fbcd2ec76fe` 已依次替代该远端点。`ac491` 不代表当前远端或当前 HEAD，也不是本批 current-model-draft 新候选的 build/push 证据。
- 关系回应前向迁移 `20261007153523` 已形成独立 SQL 源码闭环候选，不是数据库 PASS。为保证全新安装能继续到达该前向迁移，仅对旧 `20261007143918` 的一行括号优先级作修正，没有整体重写旧迁移；V2 Core 未改变。SQL 尚未执行数据库。2026-10-13 Docker engine pipe 实时检查为 `False`，因此没有数据库/RLS/持久化验收结论。
- 模型规则来源新接口由 RED `111d43b` 推进至 GREEN `bf115bf8c483af47978ff48d9ae92867556a5000`，已随 `5641c0dc044ea395dc1ac4df25ba3f3ea0e395f1` 推送。实现 helper 的 46 项测试失败 0；4 个文件的 66 项相关回归失败 0，lint 和 TypeScript 检查退出码均为 0。独立复核的 46 项测试失败 0，SDK JSON selector/source/no-confirm/reset 检查未发现新 P1；这些仍是定向证据，不是 DB/RLS 验收。
- 模型规则修订 UI 候选已随 `ac491` 提交并推送：Result 可进入 Start 修订分支，载入服务端草稿、逐项确认，再经 typed Run POST 运行；实际 Core 消费修订规则并生成受控 Event。4 个文件 12 项测试失败 0，lint/TypeScript 退出码均为 0；375px 实际 DOM 中资源量由 `1` 变为 `2`，unknown 请求的 body/key 完全相同。独立 high 窄审查的 7 项命名测试失败 0、未发现 P1。该 UI 不在旧 `5641c0d` build 中，上方精确 `ac491` build 已覆盖；这些证据仍不代表真实 Auth/DB/RLS 或九阶段验收。见[修订测试证据](testing/formal-model-rule-revision.tdd.md)。
- 修订请求的组件 ref 恢复保护保留完整旧 body/key，覆盖组件内 props/来源变化及未知提交响应；整页刷新、退出页面或跨设备后的持久请求恢复尚未证明。当前 source/DOM/实际 Core/合成传输只支持功能候选，未证明 Auth、RLS、真实数据库 JSON-path 读取、原子写入、真实历史保留或 full Fork。实际 RED 行为、未先提交 RED 的限制及精确验证命令见 [修订测试证据](testing/formal-model-rule-revision.tdd.md)。
- `current_model_draft_backend` 本批功能候选已进入功能提交 `0a134be37f72e7767cccd669760dea08ea9c203f`。Root 在该精确功能 HEAD 上执行 Webpack build，exit 0、111 pages；production-mode preview 在 `52340` 端口启动，359ms Ready。首页返回 200；`model_draft=current` 与 invalid 入口均返回 200、`no-store`。未配置 Supabase 时 draft API 返回 500、`no-store`，这只是配置缺失时的 fail-closed 行为，不是 Auth 或数据库验收。Worker 对当前 dev ref 执行精确、非强制 push，exit 0；live `ls-remote` 确认远端同为 `0a134be…`。当时 HEAD/upstream 为 `0/0`、index 为空。上述是功能提交的 build/preview/push 证据；之后的文档专用提交不改变该功能源码，不据此声称其自身已重新构建。

## Current digital-life model draft candidate (2026-10-13)

本批候选在页面显示账户当前模型草稿；支持读取、保存未确认规则、按账户全局 revision 追加、识别 source 是否 stale，并在保存回执后重新读取当前 source。旧 source 的标签与规则只读保留，不按新顺序重新绑定。未知 Save/Run 结果在挂载中的组件引用里保留原请求 body/key 供重试；整页刷新与跨设备恢复未证明。保存本身不创建 Run，也不授权预算或策略。

本批验证时的 RED 基线为 `5ff6fbb4fc9775556ec6f10d635321c3b2fd5df7`，后续 GREEN 功能候选已由功能提交 `0a134be37f72e7767cccd669760dea08ea9c203f` 固定；Root 已在该功能提交上验证 build、preview 和非强制 push，具体结果见上方。此记录描述功能提交验证点，不把后续文档专用提交误记为功能 HEAD。当时的前一历史交付基线是远端 `ac491`；之后功能提交 `0a134be` 已接替其功能基线，文档专用提交 `61947053e4570abe4103cdd9b8308fbcd2ec76fe` 再更新账本，不改变 `0a134be` 的功能源码，也不构成本批完整规则纠正的 build/push 证据。

候选验证记录：backend producer 的两文件定向命令为 `npx vitest run src/lib/digital-life/model-draft.test.ts src/lib/digital-life/model-draft-runtime.test.ts --reporter=verbose`，15 tests PASS，exit 0；independent reviewer 以 `npm test -- src/lib/digital-life/model-draft.test.ts src/lib/digital-life/model-draft-runtime.test.ts` 重跑，15 tests PASS，exit 0。producer 报告 `npx tsc --noEmit` 与本批五路径 ESLint 命令均 exit 0。375px synthetic browser harness exit 0，review scope 内没有可复现 P1。SQL source-parity assertions 的源码哈希为 `B099A7DBCF9F0D303204AE1B17C43CF2CB5A7F44BEAAC508D1405AB64B5AA080`；这是源码识别信息，不代表迁移执行。更完整的命令、RED/GREEN 顺序和范围见[本批 TDD 记录](testing/current-model-draft.tdd.md)。

迁移和新增 pgTAP 案例尚未在数据库执行。Auth/RLS、owner isolation、append-only/CAS 并发、真实跨设备持久化仍 pending。V2 Core 未改变；本批不构成九阶段 PASS、阶段推进或最终独立验收。功能提交的 build/preview/push 已有上述限定证据；文档专用提交只包含本账本，不改变功能源码，也未单独重跑 build。

## Complete current-model rule correction candidate (2026-10-15)

本批扩展当前模型草稿的规则编辑：用户可新增、编辑、显式删除四类现有 typed action；最多维护两个已有平行自我策略，策略在自身路径具备行动后才能保存。同一挂载编辑会话内，行动 key 删除后不复用；整页刷新或新会话后的 key 重用边界尚未证明。前置关系保持同路径、无环并按拓扑顺序整理。删除前显示完整后继行动/策略级联并要求显式确认。信息请求对象限于现有 Graph 中与本人 core 相连的 NPC/group；NPC 回应须显式选择 NPC actor 与其现有锁定关系 edge。改变请求对象不会自动搬移旧 actor/edge；必须显式修复或删除无效规则。此能力不修改 Graph 权重或推断第三方心理。

每次规则变更撤销自身、传递后继及相关策略、预算、Symbolic、outcome 权限的确认；Save 仅存储所有 confirmation=false 的规则，Run 需要全新确认。未知 Save/Run 回执锁定编辑和来源刷新，直到原 body/key 完整重放。新规则能够进入现有 Core typed transition：新增 `amount=2` 的资源分配产生受控 Event；级联删除其前置 NPC 回应规则后，新 bundle 不再包含该回应及下游分配 Event，旧 bundle JSON 保持一致。

本批 GREEN 局部证据：logic helper/runtime 2 files、11 tests PASS；375×812 实际 Chrome 检查渲染真实 React 与 typed browser client，使用 mock HTTP；UI 单文件 3 tests PASS；五文件 19 tests 定向回归 PASS；TypeScript、scoped ESLint exit 0。独立窄审查于 2026-10-15 22:16:10 用时 14.57s，3 files、14 tests PASS、exit 0，未发现可复现 P1。Root 于 23:02:58 以同一 3-target 命令复跑，耗时 21.26s，3 files、14 tests PASS、exit 0。功能已进入 9-path 提交 `d22f89ca3454ee4377655043db4786878db0c484`：精确 HEAD 的隔离 clean Webpack build 为 111/111 pages、exit 0；production preview Ready 321ms；push exit 0 且 live origin 同 SHA、upstream `0/0`、index 空。mock HTTP 不是真实账户验收；未验证 DB/RLS/owner isolation/CAS/跨设备或生产 CSS/页面视觉，也未跑完整 suite。本账本/TDD 的后续文档更新不改变已 build 的功能代码，也不另称 build；本候选仍非完整验收。详细命令与 HTTP 结果见[本批 TDD](testing/complete-model-rules.tdd.md)。

V2 Core、API 与 SQL 合同无变化。九阶段仍均未获正式完成裁决；本候选不代表完整 Fork，也不推进阶段 PASS。

## Environment-condition rules v2 candidate (2026-10-15)

本地候选为环境条件建模与受控事件链。已有 v1 草稿保持 v1，已有 v2 草稿保持
v2；新建未保存草稿可按读取到的 source version 初始化，`signature_v2` 可用时
包括 v2。显式 `GET ...?prepare_version=v2` 另外返回独立、只读的
`preparedSourceContext`，不静默升级已保存草稿；POST 拒绝 query。v1 签名/上下文
及既有 draft/receipt/hash 行为不变；新版本使用独立 `signature_v2`。Save 所有
确认均为 false，Run 需要新确认；未知请求保持原 body/key，真 stale 只允许从
当前 source 建立空草稿，不搬运旧 ordinal。

每 path 最多一个环境条件，占用原有行动名额：30 天为 3，90 天为 6。Reality
原值与不同的替代模拟假设分开表达，不做心理推断。只有实际 selected
condition Event 才触发同 path 的后继 `after_rule` Event。结果按 sample/path
独立区分 `selected`、`not_selected`、`not_triggered`、`not_reached`；候选提前
结束可以未到达，不承诺定时触发。V2 Core、Reality、Graph、RNG 均未修改。

本批功能已固定为提交 `b5b9df35a0e77e8190ce641d12995c55f8e02ef8`
（30 paths，+1173/-65，不含本账本与其他 4 份文档）。四项独立审查发现均已
按窄范围关闭：SQL 变量 ID helper source parity 6/6；UI 两项边界修复通过独立
7 tests；backend Event envelope 绑定修复独立 6 PASS、5 filtered。此前的 RED、
GREEN 与命令证据见[环境条件 TDD 记录](testing/environment-conditions.tdd.md)。
隔离 clean build `npm.cmd run build -- --webpack` 已在固定功能 SHA 上 exit 0
（session 22390；compile 29.0s、TS 52s、111/111 pages 6.4s）；production
preview 在 `127.0.0.1:52340`（session 74224）于 407ms Ready。HTTP：首页 200，
缓存为 `s-maxage`（不是 `no-store`）；`/app/start?model_draft=current` 与无效
入口均为 200、`no-store`。未配置 Supabase 时
`GET /api/sandbox/model-draft?prepare_version=v2` 返回 500、`no-store`，仅证明
缺配置时 fail-closed，不是 Auth/DB 验收。功能提交已精确 push：exit 0，live
origin current dev ref 为 `b5b9df35a0e77e8190ce641d12995c55f8e02ef8`，
upstream `0/0`、index 空。之后的 5-path 文档专用提交不改变该 build 对应的
功能代码，也不单独重跑 build。pgTAP 56 条未在数据库运行。真实
Auth/RLS、DB/CAS、全量 suite、生产 CSS 视觉与九阶段验收仍 pending。本候选
不是阶段 PASS；文档专用提交也不会改变已固定的功能源码。

## 尚未验证的交付门槛

真实账户端到端链、数据库/RLS 与匿名隔离、跨设备恢复、长期反馈校准、完整 Destiny 作用模型、NPC 长期记忆和 Fork、统计回测、导出/删除、运营/支付、封闭 Beta、Launch 及最终独立总验收均未由本账本确认。局部源码、单元测试、合成视口、静态检查或历史构建成功不替代这些门槛。

目前无需用户执行命令行或数据库操作。
