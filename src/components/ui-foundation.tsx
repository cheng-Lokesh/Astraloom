import Link from "next/link";

type Tone = "default" | "accent" | "warning" | "danger" | "dark";
type ButtonVariant = "primary" | "secondary" | "accent" | "onDark" | "ghostOnDark";

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={joinClasses("mf-page-container", className)}>{children}</div>;
}

export function SurfaceCard({
  children,
  className,
  padded = true,
  emphasis = "normal",
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  emphasis?: "normal" | "strong" | "dark";
}) {
  return (
    <section
      className={joinClasses(
        emphasis === "dark"
          ? "mf-panel-dark"
          : emphasis === "strong"
            ? "mf-card-strong"
            : "mf-card",
        padded && "p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={joinClasses("mf-section-header", className)}>
      <div>
        {eyebrow}
        <h2 className="mf-section-title">{title}</h2>
        {description ? <p className="mf-section-copy">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

function buttonClasses(variant: ButtonVariant, className?: string) {
  const variants: Record<ButtonVariant, string> = {
    primary: "mf-button-primary",
    secondary: "mf-button-secondary",
    accent: "mf-button-accent",
    onDark: "mf-button-on-dark",
    ghostOnDark: "mf-button-ghost-on-dark",
  };

  return joinClasses("mf-button", variants[variant], className);
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
}) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}

const emptyToneClasses: Record<Tone, string> = {
  default: "border-black/15 bg-[#f7f8f4] text-[#62695d]",
  accent: "border-[#568262]/25 bg-[#eef5ee] text-[#2f5d3d]",
  warning: "border-[#d49b4a]/30 bg-[#fff8ed] text-[#7c5524]",
  danger: "border-red-200 bg-red-50 text-red-900",
  dark: "border-white/10 bg-white/[0.06] text-white/68",
};

export function EmptyState({
  title,
  description,
  action,
  tone = "default",
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <section className={joinClasses("mf-empty-state", emptyToneClasses[tone], className)}>
      <h2 className="text-base font-semibold text-current">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 opacity-80">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

export function EvidenceTag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={joinClasses("mf-tag mf-tag-evidence", className)}>{children}</span>;
}

export function ConfidenceTag({
  value,
  label = "confidence",
  className,
}: {
  value: number | string;
  label?: string;
  className?: string;
}) {
  const rendered = typeof value === "number" ? `${value}%` : value;
  return (
    <span className={joinClasses("mf-tag mf-tag-confidence", className)}>
      {label} {rendered}
    </span>
  );
}
