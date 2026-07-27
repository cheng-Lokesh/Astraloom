# 产品化路线图：从 V2 Core 到 Launch

## 为什么是 8 个阶段

白皮书的通用工程阶段已被 V2 Core 部分吸收：证据/假设、动态世界、可复现轨迹、分析、Claims/Reports、校准与迁移异步契约均有测试。本路线图不重复这些纯核心工作，而把剩余的用户闭环风险拆为 8 个可运行增量；每阶段只关闭一个主要风险。

| 阶段 | 里程碑 | 主要风险 | 用户可见结果 | 明确不做 |
|---|---|---|---|---|
| 1 | 受控数据地基 | 无归属/无持久化 | 登录用户可保存并恢复 Track A 输入 | 真实模拟、支付 |
| 2 | 人物与图谱 | 输入不能成为可信生态 | 用户确认人物并看只读来源图 | 自由改边、Track B |
| 3 | 可恢复运行 | 纯引擎无法变成服务 | 可见 queued/running/failed/retry 状态 | 批量频率与付费 |
| 4 | Alpha 证据结果 | 结果不能解释或验收 | Event->Claim->Report 的 Track A Alpha | Track B、公开发布 |
| 5 | MVP 安全质量 | 正确性/隐私不可控 | 安全降级、删除/导出、质量成本可观测 | 真实收款 |
| 6 | MVP 商业与支持 | 收费/支持破坏可信度 | 受控付费解锁、额度、工单 | Beta 扩量 |
| 7 | 封闭 Beta | 未知真实用户风险 | 受邀用户验证与7/30/90复盘 | Launch/国际化 |
| 8 | Launch 运行能力 | 上线不可恢复 | 生产发布、监控、回滚、法务就绪 | Post-MVP 增长扩张 |

## Phase 1：受控数据地基（P0）

- **用户可见结果**：登录用户在一个页面完成 Track A 情境、30/90 天窗口和隐私确认；刷新/重新登录后只能看到自己的草稿。
- **技术目标与数据对象**：部署并验证 `user_profiles`、`seed_contexts`、`consent_events`；将 V2 `EvidenceLedger`/`AssumptionLedger` 接入有 `user_id`、`trace_id`、版本的边界适配层。
- **页面/API/集成范围**：`/login`、`/app/new/scene`、`/app/new/intake`；认证 session、Seed CRUD、RLS 集成测试。
- **前置依赖**：Supabase 项目、环境变量、测试账户；**不做**：人物/Agent/图谱、LLM、支付、真实运行。
- **自动化/手工/Golden**：双用户越权拒绝、session 恢复和 schema migration 测试；手工用两账户交叉验证；Golden：最小 Track A 输入。
- **P0 停止条件**：任意跨用户读取、没有版本/trace、只依赖 localStorage。
- **允许文件范围/分支/提交顺序**：`src/app/login/**`、`src/app/app/new/{scene,intake}/**`、`src/lib/{supabase,seed-context,v2/reality-boundary}/**`、`supabase/migrations/**`、`tests/**`、`docs/**`；分支 `productization/phase-2-data-foundation`；先 migration/contract，再 repository/API，再 UI/tests/docs。
- **下一门槛**：一条已登录 Track A Seed 可持久化、恢复且 RLS 通过。

## Phase 2：人物确认与只读图谱（P0）

- **用户可见结果**：从已保存输入抽取人物；用户确认、合并、删除、重命名后得到不可编辑的来源/置信度图谱。
- **技术目标**：`key_people`、`agent_profiles`、`relation_edges` repository；将 confirmed people 连接 Agent draft；图谱从数据读取。
- **范围**：`/app/new/people`、`/app/new/agents`、`/app/new/graph` 和相应 API；**不做**：运行、付费、关系边编辑、完整 NPC 深扫。
- **验收**：每个节点/边有来源；禁止边权编辑；确认操作保留证据；最小 Golden Case 覆盖 merge/delete。
- **停止条件**：图谱来自 mock 节点，或未经确认的人物进入正式运行输入。
- **允许范围/分支/顺序**：`src/app/app/new/{people,agents,graph}/**`、`src/app/api/{key-people,agents,graph}/**`、`src/lib/{agents,graph}/**`、`supabase/**`、`tests/**`、`docs/**`；`productization/phase-3-people-graph`；contract->repository->API->UI->tests。
- **下一门槛**：一个用户可完成可信、只读的 Agent/Graph 快照。

## Phase 3：异步可恢复运行（P0）

- **用户可见结果**：点击运行后看到队列、运行、失败/重试/完成状态，不重复创建结果。
- **技术目标**：`generation_jobs`、worker、lease、幂等、重试和 V2 trajectory adapter；冻结 Graph/Assumptions。
- **范围**：`/app/simulation/running`、run/events API、队列/worker；**不做**：批量频率 UI、支付、Track B。
- **验收**：同一 idempotency key 不重复 Event；worker 失效可接管；失败有安全错误码与恢复入口；Golden 包含中断重试。
- **停止条件**：浏览器同步长跑、无 lease、无失败恢复。
- **允许范围/分支/顺序**：`src/app/app/simulation/running/**`、`src/app/api/{simulation,events}/**`、`src/lib/{v2,simulation,jobs}/**`、`supabase/**`、`tests/**`、`docs/**`；`productization/phase-4-async-track-a`；job contract->worker->API->UI->failure tests。
- **下一门槛**：一个冻结的 Track A 运行能产生持久化 Event 且失败可恢复。

