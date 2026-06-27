"use client";

import { useEffect } from "react";

import { useLanguage } from "@/components/language-provider";
import type { AppLocale } from "@/lib/i18n";

const commonZh: Record<string, string> = {
  "Start my destiny sandbox": "开始我的命运沙盘",
  "Run visible simulation": "运行可见推演",
  "Regenerate and run": "重新生成并运行",
  "Clear local draft": "清除本地草稿",
  "Current climate rhythm": "当前气候节奏",
  "resource pressure": "资源压力",
  "boundary pressure": "边界压力",
  "information uncertainty": "信息不确定",
  "emotional pull": "情绪牵引",
  "opportunity shift": "机会变化",
  "expression friction": "表达摩擦",
  "self-rhythm": "自我节奏",
  "relationship tension": "关系张力",
  mild: "轻微",
  moderate: "中等",
  strong: "强",
  rising: "上升",
  steady: "稳定",
  easing: "缓和",
  observe: "观察",
  prepare: "准备",
  mixed: "混合",
  act: "行动",
  "Try complete sample": "试用完整示例",
  "Open sample sandbox": "打开示例沙盘",
  "Create sandbox": "创建沙盘",
  "Start a sandbox first.": "请先开始一个沙盘。",
  "Open clarification": "打开追问",
  "Run sandbox": "运行沙盘",
  "Open result": "打开结果",
  "System Readiness": "系统准备度",
  "User-facing mode": "用户可用状态",
  "Source coverage": "来源覆盖",
  "Reality intake": "现实信息读取",
  "External search": "外部搜索",
  "External Reality Search": "外部现实搜索",
  "DeepSeek Reality Intake": "DeepSeek 现实信息摄取",
  "Current capability": "当前能力",
  "What this run can honestly claim": "本轮可以诚实声明的能力",
  "Estimated mode": "预计模式",
  "Timing lens": "时间镜头",
  "Your situation": "你的情况",
  "Start from one message": "从一句话开始",
  "Ready to read": "准备读取",
  Presets: "预设",
  "Situation Relation Map": "处境关系图",
  "Active Modules": "运行模块",
  "Event Ledger": "事件账本",
  "Path Stream": "路径流",
  "CASE SIGNAL": "案例信号",
  "CENTRAL NODE": "中心节点",
  "REAL-TIME": "实时",
  ACTIVE: "可用",
  LIMITED: "受限",
  OFFLINE: "离线",
  VISIBLE: "可见",
  READY: "就绪",
  RUNNING: "运行中",
  STANDBY: "待命",
  "Recent cases": "最近分析",
  Recent: "最近",
  Case: "案例",
  Career: "职业",
  Family: "家庭",
  Partner: "伙伴",
  Resources: "资源",
  Risk: "风险",
  Evidence: "依据",
  "Reality Signal Reader": "现实信号读取",
  "People, pressure, choices": "人物、压力、选择",
  "Path Comparator": "路径对比",
  "Several possible next moves": "几种可能下一步",
  "Evidence Boundary": "依据边界",
  "Source and fallback labels": "来源和降级标记",
  "Timing Lens": "时间镜头",
  "Optional destiny weighting": "可选命理调权",
  "Situation captured": "情况已接收",
  "Sources checked": "来源已检查",
  "Uncertainty preserved": "不确定性已保留",
  "Next signals prepared": "下一步信号已准备",
  waiting: "等待",
  visible: "可见",
  active: "运行中",
  queued: "排队",
  "Continue to Result Sandbox": "继续到依据回放",
  "Current local preview": "当前本地预览",
  "Simple main flow": "简单主流程",
  "Advanced detail pages": "高级详情页",
  "Main path": "主路径",
  Optional: "可选",
  Advanced: "高级",
  Required: "必选",
  Selected: "已选择",
  Ready: "就绪",
  "Full loop": "完整链路",
  "Browser-local only": "仅浏览器本地",
  "Current local data": "当前本地数据",
  "Product boundaries": "产品边界",
  "Safety levels": "安全等级",
  "Account placeholders": "账户占位功能",
  "Open archive": "打开归档",
  "Open support": "打开支持",
  "Local preferences, privacy, and product boundaries.":
    "本地偏好、隐私和产品边界。",
  "Language and region": "语言与地区",
  "English font": "英文字体",
  "Chinese font": "中文字体",
  "Seed Context": "种子上下文",
  Seed: "种子",
  "Key People": "关键人物",
  People: "人物",
  "Agent Profiles": "Agent 画像",
  Agent: "Agent",
  Agents: "Agent",
  "Relation Graph": "关系图",
  Graph: "关系图",
  "Simulation Ticks": "推演 Tick",
  Simulation: "推演",
  Run: "运行",
  Report: "报告",
  "Event Logs": "事件日志",
  EventLog: "事件日志",
  "Claims + Feedback": "发现 + 反馈",
  Claim: "发现",
  "Destiny Profile": "命理画像",
  "Destiny Climate": "命理气候",
  "Current Destiny Climate": "当前命理气候",
  "Destiny-situation process": "命理气候-现实局势流程",
  "Evidence refs": "证据引用",
  "Evidence basis": "依据",
  "Evidence drawer": "证据抽屉",
  "Evidence replay summary": "依据回放摘要",
  "Evidence Replay for selected Finding": "所选关键发现的依据回放",
  "Destiny basis": "命理依据",
  "Real situation basis": "现实处境依据",
  "Dynamic sandbox basis": "动态沙盘依据",
  "Relation changes": "关系变化",
  "Path divergence": "路径分化",
  "Generated clues": "生成线索",
  "Destiny-situation mappings": "命理-处境映射",
  "Finding": "关键发现",
  Findings: "关键发现",
  "Real-world clues": "现实线索",
  "Sandbox events": "沙盘事件",
  "Improve next run": "校准下次沙盘",
  "Current inertia path": "当前惯性路径",
  "Cautious observation path": "谨慎观察路径",
  "Active push path": "主动推进路径",
  "Boundary adjustment path": "边界调整路径",
  "Destiny influence": "命理影响",
  Interaction: "互动",
  "Pressure delta": "压力变化",
  "Generated clue": "生成线索",
  "Source tags": "来源标签",
  confidence: "置信度",
  Confidence: "置信度",
  "risk windows": "风险窗口",
  "opportunity windows": "机会窗口",
  "Decision topic": "决策主题",
  "User free-form situation": "用户自由描述",
  "Extracted people": "提取人物",
  "No saved Destiny Climate was found. The sandbox can still run from real situation evidence, with lower destiny-layer confidence.":
    "没有找到已保存的命理气候。沙盘仍可根据现实处境证据运行，但命理层置信度会更低。",
  "Agents required": "需要先生成 Agent",
  "Build Agent Profiles before opening the relationship ledger.":
    "打开关系账本前，请先生成 Agent 画像。",
  "The graph reads confirmed Agent Profiles and deterministic Relation Edges. It does not create editable customer records or direct edge controls.":
    "关系图读取已确认的 Agent 画像和确定性关系边。它不会创建可编辑客户记录，也不会提供直接编辑边权重的控件。",
  "Review Agent Profiles": "查看 Agent 画像",
  "Situation map details": "处境地图详情",
  "Draft situation map": "处境地图草稿",
  "Inspect the read-only situation map.": "检查只读处境地图。",
  "This optional detail page shows the map behind the destiny sandbox. Nodes come from situation models; edges come from deterministic relation rules, confidence scores, and evidence refs. This is not a CRM.":
    "这个可选详情页展示命理沙盘背后的地图。节点来自处境模型；边来自确定性关系规则、置信度分数和证据引用。这不是 CRM。",
  "Regenerate from upstream facts": "从上游事实重新生成",
  "Supplement facts": "补充事实",
  "Graph lock state": "关系图锁定状态",
  "Locked for simulation": "已为推演锁定",
  "Draft review required": "需要审查草稿",
  Locked: "已锁定",
  Unlocked: "未锁定",
  "Simulation can start from this frozen graph snapshot.":
    "推演可以从这个冻结的关系图快照开始。",
  "Simulation cannot start until this graph is locked.":
    "关系图锁定前不能开始推演。",
  Edges: "关系边",
  "Avg confidence": "平均置信度",
  "Evidence coverage": "证据覆盖",
  "Save draft": "保存草稿",
  "Lock relationship ledger": "锁定关系账本",
  "Continue to simulation": "继续推演",
  "Lock graph to start simulation": "锁定关系图后开始推演",
  "Graph Lock": "关系图锁定",
  "Lock this graph snapshot?": "锁定这个关系图快照？",
  "Keep reviewing": "继续检查",
  "Lock graph snapshot": "锁定关系图快照",
  "Update facts on People page": "到人物页更新事实",
  "This graph is locked for the current run. To change people or relationship facts, update upstream facts and regenerate a new draft graph.":
    "当前推演已锁定这张关系图。若要修改人物或关系事实，请更新上游事实并重新生成草稿关系图。",
  "To change the structure after locking, return to upstream facts and create a new draft graph.":
    "锁定后若要修改结构，请返回上游事实并创建新的草稿关系图。",
  "Relation ledger locked. To change facts, return to People and regenerate the graph.":
    "关系账本已锁定。若要修改事实，请返回人物页并重新生成关系图。",
  "Draft relation ledger saved locally.": "关系账本草稿已保存到本地。",
  "This graph is locked. Update upstream facts first, then create a new draft graph from the flow.":
    "这张关系图已锁定。请先更新上游事实，再从流程中创建新的草稿关系图。",
  "Graph regenerated from current Agent Profiles and upstream facts. Review and lock before simulation.":
    "已根据当前 Agent 画像和上游事实重新生成关系图。请在推演前检查并锁定。",
  "Simulation readiness": "推演准备度",
  "People details": "人物详情",
  "Agent details": "Agent 详情",
  "Map details": "地图详情",
  "Known evidence": "已知证据",
  "Missing fields": "缺失字段",
  "Confirmed people": "已确认人物",
  "Extract people": "提取人物",
  "Confirm people": "确认人物",
  "Save people": "保存人物",
  "No evidence text captured yet.": "还没有捕捉到证据文本。",
  "Birth context": "出生背景",
  "Current question": "当前问题",
  "Sandbox window": "沙盘窗口",
  "Generate destiny sandbox": "生成命理沙盘",
  "Fill sample fields": "填入示例字段",
  "What gets saved locally": "本地会保存什么",
  "Product boundary": "产品边界",
  "Safety check before sandbox generation": "开始分析前的安全检查",
  "Skip destiny": "跳过命理",
  "Destiny skipped": "已跳过命理",
  "Unknown exact time": "不知道准确时间",
  "Birth date": "出生日期",
  "Birth time": "出生时间",
  "Birth place": "出生地点",
  Gender: "性别",
  Skip: "跳过",
  female: "女性",
  male: "男性",
  "30 days": "30 天",
  "90 days": "90 天",
  "1 year": "1 年",
  "3 years": "3 年",
  "5 years": "5 年",
  "What this will create": "接下来会生成",
  "Selected shape": "当前选择",
  Scenario: "场景",
  Output: "输出",
  Mode: "模式",
  "Choose one": "请选择",
  "Events + Findings": "事件 + 发现",
  "Local sandbox": "本地沙盘",
  "Choose one scenario domain": "选择一个场景领域",
  "Career decision": "职业决策",
  "Collaboration tension": "合作张力",
  "Family or partner boundary": "家庭或伴侣边界",
  "Personal direction": "个人方向",
  "Archive": "归档",
  "Archive boundaries": "归档边界",
  "No production database sync is started from Archive.":
    "归档页不会启动生产数据库同步。",
  "Start a scenario": "开始一个场景",
  "Feedback": "反馈",
  Horizon: "时间窗口",
  Billing: "解锁",
  Support: "支持",
  Admin: "管理",
  "Billing question": "账单问题",
  "Support draft saved locally in this browser.":
    "支持草稿已保存到当前浏览器本地。",
  "Open settings": "打开设置",
  "Start another pass": "开始下一轮",
  "Open sample result": "打开示例结果",
  "Sandbox data required": "需要沙盘数据",
  "Generate a local run with sandbox events first.":
    "请先生成一轮包含沙盘事件的本地推演。",
  "Result Sandbox only reads frozen Agents, Relation Edges, simulation ticks, sandbox events, and Findings. Without event evidence, no finding is shown.":
    "结果沙盘只读取已冻结的 Agent、关系边、推演 Tick、沙盘事件和发现。没有事件证据时，不会显示发现。",
  "Result Sandbox only reads frozen Agents, Relation Edges, Simulation ticks, sandbox events, and Findings. Without event evidence, no finding is shown.":
    "结果沙盘只读取已冻结的 Agent、关系边、推演 Tick、沙盘事件和关键发现。没有事件证据时，不会显示关键发现。",
  "Try a complete destiny sandbox sample": "试用完整命理沙盘示例",
  "Open sandbox events": "打开沙盘事件",
  "Needs scenario": "需要场景",
  "Create a situation before confirming people.":
    "确认人物前，请先创建一个处境。",
  "Key People confirmation depends on your scenario question, recent events, and people hints.":
    "关键人物确认依赖你的场景问题、近期事件和人物线索。",
  "Go to intake": "前往输入",
  "Add a situation before generating agents.":
    "生成 Agent 前，请先添加一个处境。",
  "Agent Profiles are local simulation models built from intake context and confirmed people.":
    "Agent 画像是根据输入上下文和已确认人物生成的本地推演模型。",
  "Seed context": "种子上下文",
  "Give the sandbox enough real-world evidence to build useful agents.":
    "给沙盘足够的现实证据，用来生成可用 Agent。",
  "Tell the case in natural language, then add the signals that matter: events, people, options, boundaries, and the comparison you want.":
    "用自然语言描述这个处境，然后补充重要信号：事件、人物、选项、边界，以及你想比较的方向。",
  "context 0%": "上下文 0%",
  "THE SITUATION": "处境",
  "Name the scene and the question.": "为场景和问题命名。",
  "This gives the sandbox a focused starting point instead of a loose pile of notes.":
    "这会给沙盘一个清晰起点，而不是一堆松散笔记。",
  "Situation summary": "处境摘要",
  "Set the scene in your own words: what is happening, why it matters, and which relationship dynamics are involved.":
    "用自己的话说明场景：正在发生什么、为什么重要，以及涉及哪些关系动态。",
  "Add detail": "添加细节",
  "In a few sentences, describe the scene, why it matters, and what relationship dynamics are involved.":
    "用几句话描述场景、它为什么重要，以及涉及哪些关系动态。",
  "Main question": "核心问题",
  "Give the run one concrete question so Track A or Track B knows what to compare.":
    "给这轮推演一个具体问题，让路径 A 或路径 B 知道要比较什么。",
  "Example: Should I accept the new role now, or stay and ask for a clearer promotion timeline?":
    "示例：我应该现在接受新岗位，还是留下并要求更清晰的晋升时间线？",
  "Context completeness": "上下文完整度",
  "EVIDENCE": "证据",
  "Anchor the case in recent signals and people.":
    "用近期信号和人物锚定这个案例。",
  "Enough structure helps the next page extract people and preserve the evidence chain.":
    "足够结构能帮助下一页提取人物，并保留证据链。",
  "CONTEXT QUALITY": "上下文质量",
  "Situation": "处境",
  "Question": "问题",
  "Events": "事件",
  "Options": "选项",
  "Risks": "风险",
  "Boundaries": "边界",
  "Next useful details": "下一步可补充信息",
  "Add a little more scene context and why the decision matters.":
    "再补充一点场景背景，以及这个决策为什么重要。",
  "Add recent events, deadlines, changed behavior, or concrete evidence.":
    "补充近期事件、截止时间、行为变化或具体证据。",
  "Name the people or roles that shape this sandbox.":
    "写出影响这个沙盘的人物或角色。",
  "Recent events anchor evidence. Key People become candidates. Options, risks, and boundaries keep the sandbox focused.":
    "近期事件能锚定证据。关键人物会成为候选对象。选项、风险和边界能让沙盘保持聚焦。",
  "The next page can extract people from this richer context after you save.":
    "保存后，下一页可以从更完整的上下文中提取人物。",
  "Back to dashboard": "返回仪表盘",
  "Back to report": "返回报告",
  "Local sandbox history and drafts.":
    "本地沙盘历史和草稿。",
  "Archive reads the browser-local Astraloom ledger: scenario, agents, read-only graph, simulation events, evidence-backed claims, and feedback. It does not connect to production storage.":
    "归档读取浏览器本地 Astraloom 账本：场景、Agent、只读关系图、推演事件、有证据支持的发现和反馈。它不会连接生产存储。",
  "Your archive will fill in after the first scenario is saved.":
    "保存第一个场景后，归档会自动填充。",
  "Start from scene setup. Once local data exists, this page will show drafts and history cards without creating production records.":
    "请从场景设置开始。有本地数据后，此页面会显示草稿和历史卡片，不会创建生产记录。",
  "Mock entitlement": "模拟权益",
  "Mock paid unlock": "模拟付费解锁",
  "MOCK PAID UNLOCK": "模拟付费解锁",
  "Unlock complete evidence depth without changing the report claims.":
    "解锁完整证据深度，但不改变报告发现。",
  "Unlock full evidence depth for this report":
    "为此报告解锁完整证据深度",
  "This local mock does not connect to any payment gateway and does not collect money. It only grants a local paid_report entitlement for the current report id.":
    "这个本地模拟不会连接任何支付网关，也不会收款。它只会为当前报告 ID 授予本地 paid_report 权益。",
  "Complete Event Log chain": "完整事件日志链",
  "Complete event log chain": "完整事件日志链",
  "Complete Event Log Chain": "完整事件日志链",
  "Complete chain": "完整链路",
  "Full involved Agent list": "完整相关 Agent 列表",
  "Relation before/after delta": "关系前后变化",
  "Branch comparison": "路径对比",
  "Strategy options": "策略选项",
  "Paid unlock reveals the complete event chain and strategy depth. It does not represent a certain prediction, does not improve a prediction accuracy score, and cannot bypass safety restrictions.":
    "付费解锁只展示完整事件链和更深策略信息。它不代表确定预测，不会提升预测准确率，也不能绕过安全限制。",
  "CURRENT STATE": "当前状态",
  "free preview": "免费预览",
  "paid report": "付费报告",
  "claim_id count": "claim_id 数量",
  "Mock unlock paid report": "模拟解锁付费报告",
  "Reset local entitlement": "重置本地权益",
  "Entitlement ledger": "权益账本",
  "Current report gate": "当前报告门槛",
  "Free preview": "免费预览",
  "Paid report": "付费报告",
  "all preview": "全部预览",
  "Safety": "安全",
  "Needs Agent Profiles": "需要 Agent 画像",
  "Needs Relation Graph": "需要关系图",
  "Graph lock required": "需要锁定关系图",
  "NPC required": "需要 NPC",
  "Edges required": "需要关系边",
  "Save usable Agent Profiles before running the simulation.":
    "运行推演前，请先保存可用的 Agent 画像。",
  "Simulation runs can only freeze confirmed Agent Profiles. The flow cannot jump directly from intake text to a report.":
    "推演只能冻结已确认的 Agent 画像。流程不能从输入文本直接跳到报告。",
  "Lock the scenario graph before running simulation ticks.":
    "运行推演 Tick 前，请先锁定场景关系图。",
  "The local tick engine must freeze a locked Relation Graph before it writes Event Logs. Return to the graph, review the read-only edges, and lock the snapshot.":
    "本地 Tick 引擎必须先冻结已锁定的关系图，才能写入事件日志。请回到关系图，检查只读关系边并锁定快照。",
  "Save and lock the read-only relation graph before running ticks.":
    "运行 Tick 前，请先保存并锁定只读关系图。",
  "The local tick engine freezes Relation Edges, writes Event Logs, and keeps before/after snapshots for evidence review.":
    "本地 Tick 引擎会冻结关系边、写入事件日志，并保留前后快照用于证据复核。",
  "Simulation is paused for safety": "推演因安全原因暂停",
  "Back to situation setup": "返回处境设置",
  "Back to sandbox events": "返回沙盘事件",
  "Add at least one confirmed NPC before running ticks.":
    "运行 Tick 前，请至少添加一个已确认的 NPC。",
  "The simulation needs a user model and at least one confirmed NPC so Event Logs can connect agents through Relation Edges.":
    "推演需要一个用户模型和至少一个已确认 NPC，这样事件日志才能通过关系边连接 Agent。",
  "The locked graph needs at least one Relation Edge.":
    "已锁定的关系图至少需要一条关系边。",
  "Empty ticks cannot produce Event Logs, and Claims cannot be built from empty ticks.":
    "空 Tick 不能产生事件日志，发现也不能从空 Tick 中生成。",
  "Concrete fixes": "具体修复",
  "Confirm Key People so candidates become usable actors.":
    "确认关键人物，让候选对象成为可用参与者。",
  "Generate Agent Profiles for the user core, parallel selves, and confirmed NPCs.":
    "为用户核心、平行自我和已确认 NPC 生成 Agent 画像。",
  "Return here after the Agent Profile surface shows a saved ecology.":
    "Agent 画像页面显示已保存生态后，再回到这里。",
  "Open Agent Profiles": "打开 Agent 画像",
  "Review the read-only Relation Graph for missing actors or edges.":
    "检查只读关系图，确认是否缺少人物或关系边。",
  "Use regenerate from upstream facts if Agent Profiles changed.":
    "如果 Agent 画像已变化，请从上游事实重新生成。",
  "Lock the graph snapshot before opening the simulation process.":
    "打开推演流程前，请先锁定关系图快照。",
  "Lock Relation Graph": "锁定关系图",
  "Open Relation Graph and generate edges from the current Agent Profiles.":
    "打开关系图，并根据当前 Agent 画像生成关系边。",
  "Confirm the graph is not empty.": "确认关系图不是空的。",
  "Lock the graph so the simulation can freeze a stable snapshot.":
    "锁定关系图，让推演可以冻结稳定快照。",
  "Open Relation Graph": "打开关系图",
  "Return to Key People and confirm at least one person.":
    "回到关键人物页，并至少确认一个人。",
  "Regenerate Agent Profiles so confirmed people become NPC agents.":
    "重新生成 Agent 画像，让已确认人物成为 NPC Agent。",
  "Regenerate and lock the Relation Graph before running again.":
    "再次运行前，请重新生成并锁定关系图。",
  "Confirm Key People": "确认关键人物",
  "Regenerate the Relation Graph from current Agent Profiles.":
    "从当前 Agent 画像重新生成关系图。",
  "Check that the user core and NPC agents both exist.":
    "检查用户核心和 NPC Agent 是否都存在。",
  "Lock the regenerated graph before starting simulation.":
    "开始推演前，请锁定重新生成的关系图。",
  "Admin/Ops": "管理 / 运维",
  "Minimal support operations console": "最小支持运维控制台",
  "Ops can review ticket metadata, generation failures, and safety appeals. This console does not expose unnecessary sensitive input text and cannot modify Claim or EventLog records.":
    "运维可以查看工单元数据、生成失败和安全申诉。此控制台不会暴露不必要的敏感输入文本，也不能修改 Claim 或 EventLog 记录。",
  "Admin token": "管理令牌",
  "All tickets": "全部工单",
  "Generation failures": "生成失败",
  "Safety appeals": "安全申诉",
  "Load queue": "加载队列",
  TICKETS: "工单",
  Tickets: "工单",
  FAILURES: "失败",
  Failures: "失败",
  APPEALS: "申诉",
  Appeals: "申诉",
  DELETE: "删除",
  "Ticket queue": "工单队列",
  "Enter the admin token to load the protected support queue.":
    "请输入管理令牌以加载受保护的支持队列。",
  Refresh: "刷新",
  "No tickets in this view.": "当前视图没有工单。",
  "Support tickets loaded. Sensitive source text is hidden.":
    "支持工单已加载。敏感来源文本已隐藏。",
  "Admin observability": "管理可观测性",
  "Observability": "可观测性",
  "Operational health": "运行健康",
  "Recent events": "近期事件",
  "System status": "系统状态",
  "Acceptance": "验收",
  "Acceptance dashboard": "验收仪表盘",
  "Run acceptance": "运行验收",
  "Golden cases": "Golden Cases",
  "Billing unlock boundary": "解锁边界",
  "Local billing preview": "本地解锁预览",
  "Unlock report": "解锁报告",
  "Payment is not active in this local MVP.":
    "本地 MVP 未启用支付。",
  "Archive reads the browser-local Astraloom ledger: scenario, agents,":
    "归档读取浏览器本地 Astraloom 账本：场景、Agent、",
  "Start from scene setup. Once local data exists, this page will show":
    "请从场景设置开始。有本地数据后，此页面会显示",
  "Feedback saved from Result Sandbox will appear here.":
    "结果沙盘中保存的反馈会显示在这里。",
  "Privacy and local data": "隐私与本地数据",
  "Clear browser-local drafts": "清除浏览器本地草稿",
  "Clear local drafts": "清除本地草稿",
  "Keep data": "保留数据",
  "Type CLEAR LOCAL DATA": "输入 CLEAR LOCAL DATA",
  stored: "已保存",
  empty: "为空",
  "Account export, production deletion, billing receipts, and team settings are not active in this local MVP screen.":
    "账户导出、生产删除、账单收据和团队设置在这个本地 MVP 页面中尚未启用。",
  "Support center": "支持中心",
  "Support request": "支持请求",
  "Save local draft": "保存本地草稿",
  "Submit local ticket": "提交本地工单",
  "Load draft": "加载草稿",
  "Delete draft": "删除草稿",
  "Related simulation ID": "相关推演 ID",
  "Describe what happened": "描述发生了什么",
  "Email is optional for local MVP.": "本地 MVP 中邮箱是可选项。",
  "Billing questions are placeholders in local MVP. This screen":
    "本地 MVP 中账单问题仍是占位功能。此页面",
  "Advanced structure review": "高级结构检查",
  "Situation model details": "处境模型详情",
  "Inspect extracted people and roles when you want to audit the situation model.":
    "当你想审计处境模型时，检查提取出的人物和角色。",
  "Review user core, parallel selves, and NPC agent drafts with source confidence.":
    "查看用户核心、平行自我和 NPC Agent 草稿及来源置信度。",
  "Inspect the read-only relation map and evidence refs behind the sandbox.":
    "检查沙盘背后的只读关系图和证据引用。",
  "No local sandbox yet": "还没有本地沙盘",
  "Last local sandbox": "上一次本地沙盘",
  "Continue last sandbox": "继续上一次沙盘",
  "Open complete sample": "打开完整示例",
  "Sample sandbox": "示例沙盘",
  "Open sample": "打开示例",
  "Continue": "继续",
  "Next": "下一步",
  "Back": "返回",
  "Cancel": "取消",
  "Save": "保存",
  "Delete": "删除",
  "Submit": "提交",
  "Review": "查看",
  "Inspect": "检查",
  "Queued": "已排队",
  "Blocked": "已阻断",
  "Paused": "已暂停",
  "Complete": "完成",
  "Not ready": "未就绪",
  "No data yet.": "还没有数据。",
  "No local data yet.": "还没有本地数据。",
  "No saved run was found.": "没有找到已保存的推演。",
  "No report was found.": "没有找到报告。",
  "No simulation events found.": "没有找到推演事件。",
  "No findings yet.": "还没有发现。",
  "No draft": "没有草稿",
  "Back to start": "返回开始页",
  "Short clarification": "简短追问",
  "A few details would make this sandbox clearer.":
    "补充几个细节会让这个动态沙盘更清晰。",
  "Answer any useful question below, or skip and continue with lower confidence. This is not a long questionnaire.":
    "回答下面任何有用的问题，或跳过并以较低置信度继续。这不是一份长问卷。",
  "Ready to continue.": "可以继续。",
  "This sandbox is ready enough to run. You can continue now.":
    "这个沙盘已经足够运行。你现在可以继续。",
  "Continue after answering": "回答后继续",
  "Skip and run with lower confidence": "跳过并以较低置信度运行",
  "Answer at least one clarification, or skip and run with lower confidence.":
    "请至少回答一个追问，或跳过并以较低置信度运行。",
  "Local save failed. Please try again.": "本地保存失败。请重试。",
  "Skipped clarification; continue with lower confidence.":
    "已跳过追问；将以较低置信度继续。",
  "Local support drafts and safe requests.": "本地支持草稿和安全请求。",
  "This page records local support tickets and drafts. It does not execute refunds, payments, production deletion, or admin actions.":
    "此页面记录本地支持工单和草稿。它不会执行退款、支付、生产删除或管理操作。",
  "Request details": "请求详情",
  "Keep only the context needed for support. Avoid unnecessary private source text.":
    "只保留支持所需的上下文，避免不必要的私密原文。",
  "editing draft": "正在编辑草稿",
  "new draft": "新草稿",
  "Ticket type": "工单类型",
  "Subject": "主题",
  "Related report id": "相关报告 ID",
  "Related simulation id": "相关推演 ID",
  "Message": "消息",
  "Short issue title": "简短问题标题",
  "Describe the issue. Local support tickets store only a short preview in summaries.":
    "描述问题。本地支持工单只会在摘要中保存简短预览。",
  "Save local ticket": "保存本地工单",
  "Clear form": "清空表单",
  "Local submitted tickets": "本地已提交工单",
  "Saved local tickets will appear here with a short preview and tracking code.":
    "保存后的本地工单会在这里显示简短预览和追踪码。",
  Drafts: "草稿",
  "Save a draft if you need to come back before submitting.":
    "如果提交前还要回来继续编辑，可以先保存草稿。",
  "Untitled draft": "未命名草稿",
  Edit: "编辑",
  Remove: "移除",
  "Draft loaded for editing.": "草稿已载入，可继续编辑。",
  "Local support draft removed.": "本地支持草稿已移除。",
  "Billing questions are placeholders in local MVP. This screen cannot issue payments, refunds, or receipt changes.":
    "本地 MVP 中账单问题仍是占位功能。此页面不能发起支付、退款或收据变更。",
  "Safety Caution": "安全谨慎",
  "Safety Adjusted": "安全已调整",
  "Safety Paused": "安全暂停",
  Caution: "谨慎",
  Adjusted: "已调整",
  "Safety wording is tightened": "安全措辞已收紧",
  "Safety mode adjusted this run": "本轮已进入安全调整模式",
  "This flow is paused for safety": "此流程因安全原因暂停",
  "The sandbox can continue, with careful wording and evidence-linked claims.":
    "沙盘可以继续，但会使用谨慎措辞，并保持关键发现与证据相连。",
  "Astraloom can still show structure, evidence, and low-risk communication options, but it keeps stronger output unavailable.":
    "Astraloom 仍可展示结构、证据和低风险沟通选项，但会隐藏更强输出。",
  "This scenario includes content that Astraloom should not simulate into actions, claims, or report depth.":
    "此场景包含 Astraloom 不应推演成行动、关键发现或报告深度的内容。",
  "What changed": "发生了什么变化",
  "Next steps": "下一步",
  "The run avoids deterministic language.": "本轮会避免确定性语言。",
  "Claims stay tied to Event Logs and confidence levels.":
    "关键发现会继续绑定事件日志和置信度。",
  "Private thoughts or certain outcomes are not treated as facts.":
    "不会把他人私密想法或确定结果当成事实。",
  "Continue the flow if the scenario is framed as relationship dynamics.":
    "如果场景围绕关系动态展开，可以继续流程。",
  "Add observed events or boundaries if something feels too broad.":
    "如果内容太宽泛，请补充已观察事件或边界。",
  "High-risk strong claims are hidden.": "高风险强断言已隐藏。",
  "Full-depth or paid-depth expansion cannot bypass this state.":
    "完整深度或付费深度不能绕过此状态。",
  "The page focuses on relationship structure and low-risk options.":
    "页面会聚焦关系结构和低风险选项。",
  "Revise the situation setup if the request was broader than intended.":
    "如果请求范围超出原意，请修改处境设置。",
  "Keep the scenario focused on observable events and relationship structure.":
    "让场景聚焦可观察事件和关系结构。",
  "Contact support if this safety adjustment seems too restrictive.":
    "如果这个安全调整过于限制，可以联系支持。",
  "Simulation ticks, strong claims, and report rendering stay unavailable.":
    "推演 Tick、强断言和报告渲染将保持不可用。",
  "Full-depth or paid-depth access remains unavailable for this run.":
    "本轮完整深度或付费深度访问仍不可用。",
  "Existing local context can still be revised from the setup page.":
    "现有本地上下文仍可从设置页面修改。",
  "Return to setup and remove action requests that cross safety boundaries.":
    "返回设置并移除越过安全边界的行动请求。",
  "Reframe the scenario around observable relationship structure.":
    "围绕可观察的关系结构重新表述场景。",
  "Use support if you want a safety review of the downgrade.":
    "如果想复核降级结果，可以使用支持入口。",
  "Revise setup": "修改设置",
  "Request safety review": "请求安全复核",
  "View safety gate": "查看安全门",
  "Immediate safety language": "即时安全语言",
  "Violence or threat language": "暴力或威胁语言",
  "Stalking or following": "跟踪或尾随",
  "Surveillance or hidden recording": "监控或隐蔽录音录像",
  "Partner monitoring": "伴侣监控",
  "Medical decision area": "医疗决策领域",
  "Legal decision area": "法律决策领域",
  "Investment or debt decision area": "投资或债务决策领域",
  "Clinical or therapy area": "临床或治疗领域",
  "Minor safety concern": "未成年人安全关注",
  "Revenge or exposure request": "报复或曝光请求",
  "Coercive action request": "强制行动请求",
  "Private-thought certainty request": "私密想法确定性请求",
  "Certainty wording": "确定性措辞",
  "Guaranteed outcome wording": "保证结果措辞",
  "Evidence-backed result sandbox": "有依据支持的结果沙盘",
  "This result reads stored Findings only, and Findings come from sandbox events. Full depth can expand evidence and strategy detail, but it does not change finding direction, confidence, or risk level.":
    "此结果只读取已保存的关键发现，关键发现来自沙盘事件。完整深度可以展开依据和策略细节，但不会改变发现方向、置信度或风险等级。",
  "finding ids": "发现 ID",
  "preview findings": "预览发现",
  "evidence shown": "已显示依据",
  "locked depth": "锁定深度",
  "preview signal": "预览信号",
  "Select a Finding to inspect sandbox event evidence.":
    "选择一个关键发现来检查沙盘事件依据。",
  "This finding is shown only because sandbox events contain matching evidence. Result copy does not create independent conclusions.":
    "此关键发现之所以显示，是因为沙盘事件包含匹配依据。结果文案不会创建独立结论。",
  "branch": "路径",
  "participants": "参与者",
  "situation map edges": "处境地图关系边",
  "causes": "原因",
  "Tick": "Tick",
  "Trust foundation": "信任基础",
  "Conflict pressure": "冲突压力",
  Dependency: "依赖",
  Attraction: "吸引",
  Competition: "竞争",
  "Information gap": "信息差",
  "Resource control": "资源控制",
  "Emotional debt": "情绪负债",
  "No generated clues.": "没有生成线索。",
  "high confidence": "高置信度",
  "moderate confidence": "中等置信度",
  "low confidence": "低置信度",
  "weak signal": "弱信号",
  "Multiple evidence refs and strong agent policy signals support this event.":
    "多个证据引用和较强 Agent 策略信号支持此事件。",
  "Some evidence supports this event, but agent parameters are the primary driver.":
    "有部分证据支持此事件，但主要驱动来自 Agent 参数。",
  "This event is primarily policy-generated with limited direct evidence. Treat as a possible scenario, not a likely one.":
    "此事件主要由策略生成，直接证据有限。请把它视为一种可能场景，而不是高概率结果。",
  "Very limited evidence. This event is almost entirely policy-generated. Treat as a weak signal only.":
    "证据非常有限。此事件几乎完全由策略生成，只应视为弱信号。",
};

