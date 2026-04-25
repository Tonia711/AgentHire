type Variant = "verified" | "pending";

const COPY: Record<Variant, { label: string; sub: string }> = {
  verified: {
    label: "Identity verified",
    sub: "Civic Pass • anchored on Fuji",
  },
  pending: {
    label: "Pending KYC",
    sub: "Awaiting Civic Pass verification",
  },
};

const SVG_BASE = "h-4 w-4 shrink-0";

function CheckIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ClockIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function CivicStub({
  verified,
  className = "",
}: {
  verified: boolean;
  className?: string;
}) {
  const variant: Variant = verified ? "verified" : "pending";
  const copy = COPY[variant];

  const palette =
    variant === "verified"
      ? "border-[#cfe5dc] bg-[#e7f2ee] text-[#0f4536]"
      : "border-[#f0e2b1] bg-[#fff4d5] text-[#5b4400]";

  return (
    <span
      aria-label={copy.label}
      className={`inline-flex items-center gap-2 rounded-full border ${palette} px-3 py-1.5 text-xs font-bold ${className}`}
      role="status"
    >
      {variant === "verified" ? (
        <CheckIcon className={SVG_BASE} />
      ) : (
        <ClockIcon className={SVG_BASE} />
      )}
      <span className="leading-none">{copy.label}</span>
      <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70 sm:inline">
        {copy.sub}
      </span>
    </span>
  );
}
