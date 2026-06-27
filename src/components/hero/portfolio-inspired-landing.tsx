import Image from "next/image";
import Link from "next/link";

const capabilityItems = [
  {
    id: "01",
    title: "现实材料",
    text: "把真实问题、人物、约束和补充材料先整理成可检查的现实节点。",
  },
  {
    id: "02",
    title: "路径分歧",
    text: "同一处境会展开为几条可能路径，显示压力、机会和信息如何变化。",
  },
  {
    id: "03",
    title: "证据回放",
    text: "每个重要发现都能回到材料、事件、推演节点和不确定性边界。",
  },
  {
    id: "04",
    title: "命理调权",
    text: "命理只作为时间与反应的调权层，不生成现实事实。",
  },
] as const;

const orbitNodes = [
  ["职业发展瓶颈", "证据强度 0.82", "node-work"],
  ["上级沟通记录", "证据强度 0.74", "node-manager"],
  ["家庭责任压力", "证据强度 0.68", "node-family"],
  ["收入与储蓄", "证据强度 0.79", "node-money"],
  ["伴侣关系张力", "证据强度 0.72", "node-partner"],
] as const;

const branches = [
  ["路径 A", "继续当前方向", "成功概率 37%", "branch-a"],
  ["路径 B", "转换跑道", "成功概率 59%", "branch-b"],
  ["路径 C", "积累过渡", "成功概率 41%", "branch-c"],
] as const;

const evidenceCases = [
  {
    date: "2024.05.12",
    title: "职业转型推演",
    proof: "18 项证据",
    image: "/images/astraloom-reality-field-v1.webp",
  },
  {
    date: "2024.03.28",
    title: "城市迁移决策",
    proof: "14 项证据",
    image: "/images/causal-observatory-hero.png",
  },
  {
    date: "2024.01.15",
    title: "创业可行性评估",
    proof: "21 项证据",
    image: "/images/astraloom-grand-observatory-v4.png",
  },
] as const;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

function ObservatoryField() {
  return (
    <div className="portfolio-observatory" aria-label="现实材料到路径分歧的动态观测场">
      <div className="portfolio-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="portfolio-origin">
        <span>现实材料</span>
        <strong>12</strong>
      </div>
      {orbitNodes.map(([title, meta, className]) => (
        <div key={title} className={`portfolio-node ${className}`}>
          <strong>{title}</strong>
          <span>{meta}</span>
        </div>
      ))}
      <div className="portfolio-uncertainty">
        <span>不确定性</span>
        <strong>区间波动 30% 至 65%</strong>
      </div>
      <div className="portfolio-branch-lines" aria-hidden="true">
        <i className="line-a" />
        <i className="line-b" />
        <i className="line-c" />
      </div>
      <div className="portfolio-branch-list">
        {branches.map(([name, title, meta, className]) => (
          <article key={name} className={`portfolio-branch ${className}`}>
            <span>{name}</span>
            <strong>{title}</strong>
            <em>{meta}</em>
          </article>
        ))}
      </div>
      <div className="portfolio-time-rail" aria-hidden="true">
        <span>现在</span>
        <span>3 个月</span>
        <span>6 个月</span>
        <span>12 个月</span>
        <span>24 个月</span>
      </div>
    </div>
  );
}