const originalText = new WeakMap<Text, string>();
const originalAttribute = new WeakMap<Element, Record<string, string>>();
const ignoredTags = new Set([
  "CODE",
  "KBD",
  "PRE",
  "SAMP",
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
  "INPUT",
]);

const phraseZh: Array<[string, string]> = [
  ["Run visible simulation", "运行可见推演"],
  ["Regenerate and run", "重新生成并运行"],
  ["Clear local draft", "清除本地草稿"],
  ["Current climate rhythm", "当前气候节奏"],
  ["Current climate", "当前命理气候"],
  ["Destiny-situation process", "命理气候-现实局势流程"],
  ["Dynamic interaction cards", "动态互动卡片"],
  ["Run summary", "运行摘要"],
  ["Gate checklist", "安全门检查清单"],
  ["Complete Event Log and Claims first", "请先完成事件日志和关键发现"],
  ["Complete Event Log", "完成事件日志"],
  ["Event Log evidence", "事件日志依据"],
  ["Technical tick queue", "技术 Tick 队列"],
  ["Real Situation Structure", "现实局势结构"],
  ["Destiny themes mapped to people and pressures", "命理主题映射到人物和压力"],
  ["resource pressure", "资源压力"],
  ["boundary pressure", "边界压力"],
  ["information uncertainty", "信息不确定"],
  ["emotional pull", "情绪牵引"],
  ["opportunity shift", "机会变化"],
  ["expression friction", "表达摩擦"],
  ["self-rhythm", "自我节奏"],
  ["relationship tension", "关系张力"],
  ["Energy and attention may feel more claimed by practical commitments.", "精力和注意力可能更容易被现实承诺占用。"],
  ["External expectations and personal limits may need clearer separation.", "外部期待和个人边界可能需要更清楚地区分。"],
  ["Some important facts may still be incomplete, so early conclusions should stay flexible.", "一些重要事实可能还不完整，所以早期判断需要保持弹性。"],
  ["The situation may carry a stronger emotional current than the surface facts show.", "这个局势可能带有比表面事实更强的情绪流动。"],
  ["A changing condition may open a new route, especially if evidence is gathered before acting.", "变化中的条件可能打开新的路径，尤其是在行动前先收集证据时。"],
  ["What wants to be said and what is useful to say may need careful timing.", "想说的话和适合说的话之间，可能需要更谨慎的时机。"],
  ["The user's internal pace may need protection from outside urgency.", "用户自己的节奏可能需要避免被外部紧迫感推着走。"],
  ["Unspoken expectations between people may become more visible in the sandbox.", "人与人之间未说清的期待，可能会在沙盘中变得更可见。"],
  ["This climate can amplify observable signals, but it is not a deterministic prediction.", "这段气候可能放大可观察信号，但不是确定性预测。"],
  ["This climate can amplify pressure early, so the useful rhythm is to observe repeated signals before narrowing the path.", "这段气候可能在早期放大压力，所以有用的节奏是先观察重复信号，再收窄路径。"],
  ["Later in the window, compare which signals persisted in sandbox events rather than treating the first signal as decisive.", "在窗口后段，可以比较哪些信号在沙盘事件中持续出现，而不是把第一个信号当成决定性依据。"],
  ["Worth observing where this repeats in people, timing, or sandbox events.", "值得观察它是否在人、时机或沙盘事件中重复出现。"],
  ["Worth observing whether this appears in the current question, relation map, and event log.", "值得观察它是否出现在当前问题、关系图和事件日志中。"],
  ["tends to shape this climate", "倾向于塑造这段命理气候"],
  ["may indicate an opening to inspect", "可能提示一个值得检查的窗口"],
  ["may indicate relationship expectations becoming more visible", "可能提示关系期待正在变得更可见"],
  ["This does not describe private intent", "这不是在描述他人的私下意图"],
  ["it points to observable signals worth comparing", "它指向值得比较的可观察信号"],
  ["Watch for concrete timing signals before treating it as useful.", "在把它视为有用信号前，先观察具体时机证据。"],
  ["what happened", "发生了什么"],
  ["who is involved", "涉及谁"],
  ["destiny influence", "命理影响"],
  ["real-world pressure", "现实压力"],
  ["information/resource change", "信息/资源变化"],
  ["generated clue", "生成线索"],
  ["observation signals", "观察信号"],
  ["decision rhythm", "决策节奏"],
  ["no events yet", "还没有事件"],
  ["events generated", "个事件已生成"],
  ["events inspected", "个事件已检查"],
  ["not loaded", "未加载"],
  ["mappings", "个映射"],
  ["shown", "个已显示"],
  ["Running", "运行中"],
  ["Complete", "完成"],
  ["Event Log ready", "事件日志已就绪"],
  ["Draft only", "仅草稿"],
  ["blocked", "已阻止"],
  ["done", "已完成"],
  ["running", "运行中"],
  ["waiting", "等待中"],
  ["ready", "就绪"],
  ["fix needed", "需要修复"],
  ["Watch destiny climate enter the real situation.", "观察命理气候如何进入现实局势。"],
  ["Astraloom reads the current climate, maps it to real people and pressures, runs local interaction events, compares path divergence, and prepares findings only after Event Logs are saved.", "Astraloom 会读取当前命理气候，将它映射到真实人物和压力，运行本地互动事件，比较路径分化，并且只在事件日志保存后准备关键发现。"],
  ["Reading destiny climate", "读取命理气候"],
  ["Structuring the real situation", "整理现实局势"],
  ["Mapping destiny themes to key people", "将命理主题映射到关键人物"],
  ["Simulating key interactions", "推演关键互动"],
  ["Comparing path divergence", "比较路径分化"],
  ["Preparing integrated findings", "准备综合关键发现"],
  ["Bring the Destiny Profile and Current Destiny Climate into the sandbox as symbolic context, not fate.", "将命理画像和当前命理气候作为象征性上下文带入沙盘，而不是命运结论。"],
  ["Read the current question, key people, constraints, and observable pressure from the saved local setup.", "从已保存的本地设置中读取当前问题、关键人物、限制条件和可观察压力。"],
  ["Connect climate themes to real people and pressure roles while keeping symbolic context separate from evidence.", "把气候主题连接到真实人物和压力角色，同时保持象征性上下文与证据分离。"],
  ["Run local branch interactions and save Event Logs before any findings are prepared.", "运行本地分支互动，并在准备关键发现前保存事件日志。"],
  ["Compare the current inertia, cautious observation, active push, and boundary adjustment paths for pressure shifts.", "比较当前惯性、谨慎观察、主动推进和边界调整路径中的压力变化。"],
  ["Prepare findings only from saved Event Logs and evidence_event_ids for the Result Sandbox.", "只根据已保存的事件日志和 evidence_event_ids 为结果沙盘准备关键发现。"],
  ["The visible process starts with climate and situation structure, then moves through fusion, interactions, path divergence, and evidence-backed findings.", "可见流程从命理气候和现实局势结构开始，然后进入融合、互动、路径分化和有证据支撑的关键发现。"],
  ["Internal deterministic ticks remain available for audit, but the primary sandbox view is the destiny-situation process above.", "内部确定性 Tick 仍可用于审计，但主要沙盘视图是上方的命理-现实局势流程。"],
  ["The same Situation Map is compared across four internal branch IDs. Labels are user-facing; the saved branch IDs remain stable for evidence and reports.", "同一张现实局势图会在四个内部分支 ID 中比较。标签面向用户；保存的分支 ID 会为证据和报告保持稳定。"],
  ["Shows how pressure may move if the current pattern continues without a strong self-variant tilt.", "展示如果当前模式继续、且没有明显自我变体倾斜，压力可能如何移动。"],
  ["Models slower movement, more observation, and extra sensitivity to missing information.", "模拟更慢的推进、更多观察，以及对缺失信息更敏感的路径。"],
  ["Models more direct movement and tests whether information gaps or resource pressure ease or rise.", "模拟更直接的推进，并测试信息缺口或资源压力是缓和还是上升。"],
  ["Models setting a clearer time box, boundary, or alternative option so the situation shifts from passive waiting to controlled choice.", "模拟设置更清楚的时间框、边界或替代选项，让局势从被动等待转向可控选择。"],
  ["Information gap change is available in Event Log details.", "信息缺口变化可在事件日志详情中查看。"],
  ["Each card shows what happened, who is involved, the destiny influence, pressure changes, and one generated clue for inspection.", "每张卡片显示发生了什么、涉及谁、命理影响、压力变化，以及一条可检查的生成线索。"],
  ["Saved Event Logs stay available for audit. Findings are prepared only after these events exist and preserve evidence_event_ids.", "已保存的事件日志会保留用于审计。只有这些事件存在并保留 evidence_event_ids 后，才会准备关键发现。"],
  ["These mappings are symbolic-to-situation context. They do not claim certainty about people or outcomes.", "这些映射是从象征主题到现实局势的上下文，不会对人物或结果作确定判断。"],
  ["No saved fusion mappings are available yet. Run preparation can continue from the Situation Map and Event Logs.", "还没有已保存的融合映射。运行准备仍可从现实局势图和事件日志继续。"],
  ["Run the visible simulation to generate interaction cards.", "运行可见推演以生成互动卡片。"],
  ["Current inertia path", "当前惯性路径"],
  ["Cautious observation path", "谨慎观察路径"],
  ["Active push path", "主动推进路径"],
  ["Boundary adjustment path", "边界调整路径"],
  ["situation pressure", "局势压力"],
  ["destiny climate", "命理气候"],
  ["real situation", "现实局势"],
  ["integrated simulation", "综合推演"],
  ["Information gap pressure", "信息缺口压力"],
  ["Resource pressure", "资源压力"],
  ["Pressure stayed mostly steady in this interaction.", "这次互动中的压力基本保持稳定。"],
  ["No saved Destiny-Situation Fusion theme is attached, so this event is shown from real situation and interaction evidence only.", "没有附加已保存的命理-现实局势融合主题，所以此事件仅根据现实局势和互动证据显示。"],
  ["Agent Profiles", "Agent 画像"],
  ["Agent Profile", "Agent 画像"],
  ["Relation Edges", "关系边"],
  ["Relation Edge", "关系边"],
  ["Key People", "关键人物"],
  ["NPC agents", "NPC Agent"],
  ["confirmed NPCs", "已确认 NPC"],
  ["parallel selves", "平行自我"],
  ["user core", "用户核心"],
  ["simulation ticks", "推演 Tick"],
  ["Simulation runs", "推演运行"],
  ["simulation", "推演"],
  ["Simulation", "推演"],
  ["report", "报告"],
  ["Report", "报告"],
  ["Result Sandbox", "结果沙盘"],
  ["Sandbox only reads", "沙盘只读取"],
  ["only reads", "只读取"],
  ["frozen Agents", "已冻结的 Agent"],
  ["local run", "本地推演"],
  ["sandbox events", "沙盘事件"],
  ["event evidence", "事件证据"],
  ["Without event evidence", "没有事件证据时"],
  ["Without", "没有"],
  ["no finding is shown", "不会显示发现"],
  ["finding is shown", "会显示发现"],
  ["sandbox history", "沙盘历史"],
  ["history cards", "历史卡片"],
  ["browser-local", "浏览器本地"],
  ["Archive reads", "归档读取"],
  ["Astraloom ledger", "Astraloom 账本"],
  ["scenario", "场景"],
  ["agents", "Agent"],
  ["feedback", "反馈"],
  ["It does not connect", "它不会连接"],
  ["Start from scene setup", "请从场景设置开始"],
  ["Once local data exists", "有本地数据后"],
  ["this page will show", "此页面会显示"],
  ["drafts", "草稿"],
  ["without creating", "不会创建"],
  ["read-only graph", "只读关系图"],
  ["evidence-backed claims", "有证据支持的发现"],
  ["production storage", "生产存储"],
  ["production records", "生产记录"],
  ["payment gateway", "支付网关"],
  ["collect money", "收款"],
  ["current report id", "当前报告 ID"],
  ["complete evidence depth", "完整证据深度"],
  ["Complete", "完整"],
  ["chain", "链路"],
  ["before/after", "前后"],
  ["delta", "变化"],
  ["complete event chain", "完整事件链"],
  ["strategy depth", "策略深度"],
  ["certain prediction", "确定预测"],
  ["prediction accuracy score", "预测准确率分数"],
  ["safety restrictions", "安全限制"],
  ["locked", "已锁定"],
  ["active", "已启用"],
  ["unchecked", "未检查"],
  ["CURRENT STATE", "当前状态"],
  ["current state", "当前状态"],
  ["evidence refs", "证据引用"],
  ["Evidence refs", "证据引用"],
  ["deterministic inference", "确定性推断"],
  ["upstream facts", "上游事实"],
  ["relationship ledger", "关系账本"],
  ["graph snapshot", "关系图快照"],
  ["sandbox events", "沙盘事件"],
  ["Event Logs", "事件日志"],
  ["Findings", "发现"],
  ["Finding", "关键发现"],
  ["Claim", "关键发现"],
  ["EventLog", "事件日志"],
  ["confidence", "置信度"],
  ["risk signals", "风险信号"],
  ["support signals", "支持信号"],
  ["Destiny Climate", "命理气候"],
  ["Destiny Profile", "命理画像"],
  ["real-world clues", "现实线索"],
  ["Real-world clues", "现实线索"],
  ["real situation", "现实局势"],
  ["Real situation", "现实局势"],
  ["dynamic sandbox", "动态沙盘"],
  ["Dynamic sandbox", "动态沙盘"],
  ["adjustable variables", "可调整变量"],
  ["Adjustable variables", "可调整变量"],
  ["calibrate next sandbox", "校准下次沙盘"],
  ["Calibrate next sandbox", "校准下次沙盘"],
  ["Evidence replay", "依据回放"],
  ["evidence replay", "依据回放"],
  ["Seed Context", "种子上下文"],
  ["Key People", "关键人物"],
  ["Relation Graph", "关系图"],
  ["Simulation", "推演"],
  ["Result", "结果"],
  ["current run", "当前推演"],
  ["usable actors", "可用参与者"],
  ["scenario question", "场景问题"],
  ["recent events", "近期事件"],
  ["Recent events anchor evidence", "近期事件锚定证据"],
  ["Key People become candidates", "关键人物会成为候选对象"],
  [
    "Options, risks, and boundaries keep the sandbox focused",
    "选项、风险和边界让沙盘保持聚焦",
  ],
  ["extract people from this richer context", "从更完整的上下文中提取人物"],
  ["after you save", "在你保存后"],
  ["people hints", "人物线索"],
  ["intake context", "输入上下文"],
  ["confirmed people", "已确认人物"],
  ["local simulation models", "本地推演模型"],
  ["saved ecology", "已保存生态"],
  ["read-only edges", "只读关系边"],
  ["stable snapshot", "稳定快照"],
  ["local", "本地"],
  ["Local", "本地"],
  ["draft", "草稿"],
  ["Draft", "草稿"],
  ["locked", "已锁定"],
  ["Locked", "已锁定"],
];