## Phase 4：证据结果与 Alpha（P0）

- **用户可见结果**：结果页以图谱、事件时间线、Claim 卡和报告呈现可追溯的多路径情景；邀请 5–10 名 Alpha 用户。
- **技术目标**：V2 Claim/Report 接入、evidence anchor、免责声明、真实/模拟双账本展示和 Alpha 验收脚本。
- **范围**：`/app/simulation/result`、report/evidence API、Track A Golden Case；**不做**：Track B、公众发布、真正支付。
- **验收**：每一重要 Claim 跳转至少一个 Event；无事件 Claim 被拒绝；样本频率披露 seed/version/sample/assumption；人工完整闭环通过。
- **停止条件**：报告可脱离 Events 生成，或“模拟”被表示为现实证明。
- **允许范围/分支/顺序**：`src/app/app/simulation/result/**`、`src/app/api/{reports,events}/**`、`src/lib/{v2/claims-reports,reports}/**`、`tests/**`、`docs/**`；`productization/phase-5-alpha-evidence-results`；schema->API->UI->Golden->Alpha runbook。
- **下一门槛**：5–10 名受邀用户的 Track A 完整闭环可人工复验；**Alpha 在本阶段后达成。**

## Phase 5：MVP 安全、隐私与质量（P1）

- **用户可见结果**：高风险输入获得明确降级；用户可请求/完成删除与导出；管理员能审计质量/成本/失败。
- **技术目标**：SafetyVerifier 全路径强制、真实删除/导出 workflow、观测和 Golden Case 门禁。
- **不做**：真实 Stripe 收款、Beta 招募。
- **验收/停止**：所有 23 章风险 cases 不能绕过；删除不静默破坏审计；质量/cost/trace 可查询。安全绕过或无法删除即停。
- **允许范围/分支/顺序**：`src/app/{api/privacy,api/admin,app/safety,app/settings}/**`、`src/lib/{safety,observability}/**`、`supabase/**`、`tests/**`、`docs/**`；`productization/phase-6-mvp-safety-quality`；guard->workflow->UI->red-team tests。
- **下一门槛**：安全、隐私、质量门禁全部通过。

## Phase 6：MVP 商业、额度与支持（P1）

- **用户可见结果**：付费只解锁已有深度；额度/失败补偿清晰；支持工单可受限处理。
- **技术目标**：配置验证后的 Stripe、entitlement、quota/cost cap、退款状态和最小管理员支持面。
- **不做**：增长实验、扩大用户。
- **验收/停止**：webhook 幂等；付款不生成/加强 Claim；免费不做全 NPC 深扫；退款/申诉可追踪。任意安全或权益越权即停。
- **允许范围/分支/顺序**：`src/app/{api/payments,api/support,app/billing,app/support,app/admin}/**`、`src/lib/{payments,entitlements,support}/**`、`supabase/**`、`tests/**`、`docs/**`；`productization/phase-7-mvp-commercial-support`；gates->webhook->entitlement->UI->tests。
- **下一门槛**：完整 MVP 门禁达成；**MVP 在本阶段后达成。**

## Phase 7：封闭 Beta（P2）

- **用户可见结果**：受邀用户收到受控使用、反馈和支持体验。
- **技术目标**：招募/配额、指标面板、7/30/90 回填、通过/回炉/停止决策包。
- **不做**：公开 Launch、Track B/每日气象。
- **验收/停止**：第 26 章质量、安全、成本门槛按周评审；严重安全/成本阈值即停止。
- **允许范围/分支/顺序**：`src/app/{app/dashboard,app/admin}/**`、`src/lib/{calibration,observability}/**`、`supabase/**`、`tests/**`、`docs/**`；`productization/phase-8-closed-beta`；metric contract->instrumentation->review workflow。
- **下一门槛**：封闭 Beta 通过/无阻断；**Beta 在本阶段后达成。**

## Phase 8：Launch 运行能力（P2）

- **用户可见结果**：稳定、可支持、可解释且有事故恢复能力的正式 Web 服务。
- **技术目标**：环境分层、发布/Feature Flag、监控报警、备份/回滚、法务文档与运营值守。
- **不做**：国际化、应用商店、每日气象、Track B（均另立 Post-MVP 立项）。
- **验收/停止**：第 28–29 章清单、发布演练和事故/回滚演练通过；缺任一法务/安全/回滚门禁即停。
- **允许范围/分支/顺序**：部署配置、`.github/**`、`src/lib/observability/**`、`docs/**` 和明确授权的运行文件；`productization/phase-9-launch-ops`；runbook->monitor->flag->drill->release evidence。
- **下一门槛**：**Launch 在本阶段后达成。**
