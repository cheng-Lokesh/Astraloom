# 决策登记册

仅记录本审计确证的冲突和会改变产品边界/成本/安全/不可逆架构的未决项。权威顺序为：`docs/FUTURE_SIMULATOR_V2.md` 先于白皮书 v35；白皮书与 V2 已确认边界冲突时以 V2 为准，代码和测试仅证明当前实现事实。

| Decision ID | 问题 | 白皮书依据 | 仓库现状 | 推荐默认方案 | 影响 | 是否阻断下一阶段 |
|---|---|---|---|---|---|---|
| DEC-CONFLICT-001 | v35 使用“复合玄学/命理/数字灵魂”定位；V2 明确隔离 destiny/birth 信息并禁止命理式产品 | 第 1–4 章，特别第 2 章 | `docs/FUTURE_SIMULATOR_V2.md` 的 Destiny Isolation；`AGENTS.md` 禁止 astrology/fortune-telling | 以 V2 为准：对外产品与 Alpha 采用“现实证据、明确假设、情景沙盘”定位；保留 v35 冲突记录，不改写 v35 | 品牌、输入、文案、模型边界 | **是：阻断面向用户的 Alpha 文案/输入定稿；不阻断 Productization Phase 2 / Delivery Step 1 数据地基** |
| DEC-CONFLICT-002 | 白皮书首版含 Track B、每日气象与较广场景；V2 首域限定职业/协作、30/90 天 | 第 8、12、18、31 章 | `docs/FUTURE_SIMULATOR_V2.md` Confirmed Product Boundaries | Alpha 只做 Track A 职业/协作 30/90 天；Track B/每日气象列为 P2 | MVP 范围、成本、质量 | 否 |
| DEC-CONFLICT-003 | 白皮书工程建议可理解为完整 MVP 顺序；V2 0–8 已验证的是核心而非产品闭环 | 第 18、31 章 | `src/lib/v2/**` 与测试；无 queue/worker 产品接线 | 采用 8 阶段路线图，不把 Core PASS 解释为 Alpha | 项目排期与验收口径 | 否 |
| DEC-PRICE-001 | 首版单次价格、订阅和退款的商业参数未被当前运行证据证明 | 第 19、27、28 章 | checkout/webhook 代码固定 USD 990 cents，但未见受控运行验收 | MVP 前保持单次 `single_simulation_report` 权益模型；价格、地区、退款规则由创始人/法务在 Phase 6 确认 | 商业模式、法律、Stripe 配置 | 否 |
| DEC-LEGAL-001 | 哪些法域/年龄门槛/隐私条款适用需要外部法律复核 | 第 15、23、28、29 章 | 仓库无已批准法律交付物证据 | Alpha 仅限内部受邀与最小数据；Launch 前完成专业法律复核 | 合规与 Launch | 否（阻断 Launch） |

## 下一阶段决策结论

下一阶段没有创始人决策阻断：可先执行 Productization Phase 2 / Delivery Step 1“受控数据地基”。该阶段唯一目标是：让一名已认证的内部测试用户，将确认提交的 Track A SeedContext 安全持久化到带 RLS 的数据层，并能在刷新、退出和重新登录后恢复；两个测试用户之间不能发生任何数据越权。任何面向用户的定位、输入文案、外部邀请或 Alpha 公开描述必须先解决 `DEC-CONFLICT-001`。
