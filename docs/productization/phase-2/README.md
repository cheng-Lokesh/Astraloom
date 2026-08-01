# Astraloom Productization Phase 2 / Delivery Step 1

## 当前状态

Phase 2 的本地实现和独立验收已完成；当前检查点为
`7f7673c585e0f4278524683c6b8899e86c5803dd`。正式关闭仍待本阶段文档收尾后的
提交、推送，以及本地、upstream 与远端的一致性独立复验。因此，本文件不宣称
Phase 2 已正式关闭，也不授权启动 Phase 3。

完整的脱敏验收摘要见 [acceptance.md](acceptance.md)。

## 交付边界

本阶段只持久化已认证用户显式确认后的 Track A `SeedContext`（30/90 天）及其同意记录。未提交内容始终是浏览器本地草稿；页面加载、登录、刷新和恢复不会自动上传、覆盖或创建远端草稿。

不包含人物确认、Agent、关系图、推演、队列/Worker、LLM、支付或 Track B。正式提交也不会启动推演。

## 已实现的受控契约

- `POST /api/seed-context` 使用严格请求体；`user_id` 等额外字段会被拒绝。
- 路由从 Supabase 会话取得用户，不接受客户端指定归属，并调用唯一的 `submit_seed_context_phase2` 数据库入口。
- 数据库函数是 `SECURITY INVOKER`，不使用 `SECURITY DEFINER`；RLS 继续按调用者身份生效。
- `(user_id, submission_key)` 约束、payload SHA-256、事务级 advisory lock 与同一 SQL 事务中的 consent + seed 插入共同保证幂等与并发原子性。
- 同一用户同一 key 且标准化内容相同返回原提交；内容不同返回 `409 idempotency_key_content_conflict`；不同用户可各自使用相同 key。
- submitted 记录带版本、提交/冻结时间、trace、同意外键及同一 owner 的复合外键约束；浏览器角色不能更新或删除正式 seed/consent。
- `GET /api/seed-context` 只返回当前用户自己的正式版本元数据，不返回 trace，也不会写入任何内容。

## 非技术产品结果与恢复行为

登录用户可以把尚未确认的情境保留为本地草稿；只有明确确认后才会创建正式 Track A 版本。刷新、退出后重新登录时，用户只会恢复自己的正式版本，并且它与当前本地草稿保持分离。

`/app/new/intake` 的“Save scenario”只保存本地草稿。“Submit formal Track A version”先显示确认，再在用户第二次确认后调用 POST；成功后只显示正式版本和时间，不显示标识符或 trace。提交失败不会删除本地草稿。

当前产品还实际提供了专用的幂等冲突提示，帮助用户理解同一提交键对应不同内容时为何不能覆盖既有正式记录。该提示已通过本阶段验收，但不是原始 Phase 2 P0 停止条件。Sign out 是产品控制项而不是本阶段 P0 必需 UI 控件；本阶段要求的是刷新、退出和重新登录后的恢复能力，不以某个特定的退出按钮作为验收前提。

## 独立验收与回归摘要

- 独立验收 28/28 PASS：涵盖浏览器、服务器和数据库三层的幂等、冲突不变性、原子性、跨用户边界、普通用户 RLS、匿名访问拒绝和 local draft 边界。
- 浏览器实测同一用户的正式提交序列为 201、200、409；冲突错误码稳定为 `idempotency_key_content_conflict`，且原记录、哈希、行数不变，没有孤立记录。
- 两份事务回滚 pgTAP 测试合计 17/17 PASS，执行前后既有业务数据的聚合计数不变。
- Phase 2 定向测试、7 个 V2 专项、数据库 lint、lint、type-check、build 与 `npm run check` 均已通过；`src/lib/v2/**` 相对 `productization/phase-1-contract` 保持零差异。
- 聚合测试稳定性修复采用 `fileParallelism: false`：代价是测试文件串行执行、整体更慢；它不改变 timeout、覆盖率阈值、用例或 V2 逻辑。详见 [Phase 2 Aggregate Vitest Stability TDD Evidence](../../testing/phase-2-aggregate-test-stability.tdd.md)。

## 非破坏性复验方式

对已有数据环境的收尾复验应优先使用只读检查、隔离的本地或非生产 QA 环境，以及现有的测试事务回滚能力。不得把会重建本地数据库的重置操作作为当前已有数据环境的默认验收步骤。

真实浏览器两账户交叉验收仅可在本地 Supabase 或独立非生产 QA 项目执行；不得使用生产项目、服务角色密钥或个人邮件令牌。验收输出应只保留脱敏的聚合结论，不记录账户、认证材料、标识符、提交键、请求正文或 trace 正文。