const patternZh: Array<[RegExp, (...groups: string[]) => string]> = [
  [
    /^Current climate is led by (.+)\. (.+) This climate can amplify observable signals, but it is not a deterministic prediction\.$/,
    (theme, summary) =>
      `当前命理气候主要由${destinyTermZh(theme)}带动。${destinySentenceZh(summary)}这段气候可能放大可观察信号，但不是确定性预测。`,
  ],
  [
    /^(.+) tends to shape this climate\. (.+)$/,
    (theme, summary) =>
      `${destinyTermZh(theme)}倾向于塑造这段命理气候。${destinySentenceZh(summary)}`,
  ],
  [
    /^(.+) can amplify pressure in this window\. (.+) Worth observing where this repeats in people, timing, or sandbox events\.$/,
    (theme, summary) =>
      `${destinyTermZh(theme)}可能在这个窗口放大压力。${destinySentenceZh(summary)}值得观察它是否在人、时机或沙盘事件中重复出现。`,
  ],
  [
    /^(.+) may indicate an opening to inspect\. (.+) Watch for concrete timing signals before treating it as useful\.$/,
    (theme, summary) =>
      `${destinyTermZh(theme)}可能提示一个值得检查的窗口。${destinySentenceZh(summary)}在把它视为有用信号前，先观察具体时机证据。`,
  ],
  [
    /^(.+) may indicate relationship expectations becoming more visible\. This does not describe private intent; it points to observable signals worth comparing\.$/,
    (theme) =>
      `${destinyTermZh(theme)}可能提示关系期待正在变得更可见。这不是在描述他人的私下意图，而是指向值得比较的可观察信号。`,
  ],
  [
    /^(.+) is (mild|moderate|strong) and (rising|steady|easing)\. Worth observing whether this appears in the current question, relation map, and event log\.$/,
    (theme, intensity, direction) =>
      `${destinyTermZh(theme)}为${destinyTermZh(intensity)}，趋势${destinyTermZh(direction)}。值得观察它是否出现在当前问题、关系图和事件日志中。`,
  ],
  [
    /^decision rhythm: (prepare|observe|act|mixed)$/,
    (rhythm) => `决策节奏：${destinyTermZh(rhythm)}`,
  ],
  [
    /^(mild|moderate|strong) \/ (rising|steady|easing)$/,
    (intensity, direction) =>
      `${destinyTermZh(intensity)} / ${destinyTermZh(direction)}`,
  ],
  [
    /^(.+) is used as symbolic context for this event through (.+)\. This does not make the path certain\.$/,
    (theme, person) =>
      `${destinyTermZh(theme)}通过${person}作为此事件的象征性上下文使用。这不会让路径变成确定结果。`,
  ],
  [
    /^(.+) interact around (.+)\. (.+)$/,
    (people, theme, summary) =>
      `${people}围绕${destinyTermZh(theme)}发生互动。${simulationSentenceZh(summary)}`,
  ],
  [
    /^(.+) maps to (.+) as (.+)\.$/,
    (theme, person, role) =>
      `${destinyTermZh(theme)}映射到${person}，角色是${destinyTermZh(role)}。`,
  ],
  [
    /^(Information gap pressure|Resource pressure) stayed steady in this event\.$/,
    (label) => `${destinyTermZh(label)}在此事件中保持稳定。`,
  ],
  [
    /^(Information gap pressure|Resource pressure) (increased|eased) by (\d+) in this branch event\.$/,
    (label, direction, amount) =>
      `${destinyTermZh(label)}在此分支事件中${direction === "increased" ? "上升" : "缓和"}了 ${amount}。`,
  ],
  [
    /^([a-zA-Z ]+) ([+-]\d+)$/,
    (label, delta) => `${destinyTermZh(label)} ${delta}`,
  ],
  [
    /^(\d+)% context score$/,
    (score) => `${score}% 上下文评分`,
  ],
  [
    /^(\d+) mappings$/,
    (count) => `${count} 个映射`,
  ],
  [
    /^(\d+) shown$/,
    (count) => `${count} 个已显示`,
  ],
  [/^Step (\d+)$/, (step) => `步骤 ${step}`],
  [/^Saved: (.+)$/, (date) => `已保存：${date}`],
  [/^Locked (.+)$/, (date) => `锁定于 ${date}`],
  [/^Save failed: (.+)$/, (code) => `保存失败：${code}`],
  [/^(\d+) events$/, (count) => `${count} 个事件`],
  [/^(\d+) branches$/, (count) => `${count} 条路径`],
  [/^(\d+) of (\d+) edges include evidence refs\. (\d+) edges? (?:uses|use) deterministic inference from Agent Profiles\.$/, (withEvidence, total, inferred) => `${total} 条关系边中有 ${withEvidence} 条包含证据引用。${inferred} 条关系边使用来自 Agent 画像的确定性推断。`],
  [/^Locking freezes (\d+) agents and (\d+) relation edges as the local simulation input\. The graph remains inspectable, but edge weights stay read-only\.$/, (agents, edges) => `锁定会将 ${agents} 个 Agent 和 ${edges} 条关系边冻结为本地推演输入。关系图仍可检查，但边权重保持只读。`],
];

