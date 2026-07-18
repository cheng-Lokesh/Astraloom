import Image from "next/image";

export function HeroBackplate() {
  return (
    <div className="observatory-backplate" aria-hidden="true">
      <div className="observatory-backplate-shift">
        <Image
          src="/hero/astraloom-command-center-base.png"
          alt=""
          fill
          preload
          sizes="100vw"
          quality={75}
          className="observatory-backplate-image"
        />
      </div>
      <div className="observatory-depth-shadow" />
      <div className="observatory-vignette" />
      <div className="observatory-film-grain" />
    </div>
  );
}
