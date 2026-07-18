import type { CSSProperties } from "react";

export type CommandHeroAssets = {
  webm?: string;
  mp4?: string;
  poster?: string;
  base?: string;
};

export function CommandHeroBackplate({ assets = {} }: { assets?: CommandHeroAssets }) {
  const hasVideo = Boolean(assets.webm || assets.mp4);
  const style = assets.base
    ? ({ "--command-base-image": `url("${assets.base}")` } as CSSProperties)
    : undefined;

  return (
    <div className="command-backplate" aria-hidden="true">
      <div className="command-backplate-fallback" style={style} />
      {hasVideo ? (
        <video
          className="command-backplate-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={assets.poster ?? assets.base}
        >
          {assets.webm ? <source src={assets.webm} type="video/webm" /> : null}
          {assets.mp4 ? <source src={assets.mp4} type="video/mp4" /> : null}
        </video>
      ) : null}
      <div className="command-backplate-glow" />
      <div className="command-backplate-depth" />
      <div className="command-backplate-vignette" />
      <div className="command-backplate-grain" />
    </div>
  );
}