const disabledZhTables = [commonZh, phraseZh, patternZh];
void disabledZhTables;

function destinyTermZh(value: string) {
  const normalized = value.trim();
  const terms: Record<string, string> = {
    "resource pressure": "资源压力",
    "boundary pressure": "边界压力",
    "information uncertainty": "信息不确定",
    "emotional pull": "情绪牵引",
    "opportunity shift": "机会变化",
    "expression friction": "表达摩擦",
    "self-rhythm": "自我节奏",
    "relationship tension": "关系张力",
    "situation pressure": "局势压力",
    "resource pressure holder": "资源压力相关方",
    "boundary counterpart": "边界相关方",
    "information holder": "信息相关方",
    "emotional counterpart": "情绪相关方",
    "opportunity counterpart": "机会相关方",
    "expression counterpart": "表达相关方",
    "Information gap pressure": "信息缺口压力",
    "Resource pressure": "资源压力",
    "trust foundation": "信任基础",
    "conflict pressure": "冲突压力",
    dependency: "依赖",
    attraction: "吸引",
    competition: "竞争",
    "information gap": "信息缺口",
    "resource control": "资源控制",
    "emotional debt": "情绪负担",
    mild: "轻微",
    moderate: "中等",
    strong: "强",
    rising: "上升",
    steady: "稳定",
    easing: "缓和",
    prepare: "准备",
    observe: "观察",
    act: "行动",
    mixed: "混合",
  };

  return terms[normalized] ?? normalized;
}

