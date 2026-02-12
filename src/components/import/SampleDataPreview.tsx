"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface SampleDataPreviewProps {
  samples: string[];
}

export function SampleDataPreview({ samples }: SampleDataPreviewProps) {
  if (samples.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">No data</span>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="text-left text-xs text-muted-foreground truncate max-w-[180px] hover:text-foreground transition-colors"
          >
            {samples[0]}
            {samples.length > 1 && (
              <span className="text-muted-foreground/60">
                {" "}
                +{samples.length - 1} more
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-[300px]">
          <p className="font-medium mb-1">Sample values:</p>
          <ul className="space-y-0.5">
            {samples.map((sample, i) => (
              <li key={i} className="truncate">
                {sample}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
