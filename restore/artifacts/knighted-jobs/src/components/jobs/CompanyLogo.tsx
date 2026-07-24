import { useState } from "react";

const BG_COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-rose-600",
  "bg-amber-600", "bg-cyan-600", "bg-indigo-600", "bg-teal-600",
];

function pickColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

interface CompanyLogoProps {
  company: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { outer: "w-8 h-8",  text: "text-sm font-bold" },
  md: { outer: "w-10 h-10", text: "text-base font-bold" },
  lg: { outer: "w-14 h-14", text: "text-xl font-bold" },
};

// Filter out known-unreliable logo providers so we never fire a doomed request
const BLOCKED_LOGO_HOSTS = ["logo.clearbit.com", "clearbit.com"];

function isSafeLogoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return !BLOCKED_LOGO_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export function CompanyLogo({ company, logoUrl, size = "md" }: CompanyLogoProps) {
  const [imgError, setImgError] = useState(false);
  const { outer, text } = SIZES[size];
  const letter = company.trim().charAt(0).toUpperCase();
  const bg = pickColor(company);

  const safeUrl = isSafeLogoUrl(logoUrl) ? logoUrl : null;

  if (safeUrl && !imgError) {
    return (
      <div className={`${outer} rounded-lg overflow-hidden bg-white border border-border/30 flex items-center justify-center shrink-0 p-1`}>
        <img
          src={safeUrl!}
          alt={`${company} logo`}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${outer} rounded-lg ${bg} flex items-center justify-center shrink-0`}>
      <span className={`${text} text-white select-none`}>{letter}</span>
    </div>
  );
}