function simulationSentenceZh(value: string) {
  let next = destinySentenceZh(value);
  const replacements: Array<[string, string]> = [
    [
      "Pressure stayed mostly steady in this interaction.",
      "这次互动中的压力基本保持稳定。",
    ],
    [
      "Information gap pressure stayed steady in this event.",
      "信息缺口压力在此事件中保持稳定。",
    ],
    [
      "Resource pressure stayed steady in this event.",
      "资源压力在此事件中保持稳定。",
    ],
  ];

  for (const [from, to] of replacements) {
    next = next.replaceAll(from, to);
  }

  return next;
}

function destinySentenceZh(value: string) {
  let next = value.trim();
  const replacements: Array<[string, string]> = [
    [
      "Energy and attention may feel more claimed by practical commitments.",
      "精力和注意力可能更容易被现实承诺占用。",
    ],
    [
      "External expectations and personal limits may need clearer separation.",
      "外部期待和个人边界可能需要更清楚地区分。",
    ],
    [
      "Some important facts may still be incomplete, so early conclusions should stay flexible.",
      "一些重要事实可能还不完整，所以早期判断需要保持弹性。",
    ],
    [
      "The situation may carry a stronger emotional current than the surface facts show.",
      "这个局势可能带有比表面事实更强的情绪流动。",
    ],
    [
      "A changing condition may open a new route, especially if evidence is gathered before acting.",
      "变化中的条件可能打开新的路径，尤其是在行动前先收集证据时。",
    ],
    [
      "What wants to be said and what is useful to say may need careful timing.",
      "想说的话和适合说的话之间，可能需要更谨慎的时机。",
    ],
    [
      "The user's internal pace may need protection from outside urgency.",
      "用户自己的节奏可能需要避免被外部紧迫感推着走。",
    ],
    [
      "Unspoken expectations between people may become more visible in the sandbox.",
      "人与人之间未说清的期待，可能会在沙盘中变得更可见。",
    ],
  ];

  for (const [from, to] of replacements) {
    next = next.replaceAll(from, to);
  }

  return next;
}

