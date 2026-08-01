# Phase 2 收尾候选验收记录（脱敏）

## Authoritative final result (2026-08-01)

**PASS — Phase 2 is formally closed.** The closing push and independent final
verification completed successfully. Local HEAD, upstream, and
`origin/productization/phase-2-data-foundation` were all
`79cc6970d61eb8695b8cdbbbac68de77059f99ea`; the worktree was clean and
`src/lib/v2/**` remained zero-diff against `productization/phase-1-contract`.
The final `npm run check` and coverage evidence were PASS before this final
three-way check.

The remainder of this file preserves the earlier acceptance evidence and its
then-pending wording as history only. This result does not claim Alpha or MVP
completion.

## 记录用途与状态

本记录汇总 Phase 2 / Delivery Step 1“受控数据地基”的本地实现与独立验收结论，供收尾提交前恢复上下文和复验使用。检查点提交为 `7f7673c585e0f4278524683c6b8899e86c5803dd`。

结论为：**本地实现与独立验收完成；正式关闭待 push + 本地、upstream 与远端一致性独立复验。** 本记录不表示生产部署、真实外部用户、Alpha、MVP 或 Phase 3 已完成或获授权。

本记录刻意不包含账户资料、认证材料、标识符、提交键、请求或响应正文、用户输入、trace 正文、Cookie、token 或任何密钥。

## 阶段范围

- 仅限已认证用户明确确认后的 Track A `SeedContext`（30/90 天）和同意记录。
- 未提交内容保持 local-first，不自动创建、覆盖或上传远端草稿。
- 不包含人物确认、Agent、关系图、推演、队列/Worker、LLM、支付或 Track B；正式提交不启动推演。

## 独立验收：28/28 PASS

| 验收层 | 脱敏结论 |
|---|---|
| 浏览器 | 同一用户的正式提交实测依次得到 201、200、409；冲突错误码稳定为 `idempotency_key_content_conflict`。冲突时既有正式记录、内容哈希和聚合行数不变，未产生孤立记录；专用冲突提示实际存在。 |
| 服务器/API | 同键同内容幂等返回既有提交；同键不同内容稳定映射为 409；不同用户可以各自使用同一提交键；正式提交不会由 local save 触发。 |
| 数据库 | `(user_id, submission_key)`、内容哈希、事务级锁和同一事务中的 consent + seed 写入共同保证原子性。普通用户不能更新或删除正式 seed/consent。 |
| 普通用户 RLS | 两个普通用户的双向读取隐藏，跨用户写入被拒绝；同一 key 的作用域按用户隔离。 |
| 匿名 | 匿名 API、REST 与受保护 RPC 访问均被拒绝。 |
| local draft 与恢复 | 本地保存不触发正式 POST；刷新、退出和重新登录后的恢复只涉及当前用户自己的正式版本，且与本地草稿保持分离。 |

## 数据库事务验证：17/17 PASS

两份现有 Phase 2 pgTAP 事务回滚测试合计 17/17 PASS。测试前后既有业务数据的聚合计数不变，证明验证不会遗留测试写入并支持原子性结论。

## 回归与稳定性

- Phase 2 定向测试、7 个 V2 专项、Supabase 数据库 lint、lint、type-check、build 和 `npm run check` 均已通过。
- 正常 `npm test` 连续 3 次均为 42 个文件、426 个用例 PASS。
- `npm run test:coverage` 连续 2 次均为 42 个文件、426 个用例 PASS；覆盖率为 statements 90.82%、branches 81.21%、functions 95.44%、lines 93.52%。
- 聚合超时已归因为测试文件级并发资源争用。`fileParallelism: false` 让测试文件串行执行，代价是整体更慢；它不改变 timeout、覆盖率阈值、测试用例或 V2 逻辑。
- `src/lib/v2/**` 相对 `productization/phase-1-contract` 保持零差异。

## 范围裁决

- 专用 409 冲突提示已实际实现并通过验收；它不是 Phase 2 原始 P0 停止条件。
- Sign out 是产品控制项，而不是 Phase 2 P0 必需 UI 控件；本阶段要求的是刷新、退出和重新登录后的恢复能力。
- 以上裁决不改变认证、RLS、幂等、原子性、匿名拒绝或数据隔离的安全边界。

## 非破坏性复验原则

对已有数据环境，优先采用只读检查、隔离的本地或非生产 QA 环境，以及现有测试的事务回滚能力。不得把会重建本地数据库的重置操作作为当前已有数据环境的默认验收步骤。任何复验产物应只保留脱敏的聚合结论。
