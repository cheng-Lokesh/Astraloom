# Grounded Social Simulation Accuracy Pass 1

## 1. 总结：PARTIAL

当前产品已经具备进行第一轮人工准确性压测的基础链路：本地 Grounded Social Simulation builder 会生成 `GroundedSocialSimulationDraft`，命理层以 `DestinyPersonModifier` 形式接入，`simulateGroundedPaths` 固定输出四条路径，Running 与 Result 页面均能渲染 debug panel。

但是，当前产品还不能直接进入严格意义上的“准确性通过/失败”实验。原因是 builder 目前主要依赖领域关键词和少量 key people 规则，生成的是领域级或角色级节点，例如 `Work organization`、`Migration or relocation system`、`Current decision options`，而 eval cases 期望的是更细粒度的现实节点和压力，例如 `Visa clock`、`External offer`、`Changing requirements`、`Six months of runway`。因此第一轮可以开始做人工审查和记录失败样本，但不能把当前输出当作已经能稳定覆盖 eval cases 的准确性基线。

结论：可以开始“探索性准确性压测”，不应开始“验收型准确性试验”。下一轮应做最小修复，优先补 builder 的事实抽取和低信息门禁，而不是扩展新功能。

## 2. 已通过项

- Eval cases 覆盖面完整：现有 cases 覆盖 career、relationship、collaboration、family、migration、self_direction、low_information，并且每个 case 都定义了 expected reality nodes、pressures、destiny boundaries、path events、uncertainties、forbidden behaviors、acceptance criteria。
- 生成链路存在：`prepareLocalSandboxArtifacts` 依次调用 `buildGroundedRealityModel`、`buildDestinyPersonModifier`、`simulateGroundedPaths`，并保存 `GroundedSocialSimulationDraft`。
- DestinyPersonModifier 结构上没有写入 reality nodes 或 reality pressures。它只返回 decision style、stress response、opportunity response、resource pressure response、relationship pressure response、boundary style、timing sensitivity、confidence、uncertainty notes。
- DestinyPersonModifier 的默认文案明确要求以用户目标和 grounded constraints 为主，并提示 timing 是 color, not fate。
- `simulateGroundedPaths` 固定生成四条路径：`baseline`、`cautious_self`、`decisive_self`、`boundary_adjustment`。
- path events 包含 `realityNodeIds`、`userAction`、`expectedRealityReaction`、`destinyModifierEffect`、`pressureChange`、`informationChange`、`opportunityChange`、`evidenceRefs`、`confidence`，具备人工验收所需的主要字段。
- debug panel 能展示 reality nodes、reality pressures、DestinyPersonModifier、path events、key uncertainties、observable signals 和 overall confidence。
- Running 页面直接渲染 `GroundedSimulationDebugPanel`。
- Result 页面在 technical fold 内渲染 `GroundedSimulationDebugPanel`。
- 低信息路径有一定降级机制：domain 为 `other`、domain confidence 低、无外部节点或 evidence 太少时，path 文案会加入 low-confidence probe 提示。

## 3. 明显失败项

- 当前 builder 不能稳定提取 eval cases 中的具体 expectedRealityNodes。多数情况下只能提取领域级节点和泛化 key people，而不是 case 要求的具体对象、城市、offer、visa、deadline、runway、support terms。
- 当前 builder 不能稳定提取 expectedRealityPressures 的细粒度类型。pressure 主要由 node type 或 keyword rule 推导，无法可靠区分 timing pressure、information gap、resource control、market pressure、competition、emotional pressure 等 case 级压力。
- `expectedRealityNodes` 和 `expectedRealityPressures` 目前只是 fixture 字段，没有执行器或 scorecard 将真实输出与这些字段自动比对。
- 低信息输入没有在 Grounded Social Simulation builder 层明确触发 clarification。clarification readiness 逻辑存在于独立模块，但 Grounded Simulation 生成本身仍可能输出四条 path events，只是降低文案确定性。
- path simulation 过于模板化。它按 domain 选择固定 copy，再代入最多三个 top grounded nodes；它并没有根据 case 中的具体事实生成专门事件。
- debug panel 的中文 copy 当前存在明显 mojibake，中文人工验收体验不可靠。英文字段可用，但中文验收会被乱码干扰。
- debug panel 显示 pressure 的 evidenceRefs count，但没有展开 pressure evidenceRefs 内容；人工追踪压力依据时不如 node 和 path 完整。
- debug panel 未显式展示 `simulationSummary`、`seedContextId`、`destinyProfileId`、`destinyClimateId`、`createdAt`。这些不是准确性判断的核心，但会影响审计复现。

## 4. 每个 eval case 的风险

