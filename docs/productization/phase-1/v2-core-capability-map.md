# V2 Core 能力映射

证据路径均相对仓库根目录。状态释义遵循本目录 README；`CORE_ONLY` 明确表示可测试核心但尚未形成用户产品闭环。

| 能力 ID | 白皮书要求 | 章节 | 当前状态 | 实现证据 | 测试证据 | 可复用核心 | 尚缺接线 | 目标阶段 |
|---|---|---|---|---|---|---|---|---|
| V2-EVID-001 | 真实证据/假设账本与来源 | 5.4, 10, 21, 24 | CORE_ONLY | `src/lib/v2/reality-boundary/evidence-ledger.ts`; `src/lib/v2/reality-boundary/assumption-ledger.ts`; `src/lib/v2/reality-boundary/local-repository.ts` | `src/lib/v2/reality-boundary/evidence-ledger.test.ts`; `src/lib/v2/reality-boundary/local-repository.test.ts` | Evidence/Assumption 验证和本地仓库 | 用户持久化、API、页面 | 1 |
| V2-WORLD-001 | 动态 Agent、世界状态、受控变迁 | 5.1, 5.3, 24 | CORE_ONLY | `src/lib/v2/agent-world/world-initializer.ts`; `src/lib/v2/agent-world/world-transition.ts` | `src/lib/v2/agent-world/world-transition.test.ts`; `src/lib/v2/agent-world/hardening.test.ts` | 确定性 World transition | 领域适配、数据库、job | 3 |
| V2-TRAJ-001 | 固定 seed 的可复现轨迹 | 5.3, 13.7, 21.11 | CORE_ONLY | `src/lib/v2/trajectory/seeded-rng.ts`; `src/lib/v2/trajectory/trajectory-runner.ts`; `src/lib/v2/trajectory/local-adapter.ts` | `src/lib/v2/trajectory/seeded-rng.test.ts`; `src/lib/v2/trajectory/trajectory-runner.test.ts` | seed/runner/validation | 服务端运行与样本存储 | 3 |
| V2-ANALYSIS-001 | 多轨迹分析、频率、敏感性、干预比较 | 5.5, 13.8–13.9, 21.13 | CORE_ONLY | `src/lib/v2/trajectory-analysis/batch-runner.ts`; `src/lib/v2/trajectory-analysis/clustering.ts`; `src/lib/v2/trajectory-analysis/sensitivity.ts` | `src/lib/v2/trajectory-analysis/trajectory-analysis.test.ts`; `src/lib/v2/trajectory-analysis/hardening.test.ts` | 批处理与特征完整性 | 样本 job、披露 UI、成本控制 | 4 |
| V2-CLAIM-001 | Claim/Report 只从证据消费 | 5.4, 5.7, 13.11, 22 | CORE_ONLY | `src/lib/v2/claims-reports/claim-builder.ts`; `src/lib/v2/claims-reports/report-builder.ts` | `src/lib/v2/claims-reports/claims-reports.test.ts`; `src/lib/v2/claims-reports/boundary.test.ts` | V2 Claim/Report 边界 | Report 数据存储和结果 UI | 4 |
| V2-CAL-001 | 结果回填、回测、校准 | 5.5.5, 16, 20 | CORE_ONLY | `src/lib/v2/outcome-calibration/outcome-capture.ts`; `src/lib/v2/outcome-calibration/backtesting.ts`; `src/lib/v2/outcome-calibration/in-memory-repository.ts` | `src/lib/v2/outcome-calibration/backtesting-calibration.test.ts`; `src/lib/v2/outcome-calibration/forecast-lock.test.ts` | 版本/锁定/校准逻辑 | 用户反馈持久化与运营界面 | 7 |
| V2-MIGRATE-001 | V1 兼容迁移与受控异步执行 | 18, 24.23, 29.14 | CORE_ONLY | `src/lib/v2/migration-async-execution/index.ts` | `src/lib/v2/migration-async-execution/migration-async-execution.test.ts` | 迁移/异步执行契约 | 真队列、lease、worker、监控 | 3 |
| PROD-AUTH-001 | 登录、账户和用户隔离 | 8.1, 10.7, 13.2 | PARTIAL | `src/app/login/page.tsx`; `src/lib/supabase/service-role.server.ts` | 未发现端到端认证验收 | Supabase 客户端和服务端上下文 | 配置验证、会话 E2E、RLS 运行证明 | 1 |
| PROD-INPUT-001 | 情境输入、轨道和时间窗口 | 8.1–8.2, 9.3–9.4, 13.4 | PARTIAL | `src/app/app/new/scene/page.tsx`; `src/app/app/new/intake/page.tsx`; `src/types/seed-context.ts` | `src/lib/golden-cases/full-product-cases.test.ts` | 本地 intake/类型 | 用户拥有的保存 API 与恢复 | 1 |
| PROD-PEOPLE-001 | 提取、确认、删改合并人物 | 8.2, 9.5, 13.5 | PARTIAL | `src/app/api/key-people/extract/route.ts`, `src/app/app/new/people/page.tsx` | `src/lib/validators/key-people-extraction-schema.ts` 的单元引用 | 提取与确认 draft | 持久化确认 API、真实授权链 | 2 |
| PROD-AGENT-001 | 主 Agent、分身、NPC 生成 | 5.1, 8.2, 11.4, 13.5 | PARTIAL | `src/lib/agents/build.ts`; `src/app/api/agents/generate/route.ts` | 未发现 `src/lib/agents/` 的直接单元测试 | 本地/受控 LLM draft 构建 | job、保存、由确认人物消费 | 2 |
| PROD-GRAPH-001 | 有来源的只读关系图 | 5.2, 9.6, 13.6, 17.10 | MOCK_OR_UI_ONLY | `src/app/app/new/graph/page.tsx`, `src/types/relation-edge.ts` | 未发现图谱 API/E2E 测试 | 图谱类型/页面壳 | 从持久化 Agent/Edge 读取、不可编辑验证 | 2 |
| PROD-SIM-001 | Tick、Event、分支与状态变迁 | 5.3–5.4, 13.7–13.9 | CORE_ONLY | `src/lib/simulation/simulation-engine.ts`; `src/lib/simulation/event-policy.ts`; `src/lib/v2/trajectory/trajectory-runner.ts` | `src/lib/simulation/simulation-engine.v1.test.ts`; `src/lib/v2/trajectory/trajectory-runner.test.ts` | V1/V2 确定性引擎 | 冻结输入、真实 job、Event 落库 | 3 |
| PROD-REPORT-001 | 报告、证据锚点、策略卡、免责声明 | 5.7, 13.11, 17.8, 22 | PARTIAL | `src/app/app/simulation/result/page.tsx`; `src/app/api/reports/generate/route.ts` | `src/lib/v2/claims-reports/claims-reports.test.ts` | 证据缺失即拒绝的 route | V2 输出接线、可读证据 UI | 4 |
| PROD-SAFETY-001 | SchemaValidator、SafetyVerifier、风险降级 | 5.3.6, 11.10–11.12, 15, 23 | PARTIAL | `src/lib/safety/safety-verifier.ts`; `src/lib/validators/agent-profile-schema.ts`; `src/app/safety/page.tsx` | 未发现 `src/lib/safety/` 的直接单元测试 | 文本/结构校验和降级 | 每一入口、job、付费的统一强制执行 | 5 |
| PROD-LLM-001 | 真 Provider、Prompt 版本、重试 | 11, 24.21–24.23 | PARTIAL | `src/lib/llm/llm-gateway.ts`; `src/app/api/reality-intake/route.ts` | 未发现 `src/lib/llm/` 的直接单元测试 | DeepSeek Intake 受限调用与回退 | Agent/simulation job 路由、重试/成本账本 | 3 |
| PROD-DATA-001 | DB、RLS、repository、历史记录 | 10, 15.11, 20 | DOCUMENTED_ONLY | `supabase/migrations/0001_initial_schema.sql`, `0001_mvp_core_schema.sql`, `0002_mvp_evidence_chain_contracts.sql` | migration 文本存在；无远端 schema 验收 | 模式/RLS 设计 | 已部署 schema、repository、RLS 集成测试 | 1 |
| PROD-API-001 | API、鉴权、错误码、幂等、版本 | 10.5–10.8, 24.3–24.4 | PARTIAL | `src/app/api/key-people/extract/route.ts`; `src/app/api/agents/generate/route.ts`; `src/app/api/reports/generate/route.ts`; `src/app/api/support/create/route.ts` | route 单元测试零散，未见完整链路 | 部分 handler/validation | seed/graph/simulation/events 完整 API 与 E2E | 2 |
| PROD-ASYNC-001 | 真异步任务、队列、worker、lease、重试 | 10.6, 18, 24.23, 29.14 | MISSING | 仅见 `migration-async-execution` 核心契约 | 同上契约测试 | V2 异步边界 | 队列、worker、lease、重试、死信与操作面 | 3 |
| PROD-RECOVERY-001 | 等待、失败、恢复、重试页 | 9.11, 25.18–25.19 | MOCK_OR_UI_ONLY | `src/app/app/simulation/running/page.tsx` | 未发现 job 失败恢复 E2E | 页面壳 | job 状态机、重试 token、恢复体验 | 3 |
| PROD-PAY-001 | 支付、权益、额度、成本、退款 | 6, 13.12, 19, 27 | PARTIAL | `src/app/api/payments/create-checkout-session/route.ts`; `src/app/api/payments/webhook/route.ts`; `src/lib/payments/stripe.server.ts` | 未发现受控 Stripe 验收 | gated checkout/webhook/idempotency 代码 | 已配置 Stripe、entitlement、退款和成本限制 | 6 |
| PROD-WEATHER-001 | 免费每日气象低成本边界 | 12.2, 19.10, 31.15 | MISSING | 未发现运行模块 | 未发现 | 无 | 产品定义、低成本生成/缓存/配额 | 8 |
| PROD-FEEDBACK-001 | 反馈、修正、7/30/90 复盘 | 5.5.5, 12.5, 16, 20 | CORE_ONLY | `src/lib/calibration/calibration-engine.ts`; `src/lib/v2/outcome-calibration/calibration.ts` | `src/lib/v2/outcome-calibration/backtesting-calibration.test.ts` | 校准与不可改写历史约束 | 真实反馈表、时间任务、运营复盘 | 7 |
| PROD-QUALITY-001 | Golden Cases、质量与成本观测 | 13.16, 14, 16, 24.25 | VERIFIED_IMPLEMENTED | `src/lib/golden-cases/full-product-cases.ts`; `src/lib/observability/audit-event.ts` | `src/lib/golden-cases/full-product-cases.test.ts`；8 个已实现 Golden Cases | 回归集/测试基础 | 生产质量仪表盘与门槛执行 | 5 |
| PROD-PRIVACY-001 | 删除、导出、隐私、同意、第三方保护 | 15, 20.14, 27.9, 28 | PARTIAL | `src/app/api/privacy/delete-request/route.ts`, `src/lib/support/support-repository.ts` | 未发现实际删除/导出验收 | 删除请求和 consent 记录 | 真实可审计删除、导出、保留策略 | 5 |
| PROD-SUPPORT-001 | 客服、工单、管理员最小后台 | 27, 28, 29.24 | PARTIAL | `src/app/api/support/create/route.ts`; `src/app/api/admin/support-tickets/route.ts`; `src/app/app/support/page.tsx` | 未发现真实后台权限 E2E | 支持类型与 route | 持久化、管理员授权、SLA/人工复核 | 6 |
| PROD-OPS-001 | 部署、环境变量、监控、Feature Flag、回滚 | 18.12–18.14, 29 | PARTIAL | `.github/workflows/ci.yml`, `src/lib/server-writers/runtime-gates.ts` | CI 定义；未见生产演练 | CI/runtime gate | 环境分层、监控告警、发布/回滚演练 | 8 |