export function PortfolioInspiredLanding() {
  return (
    <main className="portfolio-landing">
      <a className="portfolio-skip-link" href="#portfolio-main">
        跳到主要内容
      </a>

      <nav className="portfolio-nav" aria-label="首页导航">
        <Link className="portfolio-logo" href="/" aria-label="Astraloom 首页">
          Astraloom
        </Link>
        <div className="portfolio-nav-links">
          <a href="#method">方法</a>
          <a href="#evidence">证据</a>
          <a href="#boundary">边界</a>
        </div>
        <Link className="portfolio-nav-cta" href="/app/start">
          启动一次推演 <ArrowIcon />
        </Link>
      </nav>

      <section id="portfolio-main" className="portfolio-hero">
        <div className="portfolio-paper" aria-hidden="true" />
        <div className="portfolio-hero-copy">
          <p className="portfolio-system-line">Reality-first future path simulator</p>
          <h1>Astraloom</h1>
          <h2>先理解现实，再推演路径</h2>
          <p>
            把你正在面对的真实处境，转化为可检验的证据、关系压力与未来路径。
            在不确定中，找到更值得把握的下一步。
          </p>
          <div className="portfolio-principle">
            <span>诚实边界</span>
            <strong>命理只作为时间与反应的调权层，不生成现实事实。</strong>
          </div>
          <div className="portfolio-hero-actions">
            <Link href="/app/start" className="portfolio-button-primary">
              启动一次推演 <ArrowIcon />
            </Link>
            <Link href="/app/simulation/result" className="portfolio-button-secondary">
              查看示例沙盘 <ArrowIcon />
            </Link>
          </div>
        </div>

        <div className="portfolio-hero-field">
          <ObservatoryField />
        </div>

        <div className="portfolio-capability-rail">
          <strong>我们的能力边界</strong>
          {capabilityItems.map((item) => (
            <article key={item.id}>
              <span>{item.id}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="method" className="portfolio-section portfolio-method">
        <div className="portfolio-section-kicker">Method</div>
        <div className="portfolio-section-grid">
          <div>
            <h2>它不是给你一个答案，而是把判断过程摊开。</h2>
          </div>
          <div className="portfolio-method-copy">
            <p>
              Astraloom 的高级感不来自神秘包装，而来自克制的结构化能力：
              现实先被读取，路径再被比较，证据最后可回放。每一层都保留不确定性。
            </p>
            <Link href="/app/dashboard" className="portfolio-text-button">
              进入工作台 <ArrowIcon />
            </Link>
          </div>
        </div>
        <div className="portfolio-method-steps">
          {["提交真实问题", "抽取现实节点", "叠加时间调权", "比较路径分歧", "回放证据依据"].map(
            (step, index) => (
              <article key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </article>
            ),
          )}
        </div>
      </section>

      <section className="portfolio-paths" aria-labelledby="paths-title">
        <div className="portfolio-paths-sticky">
          <p>Path divergence</p>
          <h2 id="paths-title">
            同一现实，<br />
            三种走法。
          </h2>
          <span>
            页面会把基准、谨慎与决断路径并排展开，让你看见每条路的压力、窗口和下一步观察信号。
          </span>
        </div>
        <div className="portfolio-path-stack">
          {[
            ["基准路径", "维持当前节奏", "观察信息差是否继续扩大"],
            ["谨慎路径", "先补充现实材料", "降低行动前的误判成本"],
            ["决断路径", "明确表达边界", "更快暴露真实约束"],
          ].map(([title, action, note]) => (
            <article key={title}>
              <span>{title}</span>
              <strong>{action}</strong>
              <p>{note}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="evidence" className="portfolio-section portfolio-evidence">
        <div className="portfolio-section-kicker">Evidence replay</div>
        <div className="portfolio-section-grid">
          <h2>高级不是更玄，而是每个结论都能回看。</h2>
          <p>
            证据回放把材料、人物、事件、路径节点和不确定性连接起来。
            你看到的是判断依据，不是无法追溯的结论。
          </p>
        </div>
        <div className="portfolio-evidence-row">
          {evidenceCases.map((item) => (
            <article key={item.title}>
              <Image src={item.image} alt="" width={420} height={260} />
              <div>
                <span>{item.date}</span>
                <h3>{item.title}</h3>
                <p>{item.proof}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="boundary" className="portfolio-final">
        <div className="portfolio-final-copy">
          <p>Ready when the case is real</p>
          <h2>
            把问题放进来，<br />
            让路径开始展开。
          </h2>
          <Link href="/app/start" className="portfolio-button-primary">
            启动一次推演 <ArrowIcon />
          </Link>
        </div>
        <footer>
          <span>© 2026 Astraloom</span>
          <nav>
            <Link href="/app/support">支持</Link>
            <Link href="/app/settings">设置</Link>
            <a href="#method">可信边界</a>
          </nav>
          <small>
            Astraloom 的推演不构成医疗、法律、金融或心理专业建议。它帮助你观察现实材料、路径和不确定性。
          </small>
        </footer>
      </section>
    </main>
  );
}
