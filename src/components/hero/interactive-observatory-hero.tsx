"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { BRAND_NAME } from "@/lib/brand";
import type { AgentNode } from "./agent-node-layer";
import { HeroBackplate } from "./hero-backplate";
import { HeroCommandPanel } from "./hero-command-panel";
import { HeroCtaConsole } from "./hero-cta-console";
import { HeroScrollTransition } from "./hero-scroll-transition";
import { SystemBootSequence } from "./system-boot-sequence";

const OrbitGraphCanvas = dynamic(() => import("./orbit-graph-canvas"), {
  ssr: false,
  loading: () => <div className="orbit-graph-loading" aria-hidden="true" />,
});

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function InteractiveObservatoryHero() {
  const hostRef = useRef<HTMLElement | null>(null);
  const pointerFrame = useRef(0);
  const pointerTarget = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let currentX = 0;
    let currentY = 0;

    const renderPointer = () => {
      currentX += (pointerTarget.current.x - currentX) * 0.075;
      currentY += (pointerTarget.current.y - currentY) * 0.075;
      host.style.setProperty("--pointer-x", currentX.toFixed(2));
      host.style.setProperty("--pointer-y", currentY.toFixed(2));
      pointerFrame.current = requestAnimationFrame(renderPointer);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion) return;
      const rect = host.getBoundingClientRect();
      pointerTarget.current = {
        x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2)),
        y: Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2)),
      };
    };
    const handlePointerLeave = () => {
      pointerTarget.current = { x: 0, y: 0 };
    };
    const updateScroll = () => {
      const rect = host.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(window.innerHeight * 0.82, 1)));
      host.style.setProperty("--scroll-progress", progress.toFixed(3));
    };

    host.addEventListener("pointermove", handlePointerMove, { passive: true });
    host.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();
    pointerFrame.current = requestAnimationFrame(renderPointer);
    return () => {
      cancelAnimationFrame(pointerFrame.current);
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  const handleNodeHover = (node: AgentNode | null) => {
    if (hostRef.current) hostRef.current.dataset.hoveredNode = node ? String(node.id) : "";
  };

  return (
    <main className="observatory-page">
      <section
        ref={hostRef}
        className="interactive-observatory-hero"
        data-boot-stage="8"
        data-cta-active="false"
        data-ignition="false"
        aria-label="Astraloom cinematic reality observatory"
      >
        <div className="observatory-sticky-stage">
          <HeroBackplate />
          <div className="observatory-graph-parallax">
            <OrbitGraphCanvas onNodeHover={handleNodeHover} />
          </div>
          <div className="observatory-ui-parallax">
            <a className="observatory-skip-link" href="#observatory-flow">
              跳到产品说明
            </a>
            <header className="observatory-brand">
              <Link href="/" aria-label={`${BRAND_NAME} home`}>
                <span className="observatory-brand-mark"><i /></span>
                <span><strong>{BRAND_NAME}</strong><small>Reality path observatory</small></span>
              </Link>
            </header>
            <nav className="observatory-nav-links" aria-label="首页导航">
              <a href="#observatory-flow">方法</a>
              <a href="#observatory-paths">路径</a>
              <a href="#observatory-evidence">证据</a>
              <Link href="/app/start">启动推演</Link>
            </nav>
            <div className="observatory-hero-copy">
              <p>REALITY-FIRST CINEMATIC SANDBOX</p>
              <h1>
                先理解现实，<br />
                再让路径<em>展开</em>。
              </h1>
              <span>
                Astraloom 把你的真实处境变成一个活的观测场：现实材料进入证据层，关系压力形成轨道，几条未来路径在不确定性中同时流动。
              </span>
            </div>
            <HeroCommandPanel />
            <HeroCtaConsole
              onHoverChange={(active) => {
                if (hostRef.current) hostRef.current.dataset.ctaActive = String(active);
              }}
              onIgnitionChange={(active) => {
                if (hostRef.current) hostRef.current.dataset.ignition = String(active);
              }}
            />
            <SystemBootSequence hostRef={hostRef} />
            <div className="observatory-micro-label observatory-label-a">REALITY FIELD / LIVE</div>
            <div className="observatory-micro-label observatory-label-b">EVIDENCE BUS / 104</div>
            <div className="observatory-micro-label observatory-label-c">TIMING LENS / LIMITED</div>
            <div className="observatory-scroll-cue"><span>SCROLL TO DESCEND</span><i /></div>
          </div>
          <div className="observatory-ignition-flash" aria-hidden="true" />
        </div>
      </section>

      <HeroScrollTransition />

      <section id="observatory-flow" className="landing-flow" aria-label="Astraloom 方法">
        <div className="landing-section-head">
          <p>THE CAMERA MOVES THROUGH THE MODEL</p>
          <h2>
            不是 PPT 式介绍，<em>而是一次进入沙盘的镜头。</em>
          </h2>
        </div>
        <div className="landing-flow-grid">
          <article>
            <small>01</small>
            <strong>现实材料入场</strong>
            <p>问题、人物、事件和约束先进入可检查的现实层。</p>
          </article>
          <article>
            <small>02</small>
            <strong>关系压力成形</strong>
            <p>关键人物和压力边被组织成可观察的动态结构。</p>
          </article>
          <article>
            <small>03</small>
            <strong>时间调权叠加</strong>
            <p>命理只影响你的反应倾向与时机敏感度，不生成事实。</p>
          </article>
          <article>
            <small>04</small>
            <strong>路径同时流动</strong>
            <p>多条可能路径并行展开，保留证据和不确定性。</p>
          </article>
        </div>
      </section>

      <section className="landing-method" aria-label="现实优先推演方法">
        <div className="landing-method-copy">
          <p>REALITY BEFORE FATE</p>
          <h2>
            高级感不靠神秘，<br />
            靠每一层都<em>可追溯</em>。
          </h2>
          <p className="landing-body-copy">
            你看到的不该是一篇生成报告，而是现实材料如何变成判断依据。命理层只像镜头里的时间滤镜，帮助观察压力窗口和反应倾向。
          </p>
          <Link href="/app/dashboard" className="landing-text-link">
            进入工作台 <ArrowIcon />
          </Link>
        </div>
        <div className="landing-evidence-field" aria-hidden="true">
          <div className="evidence-core">
            <small>GROUNDING CORE</small>
            <strong>12</strong>
            <span>现实节点</span>
          </div>
          <i className="evidence-orbit evidence-orbit-a" />
          <i className="evidence-orbit evidence-orbit-b" />
          <div className="evidence-source evidence-source-a">
            <span>材料</span>
            <strong>上级沟通记录</strong>
          </div>
          <div className="evidence-source evidence-source-b">
            <span>压力</span>
            <strong>家庭责任与时间窗口</strong>
          </div>
          <div className="evidence-source evidence-source-c">
            <span>机会</span>
            <strong>新职位报价期限</strong>
          </div>
          <i className="evidence-line evidence-line-a" />
          <i className="evidence-line evidence-line-b" />
          <i className="evidence-line evidence-line-c" />
        </div>
      </section>

      <section id="observatory-paths" className="landing-paths" aria-label="路径分歧">
        <div className="landing-section-head landing-section-head-wide">
          <p>PATHS IN MOTION</p>
          <h2>
            同一个现实，<em>几条路径同时流动。</em>
          </h2>
        </div>
        <div className="landing-path-list">
          <article>
            <span>A</span>
            <div><small>BASELINE</small><h3>维持当前节奏</h3></div>
            <p>继续收集信息，观察承诺是否变得更具体。</p>
            <strong>适合低风险窗口，但可能错过外部机会。</strong>
          </article>
          <article>
            <span>B</span>
            <div><small>CAUTIOUS</small><h3>先补充现实材料</h3></div>
            <p>要求明确时间表，补齐关键证据后再行动。</p>
            <strong>降低误判成本，但需要承受等待压力。</strong>
          </article>
          <article>
            <span>C</span>
            <div><small>DECISIVE</small><h3>表达边界并推进</h3></div>
            <p>把选择窗口推到台前，快速暴露真实约束。</p>
            <strong>节奏更强，也更容易触发关系压力。</strong>
          </article>
        </div>
      </section>

      <section id="observatory-evidence" className="landing-findings" aria-label="证据回放">
        <div className="landing-findings-intro">
          <p>EVIDENCE REPLAY</p>
          <h2>
            结论不是终点，<em>回放才是信任。</em>
          </h2>
          <p className="landing-body-copy">
            每个发现都应该能回到现实材料、事件节点、路径变化和不确定性边界。高级产品必须让用户知道它凭什么这么说。
          </p>
        </div>
        <div className="landing-findings-list">
          <article>
            <span>01</span>
            <h3>当前最大风险不是选择本身，而是承诺的模糊度。</h3>
            <dl>
              <div><dt>现实依据</dt><dd>经理没有给出日期，招聘方要求下周答复。</dd></div>
              <div><dt>路径影响</dt><dd>等待路径会继续消耗信息优势，决断路径会更快暴露预算约束。</dd></div>
            </dl>
          </article>
          <article>
            <span>02</span>
            <h3>命理调权只影响压力反应，不改变事实判断。</h3>
            <dl>
              <div><dt>边界</dt><dd>它不会断言某人一定出现，也不会替代现实证据。</dd></div>
              <div><dt>用途</dt><dd>帮助观察你在时间压力下更可能拖延、推进还是过度防御。</dd></div>
            </dl>
          </article>
        </div>
      </section>

      <section className="landing-boundaries" aria-label="可信边界">
        <div>
          <p>HONEST PRODUCT BOUNDARY</p>
          <h2>越高级，越不能假装确定。</h2>
        </div>
        <ul>
          <li><span>01</span>现实依据优先于命理解释。</li>
          <li><span>02</span>缺失的信息必须标注为未知。</li>
          <li><span>03</span>路径是可能性，不是保证发生的未来。</li>
          <li><span>04</span>证据、风险和不确定性必须可回看。</li>
        </ul>
      </section>

      <section className="landing-final-cta" aria-label="开始推演">
        <p>READY WHEN THE CASE IS REAL</p>
        <h2>
          把问题放进来，<br />
          让路径开始<em>运动</em>。
        </h2>
        <div className="landing-final-actions">
          <Link href="/app/start" className="landing-primary-link">
            启动一次推演 <ArrowIcon />
          </Link>
          <Link href="/app/simulation/result" className="landing-secondary-link">
            查看示例沙盘
          </Link>
        </div>
        <div className="landing-final-orbit" aria-hidden="true"><i /><i /><i /></div>
      </section>

      <footer className="landing-footer">
        <Link href="/" className="landing-footer-brand">Astraloom</Link>
        <p>现实优先的未来路径推演工具。</p>
        <nav>
          <Link href="/app/support">支持</Link>
          <Link href="/app/settings">设置</Link>
          <Link href="/app/start">开始</Link>
        </nav>
        <small>
          Astraloom 的推演不构成医疗、法律、金融或心理专业建议。它帮助你观察现实材料、路径和不确定性。
        </small>
      </footer>
    </main>
  );
}