type TranslationLocale = Exclude<AppLocale, "en">;

const commonUiTranslations: Record<
  Exclude<TranslationLocale, "zh">,
  Record<string, string>
> = {
  ja: {
    Home: "ホーム",
    Start: "開始",
    Progress: "進行状況",
    Result: "結果",
    History: "履歴",
    Settings: "設定",
    Help: "ヘルプ",
    More: "その他",
    Details: "詳細",
    Archive: "アーカイブ",
    Support: "サポート",
    "Back to dashboard": "ダッシュボードに戻る",
    "Start analysis": "分析を開始",
    Sample: "サンプル",
    Continue: "続ける",
    "Add material": "資料を追加",
    Presets: "プリセット",
    Optional: "任意",
    Ready: "準備完了",
    Draft: "下書き",
    Open: "開く",
    Delete: "削除",
    Edit: "編集",
    Save: "保存",
    "Language and region": "言語と地域",
    "Current local data": "現在のローカルデータ",
    "Product boundaries": "プロダクトの境界",
    "Safety levels": "安全レベル",
    "System Readiness": "システム準備度",
    "User-facing mode": "ユーザー向けモード",
    "Source coverage": "情報源の範囲",
    "Current capability": "現在の能力",
    "What this run can honestly claim": "この実行で正直に示せること",
    "Timing lens": "時間レンズ",
    "Your situation": "あなたの状況",
    "Start from one message": "一文から始める",
    "Ready to read": "読み取り準備完了",
    "DeepSeek Reality Intake": "DeepSeek 現実情報の取り込み",
    "External Reality Search": "外部現実検索",
    "CASE SIGNAL": "ケース信号",
    "CENTRAL NODE": "中心ノード",
    "REAL-TIME": "リアルタイム",
    ACTIVE: "有効",
    LIMITED: "制限あり",
    OFFLINE: "オフライン",
    VISIBLE: "表示中",
    READY: "準備完了",
    RUNNING: "実行中",
    STANDBY: "待機",
    Recent: "最近",
    Case: "ケース",
    Evidence: "根拠",
  },
  ko: {
    Home: "홈",
    Start: "시작",
    Progress: "진행",
    Result: "결과",
    History: "기록",
    Settings: "설정",
    Help: "도움말",
    More: "더보기",
    Details: "상세",
    Archive: "보관함",
    Support: "지원",
    "Back to dashboard": "대시보드로 돌아가기",
    "Start analysis": "분석 시작",
    Sample: "샘플",
    Continue: "계속",
    "Add material": "자료 추가",
    Presets: "프리셋",
    Optional: "선택 사항",
    Ready: "준비됨",
    Draft: "초안",
    Open: "열기",
    Delete: "삭제",
    Edit: "편집",
    Save: "저장",
    "Language and region": "언어 및 지역",
    "Current local data": "현재 로컬 데이터",
    "Product boundaries": "제품 경계",
    "Safety levels": "안전 단계",
    "System Readiness": "시스템 준비도",
    "User-facing mode": "사용자 표시 모드",
    "Source coverage": "출처 범위",
    "Current capability": "현재 기능",
    "What this run can honestly claim": "이 실행이 정직하게 말할 수 있는 것",
    "Timing lens": "시간 렌즈",
    "Your situation": "당신의 상황",
    "Start from one message": "한 문장으로 시작",
    "Ready to read": "읽을 준비됨",
    "DeepSeek Reality Intake": "DeepSeek 현실 정보 수집",
    "External Reality Search": "외부 현실 검색",
    "CASE SIGNAL": "사례 신호",
    "CENTRAL NODE": "중심 노드",
    "REAL-TIME": "실시간",
    ACTIVE: "활성",
    LIMITED: "제한됨",
    OFFLINE: "오프라인",
    VISIBLE: "표시됨",
    READY: "준비됨",
    RUNNING: "실행 중",
    STANDBY: "대기",
    Recent: "최근",
    Case: "사례",
    Evidence: "근거",
  },
  es: {
    Home: "Inicio",
    Start: "Empezar",
    Progress: "Progreso",
    Result: "Resultado",
    History: "Historial",
    Settings: "Ajustes",
    Help: "Ayuda",
    More: "Mas",
    Details: "Detalles",
    Archive: "Archivo",
    Support: "Soporte",
    "Back to dashboard": "Volver al panel",
    "Start analysis": "Iniciar analisis",
    Sample: "Ejemplo",
    Continue: "Continuar",
    "Add material": "Agregar material",
    Presets: "Plantillas",
    Optional: "Opcional",
    Ready: "Listo",
    Draft: "Borrador",
    Open: "Abrir",
    Delete: "Eliminar",
    Edit: "Editar",
    Save: "Guardar",
    "Language and region": "Idioma y region",
    "Current local data": "Datos locales actuales",
    "Product boundaries": "Limites del producto",
    "Safety levels": "Niveles de seguridad",
    "System Readiness": "Preparacion del sistema",
    "User-facing mode": "Modo visible para el usuario",
    "Source coverage": "Cobertura de fuentes",
    "Current capability": "Capacidad actual",
    "What this run can honestly claim": "Lo que esta ejecucion puede afirmar honestamente",
    "Timing lens": "Lente temporal",
    "Your situation": "Tu situacion",
    "Start from one message": "Empieza con un mensaje",
    "Ready to read": "Listo para leer",
    "DeepSeek Reality Intake": "Lectura de realidad DeepSeek",
    "External Reality Search": "Busqueda externa de realidad",
    "CASE SIGNAL": "Senal del caso",
    "CENTRAL NODE": "Nodo central",
    "REAL-TIME": "Tiempo real",
    ACTIVE: "Activo",
    LIMITED: "Limitado",
    OFFLINE: "Sin conexion",
    VISIBLE: "Visible",
    READY: "Listo",
    RUNNING: "En curso",
    STANDBY: "En espera",
    Recent: "Reciente",
    Case: "Caso",
    Evidence: "Evidencia",
  },
  fr: {
    Home: "Accueil",
    Start: "Demarrer",
    Progress: "Progression",
    Result: "Resultat",
    History: "Historique",
    Settings: "Parametres",
    Help: "Aide",
    More: "Plus",
    Details: "Details",
    Archive: "Archive",
    Support: "Support",
    "Back to dashboard": "Retour au tableau",
    "Start analysis": "Lancer l'analyse",
    Sample: "Exemple",
    Continue: "Continuer",
    "Add material": "Ajouter un document",
    Presets: "Modeles",
    Optional: "Facultatif",
    Ready: "Pret",
    Draft: "Brouillon",
    Open: "Ouvrir",
    Delete: "Supprimer",
    Edit: "Modifier",
    Save: "Enregistrer",
    "Language and region": "Langue et region",
    "Current local data": "Donnees locales actuelles",
    "Product boundaries": "Limites du produit",
    "Safety levels": "Niveaux de securite",
    "System Readiness": "Preparation du systeme",
    "User-facing mode": "Mode visible par l'utilisateur",
    "Source coverage": "Couverture des sources",
    "Current capability": "Capacite actuelle",
    "What this run can honestly claim": "Ce que cette execution peut affirmer honnetement",
    "Timing lens": "Lentille temporelle",
    "Your situation": "Votre situation",
    "Start from one message": "Commencer par un message",
    "Ready to read": "Pret a lire",
    "DeepSeek Reality Intake": "Lecture de realite DeepSeek",
    "External Reality Search": "Recherche externe de realite",
    "CASE SIGNAL": "Signal du cas",
    "CENTRAL NODE": "Noeud central",
    "REAL-TIME": "Temps reel",
    ACTIVE: "Actif",
    LIMITED: "Limite",
    OFFLINE: "Hors ligne",
    VISIBLE: "Visible",
    READY: "Pret",
    RUNNING: "En cours",
    STANDBY: "En attente",
    Recent: "Recent",
    Case: "Cas",
    Evidence: "Preuve",
  },
  de: {
    Home: "Startseite",
    Start: "Start",
    Progress: "Fortschritt",
    Result: "Ergebnis",
    History: "Verlauf",
    Settings: "Einstellungen",
    Help: "Hilfe",
    More: "Mehr",
    Details: "Details",
    Archive: "Archiv",
    Support: "Support",
    "Back to dashboard": "Zuruck zum Dashboard",
    "Start analysis": "Analyse starten",
    Sample: "Beispiel",
    Continue: "Fortfahren",
    "Add material": "Material hinzufugen",
    Presets: "Vorlagen",
    Optional: "Optional",
    Ready: "Bereit",
    Draft: "Entwurf",
    Open: "Offnen",
    Delete: "Loschen",
    Edit: "Bearbeiten",
    Save: "Speichern",
    "Language and region": "Sprache und Region",
    "Current local data": "Aktuelle lokale Daten",
    "Product boundaries": "Produktgrenzen",
    "Safety levels": "Sicherheitsstufen",
    "System Readiness": "Systembereitschaft",
    "User-facing mode": "Nutzersichtbarer Modus",
    "Source coverage": "Quellenabdeckung",
    "Current capability": "Aktuelle Fahigkeit",
    "What this run can honestly claim": "Was dieser Lauf ehrlich aussagen kann",
    "Timing lens": "Zeitlinse",
    "Your situation": "Ihre Situation",
    "Start from one message": "Mit einer Nachricht beginnen",
    "Ready to read": "Bereit zum Lesen",
    "DeepSeek Reality Intake": "DeepSeek-Realitatsaufnahme",
    "External Reality Search": "Externe Realitatssuche",
    "CASE SIGNAL": "Fallsignal",
    "CENTRAL NODE": "Zentraler Knoten",
    "REAL-TIME": "Echtzeit",
    ACTIVE: "Aktiv",
    LIMITED: "Begrenzt",
    OFFLINE: "Offline",
    VISIBLE: "Sichtbar",
    READY: "Bereit",
    RUNNING: "Lauft",
    STANDBY: "Bereitschaft",
    Recent: "Aktuell",
    Case: "Fall",
    Evidence: "Evidenz",
  },
};

