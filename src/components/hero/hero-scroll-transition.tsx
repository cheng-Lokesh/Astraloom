export function HeroScrollTransition() {
  return (
    <section
      className="hero-scroll-transition"
      data-scroll-progress="true"
      aria-label="Astraloom simulation flow"
    >
      <div className="transition-signal">
        <span>OBSERVATORY OUTPUT</span>
        <i />
      </div>
      <div className="transition-flow">
        <article>
          <small>01</small>
          <strong>Reality signals</strong>
          <span>真实材料进入证据场。</span>
        </article>
        <article>
          <small>02</small>
          <strong>Pressure graph</strong>
          <span>人物与关系形成可读网络。</span>
        </article>
        <article>
          <small>03</small>
          <strong>Event ledger</strong>
          <span>每次变化写入事件链。</span>
        </article>
        <article>
          <small>04</small>
          <strong>Path streams</strong>
          <span>多条可行路径同时展开。</span>
        </article>
      </div>
    </section>
  );
}