- `career_boss_delays_resources_continue_or_leave`：PARTIAL。可能抽到 manager/current manager 和 career domain，但 budget、two engineers、six weeks、quarter boundary、market timing 很难分别成为节点或压力。timing pressure 与 resource control 多半会被泛化。
- `career_graduate_japan_or_china_ai_product`：PARTIAL/FAIL。Japan/China、visa clock、business-level Japanese、China network、AI product market 都是核心现实事实；当前 keyword rules 可能抽到 study、career、migration，但不能稳定拆成两个市场、一个 visa institution、一个 network resource。
- `career_external_offer_vs_stable_role`：PARTIAL。offer/new company 可能通过 people extractor 变成 opportunity source，family 可能被抽到，但 role clarity、ten-day deadline、stable current job、manager values me 不会稳定成为独立节点和压力。
- `relationship_ambiguous_contact_unstable_signals`：PARTIAL。relationship domain 可被抽到，`someone` 这类弱 fragment 会被过滤，communication pattern、undefined relationship、one week silence 很难成为独立 information source/constraint/timing pressure。
- `relationship_ex_returns_uncertain_contact`：PARTIAL。ex/relationship domain 可被抽到，八个月、nostalgia message、breakup avoidance history 不会稳定拆成 current message、breakup history 和 timing pressure。好处是模板文案避免 mind-reading。
- `collaboration_partner_promises_no_delivery`：PARTIAL。partner/client/investor/project 关键词可触发 collaboration，但 investor introductions、landing page、pilot customer、two-month non-delivery、reserve more time 不会稳定成为独立节点。存在把 collaboration pressure 误标为 competition 的风险。
- `collaboration_big_client_vague_requirements`：PARTIAL。large client/internal sponsor/budget 可能只被概括为 collaboration opportunity 或 collaborator。changing requirements、case study upside、paid discovery threshold 无法由当前 builder 精准抽取。
- `family_stability_expectation_vs_city_direction_change`：PARTIAL/FAIL。family node 可被抽到，Shanghai/move 可能触发 migration，但 public-sector style job、apartment timing、practical support、product strategy path 不会稳定成为独立节点。domain 也可能在 family、career、migration 之间偏移。
- `family_parent_support_mixed_with_control`：PARTIAL。parents/family 可被抽到，但 down payment、living costs、where I live、acceptable jobs、gift/loan/conditions 不会稳定拆分。resource_control 与 emotional_pressure 会被压成泛化 support/family pressure。
- `migration_city_visa_employment_constraints`：PARTIAL。migration domain 可被抽到，visa 和 city 语义可见，但 Singapore、Tokyo、China 三个分支、language uncertainty、network access、competition、twelve-month plan 不会稳定拆成 distinct nodes/pressures。
- `self_direction_transition_without_external_feedback`：PARTIAL。self_direction/career/collaboration 可能被触发，但 small prototypes、two friends、six months runway、external feedback gap、adjacent roles 不会稳定抽取。runway 作为 resource boundary 会丢失。
- `low_information_user_only_says_lost`：PARTIAL/FAIL。clarification evaluator 能对类似 vague input 判定 needs_clarification，但 Grounded Social Simulation builder 本身会生成 User 节点和可能的 self_direction domain/path events。它会降低信心或加入 broad uncertainty，但没有硬性只问 clarification。

## 5. 当前 builder 抽取能力不足之处

- `extractGroundedDomains` 是领域关键词匹配，不是事实抽取。它只能判断 career/relationship/family/collaboration/study/migration/self_direction 等领域，并生成固定 label 的领域节点。
- `buildGroundedRealityModel` 的节点来源只有四类：User、keyPeople、domain keyword rules、Current decision options、Named worry or constraint。这不足以覆盖 eval cases 里的现实事实清单。
- key people extractor 可以补一些角色，例如 manager、recruiter、family、collaborator，但它仍是角色抽取，不是事件、资源、期限、制度、市场、城市、约束的抽取。
- pressure 生成逻辑主要由 node type 决定。没有 case-level pattern 去识别 `six weeks`、`ten days`、`three months`、`twelve-month plan` 这类 timing pressure；也没有识别 `less role clarity`、`requirements keep changing`、`not confirmed budget` 这类 information gap/resource control 的专门规则。
- evidenceRefs 是存在的，但 evidenceRef 粒度常绑定整段 seed text，不能证明某个具体 expected node 是从哪一句抽出来的。
- builder 没有输出 `shouldAskClarification` 或 equivalent gate。低信息状态只体现在 uncertainty notes、confidence 和 path copy。

## 6. 当前 path simulation 过于模板化之处

- path copy 由 primary domain 决定，同一 domain 下所有 cases 共享大段固定文本。
- path event 只取最多三个 top grounded nodes 作为 anchor，容易遗漏 case 的关键现实节点。
- `baseline`、`cautious_self`、`decisive_self`、`boundary_adjustment` 四条路径存在，但每条路径只是一条 event，缺少真正的多步路径演化。
- `expectedRealityReaction` 通常描述“may clarify”或“should clarify”，不是从具体事实推导出的反应。
- path confidence 由 domain confidence、modifier confidence、node confidence 等上限共同决定，但不直接检查 expected nodes 是否已覆盖。
- 低信息时仍输出四条路径，虽然文案提示 low-confidence probe，但这和 low-information case 的“ask clarification before simulating”期望不完全一致。

