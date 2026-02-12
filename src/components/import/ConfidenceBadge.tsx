"use client";

import { cn } from "@/lib/utils";
import type { MatchConfidence } from "@/types/mapping";

const CONFIDENCE_CONFIG: Record<
  MatchConfidence,
  { label: string; dotClass: string; textClass: string }
> = {
  exact: {
    label: "Exact match",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-500",
  },
  alias: {
    label: "Alias match",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-500",
  },
  fuzzy: {
    label: "Fuzzy match",
    dotClass: "bg-amber-500",
    textClass: "text-amber-500",
  },
  none: {
    label: "Not mapped",
    dotClass: "bg-zinc-500",
    textClass: "text-zinc-500",
  },
};

interface ConfidenceBadgeProps {
  confidence: MatchConfidence;
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceBadge({
  confidence,
  showLabel = false,
  className,
}: ConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[confidence];

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={config.label}
    >
      <span className={cn("h-2 w-2 rounded-full shrink-0", config.dotClass)} />
      {showLabel && (
        <span className={cn("text-xs", config.textClass)}>{config.label}</span>
      )}
    </span>
  );
}
