# MVP 差距登记册

缺口类型中的“开发/集成/服务配置/产品决策/外部准备”可并列。P0 阻断 Alpha 或证据/隐私正确性；P1 是完整 MVP 所需；P2 属于 Beta、Launch 或 Post-MVP。

| Gap ID | 产品层 | 要求 | 当前证据 | 缺口类型 | 严重度 | 依赖 | 目标阶段 | 验收标准 |
|---|---|---|---|---|---|---|---|---|
| PROD-AUTH-001 | 账户 | 真实登录与用户隔离 | 有 login 与 Supabase helper，未有 E2E | 集成、服务配置 | P0 | Supabase 项目/RLS | 1 | 两用户无法读写彼此 Seed/Run；会话过期可恢复 |
| PROD-DATA-001 | 数据 | 已部署 RLS schema/repository | migration 文件存在，未验证远端 | 集成、服务配置 | P0 | Auth | 1 | 迁移可重复执行；所有用户表 RLS 通过/越权拒绝 |
| PROD-INPUT-001 | 输入 | 用户拥有的 Seed 保存/恢复 | 本地页面/类型存在 | 开发、集成 | P0 | Auth、Data | 1 | 登录用户可保存、重新打开、校验 Track A 30/90 日输入 |
| PROD-TRACE-001 | 证据 | 真实/模拟双账本贯穿产品 | V2 only | 开发、集成 | P0 | Data、V2-EVID | 1 | UI 能区分现实来源、假设和模拟事件；每项有 trace/version |
| PROD-PEOPLE-001 | 人物 | 提取后确认/合并/删除/重命名持久化 | route/页面局部存在 | 开发、集成 | P0 | Input、Data | 2 | 人物操作保持 evidence refs；不产生跨用户数据 |
| PROD-AGENT-001 | Agent | confirmed people 驱动 Agent draft | 本地/route draft | 开发、集成、服务配置 | P0 | People、Safety | 2 | user core、分身、每个确认 NPC 均可追溯并落库 |
| PROD-GRAPH-001 | 图谱 | 从 Agent/Edge 生成只读图 | 页面壳/类型 | 开发、集成 | P0 | Agent、Data | 2 | 不可编辑边权；节点/边均有来源与置信度 |
| PROD-API-001 | API | seed/people/graph/run/events 的 auth API | handler 不完整 | 开发、集成 | P0 | Auth、Data | 2 | 稳定错误码、trace、owner check、版本校验覆盖主链 |
| PROD-ASYNC-001 | 运行 | 真队列/worker/lease/retry | 仅 V2 契约 | 开发、服务配置 | P0 | V2-TRAJ、Ops | 3 | job 可排队、取 lease、幂等重试、失败可见且无重复 Event |
| PROD-SIM-001 | 推演 | 冻结输入后 V2 执行并落 Event | 纯核心 | 开发、集成 | P0 | Async、Graph | 3 | seed/engine/version 固定；事件持久化且每次变迁可审计 |
| PROD-RECOVERY-001 | 恢复 | waiting/failed/retry 真状态 | UI only | 开发、集成 | P0 | Async | 3 | 断网/worker 失败可恢复；用户不会重复扣费或产生重复 job |
| PROD-REPORT-001 | 结果 | Event->Claim->Report 和可读锚点 | V2 core/局部页面 | 开发、集成 | P0 | Sim、Data | 4 | 报告无孤立 Claim；证据卡可跳转事件/图谱；有免责声明 |
| PROD-ALPHA-001 | 验收 | 一条真实 Track A E2E | 无端到端证明 | 集成、服务配置 | P0 | 上述 P0 | 4 | 5–10 内测用户按手工脚本完成，Golden Case 与人工验收通过 |
| PROD-SAFETY-001 | 安全 | 所有入口/解锁强制降级 | 局部规则 | 开发、集成 | P1 | 输入、job、支付 | 5 | 23 章高风险案例在输入、job、报告、支付均不可绕过 |
| PROD-PRIVACY-001 | 隐私 | 删除/导出/同意/第三方保护 | 仅 delete request | 开发、外部准备 | P1 | Data、Legal | 5 | 可审计删除/导出；同意版本化；第三方最小化通过测试 |
| PROD-GOLDEN-001 | 质量 | 场景 Golden Case 扩展与门禁 | 8 cases 测试 | 开发 | P1 | Sim、Report | 5 | Track A 的输入/风险/失败 cases 在 CI 稳定运行 |
| PROD-OBS-001 | 观测 | 质量、成本、失败、trace 仪表盘 | 局部 observability | 开发、服务配置 | P1 | Async、LLM | 5 | 可按 run/trace 看 latency、cost、error、quality gate |
| PROD-LLM-001 | 模型 | job 内真实 Provider、版本、重试、回退 | Intake only | 集成、服务配置 | P1 | Safety、Async | 5 | allowlist/gate、schema repair、cost cap 和回退均可验收 |
| PROD-PAY-001 | 商业化 | 权益/配额/退款与实际 Stripe | gated code 无运行证据 | 集成、服务配置、外部准备 | P1 | Auth、Data、Legal | 6 | 签名 webhook 幂等；权益不改变 Claim/风险；退款可追踪 |
| PROD-SUPPORT-001 | 支持 | 管理员最小后台与人工复核 | route/UI 局部 | 开发、集成、外部准备 | P1 | Auth、Privacy | 6 | 管理员最小权限、工单 SLA、申诉和隐私请求闭环 |
| PROD-QUOTA-001 | 成本 | 额度、cost cap、免费预览边界 | 文档/gate 局部 | 开发、产品决策 | P1 | Pay、LLM | 6 | 免费无全 NPC 深扫；每 run 有预算/熔断/可解释扣减 |
| PROD-FEEDBACK-001 | 校准 | 7/30/90 回填与不可改写历史 | V2 core/local | 开发、集成 | P1 | Data、Report | 7 | 反馈只影响后续运行；历史事件/Claims/报告不可改写 |
| PROD-BETA-001 | Beta | 招募、指标、通过/回炉/停止 | 无运行程序 | 产品决策、外部准备 | P2 | 完整 MVP | 7 | 按第 26 章周节奏产出量化、安全、成本决策 |
| PROD-LEGAL-001 | 法务 | 条款、同意、免责声明、地区复核 | 无交付物证据 | 外部准备 | P2 | Privacy、Pay | 8 | 法律复核完成；产品触点与条款版本可追溯 |
| PROD-OPS-001 | 运维 | 环境、监控、告警、flag、回滚 | CI/runtime gate only | 开发、服务配置、外部准备 | P2 | Async、Pay | 8 | 发布演练、回滚演练、事故响应和观察窗口通过 |
| PROD-WEATHER-001 | 增长 | 免费每日气象低成本能力 | 无模块 | 产品决策、开发 | P2 | Quota、Quality | 8 | 不破坏免费成本边界的独立功能/缓存/指标 |
| PROD-TRACK-B-001 | Track B | 长期气候视图 | 无可验收链路 | 产品决策、开发 | P2 | Track A、Quality | 8 | 独立合同/Golden Cases；无确定性日级预测 |
| PROD-EXPORT-001 | 国际化 | 本地化与出海 | 无验收 | 产品决策、外部准备 | P2 | Legal、Ops | 8 | 仅在 Launch 后按第 30 章另立项目 |
| PROD-RELEASE-001 | 上线 | Launch 发布与事故响应 | 无生产演练 | 外部准备、服务配置 | P2 | Legal、Ops、Beta | 8 | 第 29 章发布、报警、回滚、支持门禁完成 |
## Phase 2 / Delivery Step 1 直接更新（2026-07-27）

| Gap ID | 当前状态 | 已验证证据 | 仍阻塞的验收 |
|---|---|---|---|
| PROD-DATA-001 | PARTIAL | 本地 Supabase migration/reset、RLS pgTAP、原子 seed+consent、owner 复合外键、数据库 lint | 独立非生产 QA 项目的实际两账户浏览器交叉读写验证 |
| PROD-AUTH-001 | PARTIAL | API 使用服务端 `getUser()`，数据库测试模拟两位 authenticated 用户并验证隔离 | Magic Link/会话恢复的真实浏览器两账户验收 |
| PROD-INPUT-001 | PARTIAL | 本地草稿与远端正式版本分离；显式确认提交；登录后只读恢复；接口测试 | 真实浏览器验证刷新、退出/重登及失败保留本地草稿 |