## 7. 命理越界风险

当前代码层面的越界风险较低：`buildDestinyPersonModifier` 不写入现实节点或压力，也不直接生成 person、institution、offer、city、visa、client、family fact。

主要剩余风险在输入数据而非本模块本身：`joinSummaries` 会直接引用 `destinyProfile.coreTendencies` 与 `destinyClimate.pressureThemes/opportunityThemes` 的 `userFacingSummary`。如果上游 destiny 文案本身含有现实事实或过强断言，modifier 会原样带入。当前 modifier 没有二次净化或 forbidden behavior 检查。

另一个风险是 Result 页面会把 grounded layer 与 legacy report/run/finding 层一起展示。即使命理 modifier 自身守界，旧层输出如果有更强断言，人工验收需要从 debug panel 分离检查。

## 8. 低信息输入风险

- clarification readiness 模块可以识别 broad/vague input，并返回 `needs_clarification` 和 clarification questions。
- Grounded Social Simulation builder 没有直接调用 readiness 结果，也没有在 draft 中记录 `shouldAskClarification`。
- 对 `I feel lost and do not know what to do.` 这类输入，builder 可能生成 User 节点、self_direction domain 和四条 path events；虽然 confidence 会因低信息下降，但这仍可能被用户看成已经开始“推演”。
- 低信息 case 的验收要求是 clarification 或 low-confidence scaffold。当前更接近 low-confidence scaffold，但缺少明确 clarification gate。
- 出生时间和出生地点缺失时，DestinyPersonModifier 只检查 `destinyBirthInfo` 字符串是否为空；如果字符串包含日期但缺 time/place，是否降级取决于上游如何拼接该字段，不够严格。

## 9. Debug panel 是否足够用于人工验收

结论：英文人工验收基本够用，中文人工验收不够。

足够的部分：

- 能看 nodes 的 label、nodeType、source、role、resources、information、opportunities、constraints、evidenceRefs、confidence。
- 能看 pressures 的 pressureType、source/target、explanation、evidenceRefs count、confidence。
- 能看 modifier 的全部核心字段和 uncertainty notes。
- 能按 branch 展示 path events，并展示 userAction、expectedRealityReaction、destinyModifierEffect、pressureChange、informationChange、opportunityChange、realityNodeIds、confidence。
- 能看 keyUncertainties 和 observableSignals。

不足的部分：

- 中文 copy mojibake，会干扰中文验收。
- pressure evidenceRefs 没有展开原始 ref 列表。
- 没有直接展示 full draft metadata 和 simulationSummary。
- 没有 eval case 对照视图，因此人工验收需要在 fixture 和 panel 之间手动来回比对。
- 没有突出 unsupported nodes 或 missing expected nodes。

## 10. 下一轮最小修复任务

1. 不接 LLM，不新增依赖，先补一个本地 deterministic fact extractor，用规则抽取 expectedRealityNodes 所需的具体事实类型：deadline/time window、offer、visa/institution、city/market、budget/resource promise、family support, external feedback/runway, communication pattern。
2. 给 reality pressure 增加最小规则映射：数字时间/期限 -> `timing_pressure`，unclear/vague/not confirmed/changing -> `information_gap`，budget/resources/support/approval -> `resource_control`，market/competition/language/network -> 对应 `market_pressure`/`competition`/`opportunity_pull`。
3. 在 Grounded Social Simulation draft 中记录低信息状态，或在 builder 前复用 existing clarification readiness；对 `needs_clarification` 输入只生成低置信 scaffold 或明确 clarification path，不生成看似完整的四路径推演。
4. 修复 debug panel 中文 copy mojibake，保证中文人工验收可读。
5. 在 debug panel 展开 pressure evidenceRefs，并展示 `simulationSummary`、`seedContextId`、`destinyProfileId`、`destinyClimateId`、`createdAt`。
6. 增加一个只读 eval runner 或 scorecard 文档脚本，不改变 simulation 逻辑，只把 actual nodes/pressures/path branches 与 eval case expected fields 做人工可读对照。
7. 对 DestinyPersonModifier 增加一层文本边界检查或报告项，标记上游 destiny summaries 是否含有现实事实、确定性结论或第三方意图判断。

## 当前准确性试验是否能开始

可以开始第一轮人工压测，但目标应是“发现并记录当前失败模式”。不能把当前产品声明为已经支持完整的“现实优先 + 命理调权 + 路径演化”准确性验收。

建议本轮开始方式：

- 使用现有 eval cases 逐条跑产品。
- 打开 Running 和 Result 的 debug panel。
- 记录 missing expected nodes、missing expected pressures、unsupported path logic、destiny boundary violations、low-information behavior。
- 本轮不提高 confidence，不改 Claim IDs，不改 evidenceEventIds。

阻止验收型试验的最小问题：

- expectedRealityNodes 细粒度覆盖不足。
- expectedRealityPressures 细粒度覆盖不足。
- low-information 没有硬 clarification gate。
- path simulation 过于模板化，不能证明 case-specific path evolution。
