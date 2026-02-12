"use client";

import type { ValidationError, ValidationWarning } from "@/types/acumatica";
import { AlertTriangle, XCircle } from "lucide-react";

interface ValidationErrorDetailProps {
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export function ValidationErrorDetail({ errors, warnings }: ValidationErrorDetailProps) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="space-y-1.5 py-2">
      {errors.map((err, i) => (
        <div key={`err-${i}`} className="flex items-start gap-2 text-xs">
          <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
          <span className="text-red-300">
            <span className="font-medium">{err.field}:</span> {err.message}
          </span>
        </div>
      ))}
      {warnings.map((warn, i) => (
        <div key={`warn-${i}`} className="flex items-start gap-2 text-xs">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
          <span className="text-amber-300">
            <span className="font-medium">{warn.field}:</span> {warn.message}
            {warn.suggestion && (
              <span className="text-muted-foreground">
                {" "}— did you mean &quot;{warn.suggestion}&quot;?
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
