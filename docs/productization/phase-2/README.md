# Astraloom Productization Phase 2 / Delivery Step 1

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

## UI 与恢复行为

`/app/new/intake` 的“Save scenario”仅保存本地草稿。“Submit formal Track A version”先显示确认，再在用户第二次确认后调用 POST；成功后仅显示正式版本和时间，不显示 UUID 或 trace。失败不会删除本地草稿。登录用户加载页面时才发起只读 GET，并将恢复的正式版本与当前本地表单保持分离。

## 本地验证

```powershell
$env:Path += ';C:\Program Files\Docker\Docker\resources\bin'
$cli = 'C:\Users\clf04\AppData\Local\SupabaseCLI\supabase.exe'
& $cli db reset
& $cli test db --local supabase/tests/phase2_controlled_seed_context_test.sql
& $cli test db --local supabase/tests/phase2_atomic_seed_submission_test.sql
& $cli db lint --local --schema public --level error --fail-on error
npm test -- src/app/api/seed-context/route.test.ts src/lib/seed-context/submitted.test.ts
npm run lint
npm run type-check
```

真实浏览器两账户交叉验收需要在本地 Supabase 或独立非生产 QA 项目执行；不得使用生产项目、服务角色密钥或个人邮件令牌。