const exactNonEnglishTranslations: Record<
  Exclude<TranslationLocale, "zh">,
  Record<string, string>
> = {
  ja: {
    "What do you want to understand?": "何を明らかにしたいですか？",
    "Type one real situation. Astraloom keeps the interface simple while the analysis engine separates facts, people, pressure, possible paths, and source limits.":
      "実際の状況を一つ入力してください。Astraloom は画面をシンプルに保ちながら、事実、人物、圧力、あり得る経路、情報源の限界を分けて整理します。",
    "For example: I am hesitating about whether to leave my current job. My manager is vague, but the new opportunity is not stable either. I want to know what to watch in the next month.":
      "例：今の仕事を離れるべきか迷っています。上司の態度は曖昧で、新しい機会もまだ安定していません。次の1か月で何を観察すべきか知りたいです。",
    "Behind the chat, the system builds a live structure without asking you to operate it.":
      "入力の裏側で、システムが操作を求めずに生きた構造を組み立てます。",
    "The result focuses on observable signals, not fixed predictions.":
      "結果は固定された予測ではなく、観察できる信号に焦点を当てます。",
    "Reality first. Sources and uncertainty stay visible.":
      "現実を優先。情報源と不確実性は常に表示されます。",
    "Ready to read": "読み取り準備完了",
    "Work choice": "仕事の選択",
    Relationship: "関係",
    "Cooperation risk": "協力リスク",
    "Family pressure": "家族の圧力",
    "I feel stuck": "行き詰まり感",
    "Reality Signal Reader": "現実信号リーダー",
    "People, pressure, choices": "人物、圧力、選択",
    "Path Comparator": "経路比較",
    "Several possible next moves": "複数の次の動き",
    "Evidence Boundary": "根拠の境界",
    "Source and fallback labels": "情報源とフォールバック表示",
    "Timing Lens": "時間レンズ",
    "Optional destiny weighting": "任意の命理重み付け",
    "Situation captured": "状況を取得",
    "Sources checked": "情報源を確認",
    "Uncertainty preserved": "不確実性を保持",
    "Next signals prepared": "次の信号を準備",
    waiting: "待機中",
    visible: "表示中",
    active: "有効",
    queued: "キュー済み",
    "Recent cases": "最近のケース",
  },
  ko: {
    "What do you want to understand?": "무엇을 더 명확히 보고 싶나요?",
    "Type one real situation. Astraloom keeps the interface simple while the analysis engine separates facts, people, pressure, possible paths, and source limits.":
      "실제 상황 하나를 입력하세요. Astraloom은 화면을 단순하게 유지하면서 사실, 사람, 압력, 가능한 경로, 출처 한계를 분리합니다.",
    "For example: I am hesitating about whether to leave my current job. My manager is vague, but the new opportunity is not stable either. I want to know what to watch in the next month.":
      "예: 지금 직장을 떠날지 고민 중입니다. 관리자는 모호하고 새 기회도 아직 안정적이지 않습니다. 다음 한 달 동안 무엇을 봐야 할지 알고 싶습니다.",
    "Behind the chat, the system builds a live structure without asking you to operate it.":
      "입력 뒤에서 시스템이 별도 조작 없이 살아 있는 구조를 만듭니다.",
    "The result focuses on observable signals, not fixed predictions.":
      "결과는 고정된 예측이 아니라 관찰 가능한 신호에 집중합니다.",
    "Reality first. Sources and uncertainty stay visible.":
      "현실 우선. 출처와 불확실성은 계속 보입니다.",
    "Ready to read": "읽을 준비됨",
    "Work choice": "일 선택",
    Relationship: "관계",
    "Cooperation risk": "협력 위험",
    "Family pressure": "가족 압력",
    "I feel stuck": "막힌 느낌",
    "Reality Signal Reader": "현실 신호 리더",
    "People, pressure, choices": "사람, 압력, 선택",
    "Path Comparator": "경로 비교",
    "Several possible next moves": "여러 다음 움직임",
    "Evidence Boundary": "근거 경계",
    "Source and fallback labels": "출처 및 대체 표시",
    "Timing Lens": "시간 렌즈",
    "Optional destiny weighting": "선택적 명리 가중치",
    "Situation captured": "상황 수집됨",
    "Sources checked": "출처 확인됨",
    "Uncertainty preserved": "불확실성 유지됨",
    "Next signals prepared": "다음 신호 준비됨",
    waiting: "대기",
    visible: "표시됨",
    active: "활성",
    queued: "대기열",
    "Recent cases": "최근 사례",
  },
  es: {
    "What do you want to understand?": "Que quieres entender?",
    "Type one real situation. Astraloom keeps the interface simple while the analysis engine separates facts, people, pressure, possible paths, and source limits.":
      "Escribe una situacion real. Astraloom mantiene la interfaz simple mientras el motor separa hechos, personas, presion, caminos posibles y limites de fuente.",
    "For example: I am hesitating about whether to leave my current job. My manager is vague, but the new opportunity is not stable either. I want to know what to watch in the next month.":
      "Ejemplo: dudo si dejar mi trabajo actual. Mi gerente es ambiguo y la nueva oportunidad tampoco es estable. Quiero saber que observar durante el proximo mes.",
    "Behind the chat, the system builds a live structure without asking you to operate it.":
      "Detras del texto, el sistema construye una estructura viva sin pedirte que la operes.",
    "The result focuses on observable signals, not fixed predictions.":
      "El resultado se centra en senales observables, no en predicciones fijas.",
    "Reality first. Sources and uncertainty stay visible.":
      "Primero la realidad. Las fuentes y la incertidumbre permanecen visibles.",
    "Ready to read": "Listo para leer",
    "Work choice": "Decision laboral",
    Relationship: "Relacion",
    "Cooperation risk": "Riesgo de cooperacion",
    "Family pressure": "Presion familiar",
    "I feel stuck": "Me siento bloqueado",
    "Reality Signal Reader": "Lector de senales reales",
    "People, pressure, choices": "Personas, presion, decisiones",
    "Path Comparator": "Comparador de caminos",
    "Several possible next moves": "Varios pasos posibles",
    "Evidence Boundary": "Limite de evidencia",
    "Source and fallback labels": "Etiquetas de fuente y respaldo",
    "Timing Lens": "Lente temporal",
    "Optional destiny weighting": "Ponderacion temporal opcional",
    "Situation captured": "Situacion capturada",
    "Sources checked": "Fuentes revisadas",
    "Uncertainty preserved": "Incertidumbre preservada",
    "Next signals prepared": "Siguientes senales preparadas",
    waiting: "esperando",
    visible: "visible",
    active: "activo",
    queued: "en cola",
    "Recent cases": "Casos recientes",
  },
  fr: {
    "What do you want to understand?": "Que voulez-vous comprendre ?",
    "Type one real situation. Astraloom keeps the interface simple while the analysis engine separates facts, people, pressure, possible paths, and source limits.":
      "Decrivez une situation reelle. Astraloom garde l'interface simple pendant que le moteur separe faits, personnes, pression, chemins possibles et limites des sources.",
    "For example: I am hesitating about whether to leave my current job. My manager is vague, but the new opportunity is not stable either. I want to know what to watch in the next month.":
      "Exemple : j'hesite a quitter mon poste actuel. Mon manager est vague, mais la nouvelle opportunite n'est pas stable non plus. Je veux savoir quoi observer le mois prochain.",
    "Behind the chat, the system builds a live structure without asking you to operate it.":
      "Derriere le texte, le systeme construit une structure vivante sans vous demander de la manipuler.",
    "The result focuses on observable signals, not fixed predictions.":
      "Le resultat se concentre sur des signaux observables, pas sur des predictions fixes.",
    "Reality first. Sources and uncertainty stay visible.":
      "La realite d'abord. Les sources et l'incertitude restent visibles.",
    "Ready to read": "Pret a lire",
    "Work choice": "Choix professionnel",
    Relationship: "Relation",
    "Cooperation risk": "Risque de cooperation",
    "Family pressure": "Pression familiale",
    "I feel stuck": "Je me sens bloque",
    "Reality Signal Reader": "Lecteur de signaux reels",
    "People, pressure, choices": "Personnes, pression, choix",
    "Path Comparator": "Comparateur de chemins",
    "Several possible next moves": "Plusieurs prochains pas possibles",
    "Evidence Boundary": "Limite des preuves",
    "Source and fallback labels": "Etiquettes de source et de repli",
    "Timing Lens": "Lentille temporelle",
    "Optional destiny weighting": "Ponderation temporelle facultative",
    "Situation captured": "Situation capturee",
    "Sources checked": "Sources verifiees",
    "Uncertainty preserved": "Incertitude preservee",
    "Next signals prepared": "Prochains signaux prepares",
    waiting: "en attente",
    visible: "visible",
    active: "actif",
    queued: "en file",
    "Recent cases": "Cas recents",
  },
  de: {
    "What do you want to understand?": "Was mochten Sie verstehen?",
    "Type one real situation. Astraloom keeps the interface simple while the analysis engine separates facts, people, pressure, possible paths, and source limits.":
      "Beschreiben Sie eine reale Situation. Astraloom halt die Oberflache einfach, wahrend die Analyse Fakten, Personen, Druck, mogliche Pfade und Quellengrenzen trennt.",
    "For example: I am hesitating about whether to leave my current job. My manager is vague, but the new opportunity is not stable either. I want to know what to watch in the next month.":
      "Beispiel: Ich zogere, ob ich meinen aktuellen Job verlassen soll. Meine Fuhrungskraft ist vage, aber die neue Chance ist auch nicht stabil. Ich mochte wissen, worauf ich im nachsten Monat achten soll.",
    "Behind the chat, the system builds a live structure without asking you to operate it.":
      "Hinter der Eingabe baut das System eine lebendige Struktur, ohne dass Sie sie bedienen mussen.",
    "The result focuses on observable signals, not fixed predictions.":
      "Das Ergebnis konzentriert sich auf beobachtbare Signale, nicht auf feste Vorhersagen.",
    "Reality first. Sources and uncertainty stay visible.":
      "Realitat zuerst. Quellen und Unsicherheit bleiben sichtbar.",
    "Ready to read": "Bereit zum Lesen",
    "Work choice": "Berufliche Entscheidung",
    Relationship: "Beziehung",
    "Cooperation risk": "Kooperationsrisiko",
    "Family pressure": "Familiendruck",
    "I feel stuck": "Ich stecke fest",
    "Reality Signal Reader": "Realitatssignal-Leser",
    "People, pressure, choices": "Personen, Druck, Entscheidungen",
    "Path Comparator": "Pfadvergleich",
    "Several possible next moves": "Mehrere mogliche nachste Schritte",
    "Evidence Boundary": "Evidenzgrenze",
    "Source and fallback labels": "Quellen- und Fallback-Labels",
    "Timing Lens": "Zeitlinse",
    "Optional destiny weighting": "Optionale Zeitgewichtung",
    "Situation captured": "Situation erfasst",
    "Sources checked": "Quellen gepruft",
    "Uncertainty preserved": "Unsicherheit bewahrt",
    "Next signals prepared": "Nachste Signale vorbereitet",
    waiting: "wartend",
    visible: "sichtbar",
    active: "aktiv",
    queued: "eingereiht",
    "Recent cases": "Aktuelle Falle",
  },
};