## 统计

按上表：`VERIFIED_IMPLEMENTED` 1，`CORE_ONLY` 9，`PARTIAL` 12，`MOCK_OR_UI_ONLY` 2，`DOCUMENTED_ONLY` 1，`MISSING` 2。唯一的 VERIFIED 项是回归测试资产，不是完整用户产品功能。
## Phase 2 / Delivery Step 1 更新（2026-07-27）

- `PROD-DATA-001`：由 `DOCUMENTED_ONLY` 提升为 `PARTIAL`。本地 Supabase 已实际执行 migration、RLS、pgTAP 及 lint；提交的 Track A SeedContext 与 consent 具备 owner、版本、冻结时间、trace、幂等和原子性边界。尚未完成独立 QA/生产环境的两账户浏览器验收，因此不能标为 `VERIFIED_IMPLEMENTED`。
- `PROD-API-001`：Phase 2 范围内的 `/api/seed-context` 已具备严格请求校验、会话归属、稳定错误码、owner-scoped idempotency 和版本恢复；people/graph/run/events API 仍属于后续阶段。
- `PROD-INPUT-001`：`/app/new/intake` 已将 local draft 与正式 submitted SeedContext 分离；正式提交是显式双步骤，恢复为登录后的只读 GET，不会自动上传或覆盖草稿。
