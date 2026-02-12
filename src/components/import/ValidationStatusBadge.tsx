"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationStatusBadgeProps {
  status: "pass" | "warn" | "fail";
  className?: string;
}

const config = {
  pass: {
    label: "Pass",
    icon: CheckCircle2,
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
  warn: {
    label: "Warning",
    icon: AlertTriangle,
    className: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  },
  fail: {
    label: "Fail",
    icon: XCircle,
    className: "bg-red-500/15 text-red-400 border-red-500/20",
  },
};

export function ValidationStatusBadge({ status, className }: ValidationStatusBadgeProps) {
  const { label, icon: Icon, className: statusClassName } = config[status];

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 font-medium", statusClassName, className)}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
