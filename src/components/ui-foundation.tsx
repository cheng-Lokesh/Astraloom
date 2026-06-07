import Link from "next/link";

type Tone = "default" | "accent" | "warning" | "danger" | "dark";
type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "warning"
  | "ghost"
  | "danger"
  | "onDark"
  | "ghostOnDark";
type CardVariant =
  | "surface"
  | "strong"
  | "reality"
  | "path"
  | "finding"
  | "capability"
  | "destiny"
  | "debug"
  | "warning"
  | "dark";
type BadgeVariant =
  | "default"
  | "sourceBacked"
  | "localAssumption"
  | "aiIntake"
  | "externalReality"
  | "fullGrounded"
  | "confidence"
  | "warning"
  | "destiny"
  | "debug";

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
  variant,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  emphasis?: "normal" | "strong" | "dark";
  variant?: CardVariant;
}) {
  const resolvedVariant =
    variant ?? (emphasis === "dark" ? "dark" : emphasis === "strong" ? "strong" : "surface");

  return (
    <section
      className={joinClasses(
        cardClass(resolvedVariant),
        padded && "p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

function cardClass(variant: CardVariant) {
  const variants: Record<CardVariant, string> = {
    surface: "mf-card",
    strong: "mf-card-strong",
    reality: "mf-card-reality",
    path: "mf-card-path",
    finding: "mf-card-finding",
    capability: "mf-card-capability",
    destiny: "mf-card-destiny",
    debug: "mf-card-debug",
    warning: "mf-warning-panel",
    dark: "mf-panel-dark",
  };

  return variants[variant];
}

function SpecializedCard({
  children,
  className,
  variant,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  variant: CardVariant;
  padded?: boolean;
}) {
  return (
    <section
      className={joinClasses(cardClass(variant), "mf-card-fade-in", padded && "p-5", className)}
    >
      {children}
    </section>
  );
}

export function RealityCard(props: Omit<React.ComponentProps<typeof SpecializedCard>, "variant">) {
  return <SpecializedCard variant="reality" {...props} />;
}

export function PathCard(props: Omit<React.ComponentProps<typeof SpecializedCard>, "variant">) {
  return <SpecializedCard variant="path" {...props} />;
}

export function FindingCard(props: Omit<React.ComponentProps<typeof SpecializedCard>, "variant">) {
  return <SpecializedCard variant="finding" {...props} />;
}

export function CapabilityCard(props: Omit<React.ComponentProps<typeof SpecializedCard>, "variant">) {
  return <SpecializedCard variant="capability" {...props} />;
}

export function DestinyWeightingCard(
  props: Omit<React.ComponentProps<typeof SpecializedCard>, "variant">,
) {
  return <SpecializedCard variant="destiny" {...props} />;
}

export function DebugCard(props: Omit<React.ComponentProps<typeof SpecializedCard>, "variant">) {
  return <SpecializedCard variant="debug" {...props} />;
}

export function WarningPanel(props: Omit<React.ComponentProps<typeof SpecializedCard>, "variant">) {
  return <SpecializedCard variant="warning" {...props} />;
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
    warning: "mf-button-warning",
    ghost: "mf-button-ghost",
    danger: "mf-button-danger",
    onDark: "mf-button-on-dark",
    ghostOnDark: "mf-button-ghost-on-dark",
  };

  return joinClasses("mf-button", variants[variant], className);
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  loading = false,
  loadingLabel = "Loading",
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-2 w-2 rounded-full bg-current mf-progress-pulse" aria-hidden />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
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

const badgeClasses: Record<BadgeVariant, string> = {
  default: "mf-tag",
  sourceBacked: "mf-tag mf-badge-source-backed",
  localAssumption: "mf-tag mf-badge-local-assumption",
  aiIntake: "mf-tag mf-badge-ai-intake",
  externalReality: "mf-tag mf-badge-external-reality",
  fullGrounded: "mf-tag mf-badge-full-grounded",
  confidence: "mf-tag mf-tag-confidence",
  warning: "mf-tag mf-badge-warning",
  destiny: "mf-tag mf-badge-destiny",
  debug: "mf-tag mf-badge-debug",
};

export function StatusBadge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return <span className={joinClasses(badgeClasses[variant], className)}>{children}</span>;
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

export function ConfidenceBadge({
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
    <StatusBadge variant="confidence" className={className}>
      {label} {rendered}
    </StatusBadge>
  );
}

export const ConfidenceTag = ConfidenceBadge;

export function SourceBackedBadge({ children = "source-backed" }: { children?: React.ReactNode }) {
  return <StatusBadge variant="sourceBacked">{children}</StatusBadge>;
}

export function LocalAssumptionBadge({
  children = "local assumption",
}: {
  children?: React.ReactNode;
}) {
  return <StatusBadge variant="localAssumption">{children}</StatusBadge>;
}

export function AiIntakeBadge({ children = "AI intake" }: { children?: React.ReactNode }) {
  return <StatusBadge variant="aiIntake">{children}</StatusBadge>;
}

export function ExternalRealityBadge({
  children = "external reality",
}: {
  children?: React.ReactNode;
}) {
  return <StatusBadge variant="externalReality">{children}</StatusBadge>;
}

export function FullGroundedBadge({
  children = "full grounding",
}: {
  children?: React.ReactNode;
}) {
  return <StatusBadge variant="fullGrounded">{children}</StatusBadge>;
}

export function WarningBadge({ children = "warning" }: { children?: React.ReactNode }) {
  return <StatusBadge variant="warning">{children}</StatusBadge>;
}

export function DestinyWeightingBadge({
  children = "destiny weighting",
}: {
  children?: React.ReactNode;
}) {
  return <StatusBadge variant="destiny">{children}</StatusBadge>;
}

export function DebugBadge({ children = "debug" }: { children?: React.ReactNode }) {
  return <StatusBadge variant="debug">{children}</StatusBadge>;
}

export function FormSection({
  title,
  description,
  children,
  action,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={joinClasses("mf-form-section", className)}>
      {title || description || action ? (
        <SectionHeader title={title} description={description} action={action} />
      ) : null}
      <div className={title || description || action ? "mt-5" : undefined}>{children}</div>
    </section>
  );
}

export function FieldLabel({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={joinClasses("mf-field-label", className)}>
      {children}
    </label>
  );
}

export function HelperText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={joinClasses("mf-helper-text", className)}>{children}</p>;
}

export function ErrorText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={joinClasses("mf-error-text", className)}>{children}</p>;
}

export function TextInput({
  className,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
}) {
  return (
    <input
      className={joinClasses("mf-input w-full", className)}
      aria-invalid={error || undefined}
      {...props}
    />
  );
}

export function Textarea({
  className,
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
}) {
  return (
    <textarea
      className={joinClasses("mf-input w-full resize-none leading-6", className)}
      aria-invalid={error || undefined}
      {...props}
    />
  );
}

export function Select({
  className,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
}) {
  return (
    <select
      className={joinClasses("mf-input w-full", className)}
      aria-invalid={error || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function CheckboxRow({
  label,
  description,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={joinClasses("mf-checkbox-row", className)}>
      <input type="checkbox" {...props} />
      <span>
        <span className="block">{label}</span>
        {description ? <span className="mt-1 block text-xs leading-5 opacity-70">{description}</span> : null}
      </span>
    </label>
  );
}

export function OptionalSection({
  summary,
  children,
  description,
  defaultOpen = false,
  className,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  description?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details open={defaultOpen} className={joinClasses("mf-optional-section", className)}>
      <summary className="cursor-pointer text-sm font-semibold text-[#11150f]">
        {summary}
      </summary>
      {description ? <HelperText className="mt-3">{description}</HelperText> : null}
      <div className="mt-4">{children}</div>
    </details>
  );
}

export function MaterialInputCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={joinClasses("mf-material-input-card", className)}>{children}</section>;
}