const phraseTranslations: Record<Exclude<TranslationLocale, "zh">, Array<[string, string]>> = {
  ja: [
    ["What do you want to understand?", "何を明らかにしたいですか？"],
    ["Type one real situation.", "実際の状況を一つ入力してください。"],
    ["Reality intake", "現実情報の取り込み"],
    ["External search", "外部検索"],
    ["Fallback visibility", "フォールバック表示"],
    ["Safety downgrade", "安全上の制限"],
    ["Situation Relation Map", "状況の関係マップ"],
    ["Active Modules", "稼働中のモジュール"],
    ["Event Ledger", "イベント台帳"],
    ["Path Stream", "経路ストリーム"],
    ["source-backed", "情報源あり"],
    ["source-limited", "情報源が限定的"],
    ["Local assumption", "ローカル仮定"],
    ["Manual material", "手動資料"],
    ["External source", "外部情報源"],
    ["Full grounding", "完全な根拠付け"],
    ["Not a prediction engine", "予測エンジンではありません"],
    ["Not professional advice", "専門的助言ではありません"],
    ["browser-local", "ブラウザ内ローカル"],
    ["evidence-backed", "証拠に基づく"],
    ["uncertainty", "不確実性"],
    ["relationship", "関係"],
    ["career", "キャリア"],
    ["family", "家族"],
    ["cooperation", "協力"],
    ["pressure", "圧力"],
    ["path", "経路"],
    ["people", "人物"],
    ["findings", "発見"],
  ],
  ko: [
    ["What do you want to understand?", "무엇을 더 명확히 보고 싶나요?"],
    ["Type one real situation.", "실제 상황 하나를 입력하세요."],
    ["Reality intake", "현실 정보 수집"],
    ["External search", "외부 검색"],
    ["Fallback visibility", "대체 상태 표시"],
    ["Safety downgrade", "안전 제한"],
    ["Situation Relation Map", "상황 관계 지도"],
    ["Active Modules", "활성 모듈"],
    ["Event Ledger", "이벤트 기록"],
    ["Path Stream", "경로 흐름"],
    ["source-backed", "출처 기반"],
    ["source-limited", "출처 제한"],
    ["Local assumption", "로컬 가정"],
    ["Manual material", "수동 자료"],
    ["External source", "외부 출처"],
    ["Full grounding", "전체 근거화"],
    ["Not a prediction engine", "예측 엔진이 아닙니다"],
    ["Not professional advice", "전문 조언이 아닙니다"],
    ["browser-local", "브라우저 로컬"],
    ["evidence-backed", "증거 기반"],
    ["uncertainty", "불확실성"],
    ["relationship", "관계"],
    ["career", "커리어"],
    ["family", "가족"],
    ["cooperation", "협력"],
    ["pressure", "압력"],
    ["path", "경로"],
    ["people", "사람"],
    ["findings", "발견"],
  ],
  es: [
    ["What do you want to understand?", "Que quieres entender?"],
    ["Type one real situation.", "Escribe una situacion real."],
    ["Reality intake", "Lectura de realidad"],
    ["External search", "Busqueda externa"],
    ["Fallback visibility", "Visibilidad de respaldo"],
    ["Safety downgrade", "Reduccion por seguridad"],
    ["Situation Relation Map", "Mapa de relaciones de la situacion"],
    ["Active Modules", "Modulos activos"],
    ["Event Ledger", "Registro de eventos"],
    ["Path Stream", "Flujo de caminos"],
    ["source-backed", "con fuentes"],
    ["source-limited", "fuentes limitadas"],
    ["Local assumption", "Supuesto local"],
    ["Manual material", "Material manual"],
    ["External source", "Fuente externa"],
    ["Full grounding", "Fundamento completo"],
    ["Not a prediction engine", "No es un motor de prediccion"],
    ["Not professional advice", "No es asesoramiento profesional"],
    ["browser-local", "local del navegador"],
    ["evidence-backed", "respaldado por evidencia"],
    ["uncertainty", "incertidumbre"],
    ["relationship", "relacion"],
    ["career", "carrera"],
    ["family", "familia"],
    ["cooperation", "cooperacion"],
    ["pressure", "presion"],
    ["path", "camino"],
    ["people", "personas"],
    ["findings", "hallazgos"],
  ],
  fr: [
    ["What do you want to understand?", "Que voulez-vous comprendre ?"],
    ["Type one real situation.", "Decrivez une situation reelle."],
    ["Reality intake", "Lecture de la realite"],
    ["External search", "Recherche externe"],
    ["Fallback visibility", "Visibilite du repli"],
    ["Safety downgrade", "Reduction de securite"],
    ["Situation Relation Map", "Carte relationnelle de la situation"],
    ["Active Modules", "Modules actifs"],
    ["Event Ledger", "Journal des evenements"],
    ["Path Stream", "Flux des chemins"],
    ["source-backed", "avec sources"],
    ["source-limited", "sources limitees"],
    ["Local assumption", "Hypothese locale"],
    ["Manual material", "Document manuel"],
    ["External source", "Source externe"],
    ["Full grounding", "Ancrage complet"],
    ["Not a prediction engine", "Ce n'est pas un moteur de prediction"],
    ["Not professional advice", "Ce n'est pas un conseil professionnel"],
    ["browser-local", "local au navigateur"],
    ["evidence-backed", "appuye par des preuves"],
    ["uncertainty", "incertitude"],
    ["relationship", "relation"],
    ["career", "carriere"],
    ["family", "famille"],
    ["cooperation", "cooperation"],
    ["pressure", "pression"],
    ["path", "chemin"],
    ["people", "personnes"],
    ["findings", "constats"],
  ],
  de: [
    ["What do you want to understand?", "Was mochten Sie verstehen?"],
    ["Type one real situation.", "Beschreiben Sie eine reale Situation."],
    ["Reality intake", "Realitatsaufnahme"],
    ["External search", "Externe Suche"],
    ["Fallback visibility", "Fallback-Sichtbarkeit"],
    ["Safety downgrade", "Sicherheitsabstufung"],
    ["Situation Relation Map", "Beziehungskarte der Situation"],
    ["Active Modules", "Aktive Module"],
    ["Event Ledger", "Ereignisprotokoll"],
    ["Path Stream", "Pfadstrom"],
    ["source-backed", "quellengestutzt"],
    ["source-limited", "quellenbegrenzt"],
    ["Local assumption", "Lokale Annahme"],
    ["Manual material", "Manuelles Material"],
    ["External source", "Externe Quelle"],
    ["Full grounding", "Vollstandige Fundierung"],
    ["Not a prediction engine", "Keine Vorhersage-Engine"],
    ["Not professional advice", "Keine professionelle Beratung"],
    ["browser-local", "browserlokal"],
    ["evidence-backed", "evidenzgestutzt"],
    ["uncertainty", "Unsicherheit"],
    ["relationship", "Beziehung"],
    ["career", "Karriere"],
    ["family", "Familie"],
    ["cooperation", "Zusammenarbeit"],
    ["pressure", "Druck"],
    ["path", "Pfad"],
    ["people", "Personen"],
    ["findings", "Erkenntnisse"],
  ],
};

function translateNonEnglishString(
  value: string,
  locale: Exclude<TranslationLocale, "zh">,
) {
  const trimmed = value.trim();
  const exact = commonUiTranslations[locale][trimmed];
  if (exact) return value.replace(trimmed, exact);

  const exactSentence = exactNonEnglishTranslations[locale][trimmed];
  if (exactSentence) return value.replace(trimmed, exactSentence);

  if (shouldPreserveValue(trimmed)) return value;

  let next = trimmed;
  for (const [from, to] of phraseTranslations[locale]) {
    next = next.replaceAll(from, to);
  }

  return next === trimmed ? value : value.replace(trimmed, next);
}

function translateString(value: string, locale: AppLocale) {
  if (locale === "en" || locale === "zh") return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  return translateNonEnglishString(value, locale);
}

function shouldPreserveValue(value: string) {
  if (value === "Astraloom" || value === "Agent") return true;
  if (/^(?:[a-z]+_){1,}[a-z0-9]+$/i.test(value)) return true;
  if (/^[a-z]+-[a-z0-9-]+$/i.test(value)) return true;
  if (/^(?:trace|claim|event|agent|edge|seed|run|report|simulation)[_-]/i.test(value)) {
    return true;
  }
  if (/^[A-Z]{2,}-[A-Z0-9-]+$/.test(value)) return true;
  if (/^mirofish\./.test(value)) return true;
  return false;
}

export function translateLocalizedAppText(
  root: ParentNode,
  locale: AppLocale,
) {
  translateElementOwnText(root, locale);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node instanceof Text && node.nodeValue?.trim()) {
      nodes.push(node);
    }
  }

  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent) continue;
    if (shouldSkipElement(parent)) {
      continue;
    }

    const original = originalText.get(node) ?? node.nodeValue ?? "";
    originalText.set(node, original);
    const translated = translateString(original, locale);
    if (node.nodeValue !== translated) {
      node.nodeValue = translated;
    }
  }

  translateAttributes(root, locale);
}

function translateElementOwnText(root: ParentNode, locale: AppLocale) {
  if (!(root instanceof Element || root instanceof Document)) return;

  const elements =
    root instanceof Element
      ? [root, ...Array.from(root.querySelectorAll("*"))]
      : Array.from(root.querySelectorAll("*"));

  for (const element of elements) {
    if (shouldSkipElement(element)) {
      continue;
    }

    const childNodes = Array.from(element.childNodes);
    const textChildren = childNodes.filter(
      (node): node is Text => node instanceof Text && Boolean(node.nodeValue?.trim()),
    );
    const hasElementChild = childNodes.some((node) => node instanceof Element);
    if (!textChildren.length || hasElementChild) continue;

    for (const node of textChildren) {
      const original = originalText.get(node) ?? node.nodeValue ?? "";
      originalText.set(node, original);
      const translated = translateString(original, locale);
      if (node.nodeValue !== translated) {
        node.nodeValue = translated;
      }
    }
  }
}

function translateAttributes(root: ParentNode, locale: AppLocale) {
  if (!(root instanceof Element || root instanceof Document)) return;

  const elements =
    root instanceof Element
      ? [root, ...Array.from(root.querySelectorAll("[placeholder], [aria-label], [title]"))]
      : Array.from(root.querySelectorAll("[placeholder], [aria-label], [title]"));

  for (const element of elements) {
    const originals = originalAttribute.get(element) ?? {};
    for (const attribute of ["placeholder", "aria-label", "title"]) {
      const current = element.getAttribute(attribute);
      if (!current) continue;
      const original = originals[attribute] ?? current;
      originals[attribute] = original;
      const translated = translateString(original, locale);
      if (current !== translated) {
        element.setAttribute(attribute, translated);
      }
    }
    originalAttribute.set(element, originals);
  }
}

function shouldSkipElement(element: Element) {
  return Boolean(
    ignoredTags.has(element.tagName) ||
      element.closest("[data-localize='off'], [data-no-localize]"),
  );
}

export function LocalizedTextLayer() {
  const { displayLocale } = useLanguage();

  useEffect(() => {
    const root = document.querySelector("[data-localized-app-root]");
    if (!root) return;

    const observerOptions: MutationObserverInit = {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title"],
    };

    let frame: number | null = null;
    const observer = new MutationObserver(() => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        observer.disconnect();
        translateLocalizedAppText(root, displayLocale);
        observer.observe(root, observerOptions);
      });
    });

    translateLocalizedAppText(root, displayLocale);
    observer.observe(root, observerOptions);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [displayLocale]);

  return null;
}
