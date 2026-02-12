"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Upload } from "lucide-react";

interface ImportProgressProps {
  processed: number;
  total: number;
  succeeded: number;
  failed: number;
  createdCount: number;
  updatedCount: number;
  isRunning: boolean;
  elapsedMs: number;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

export function ImportProgress({
  processed,
  total,
  succeeded,
  failed,
  createdCount,
  updatedCount,
  isRunning,
  elapsedMs,
}: ImportProgressProps) {
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Upload className="h-4 w-4 text-primary" />
              )}
              <span className="font-medium">
                {isRunning
                  ? `Processing row ${processed} of ${total}`
                  : `Import complete — ${processed} rows processed`}
              </span>
            </div>
            <span className="text-muted-foreground">{percentage}%</span>
          </div>
          <Progress value={percentage} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-md border border-border p-3 text-center">
            <div className="text-lg font-semibold">{processed}</div>
            <div className="text-xs text-muted-foreground">Processed</div>
          </div>
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-semibold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {succeeded}
            </div>
            <div className="text-xs text-muted-foreground">Succeeded</div>
          </div>
          <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-semibold text-red-400">
              <XCircle className="h-4 w-4" />
              {failed}
            </div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div className="rounded-md border border-border p-3 text-center">
            <div className="text-lg font-semibold">
              {createdCount} / {updatedCount}
            </div>
            <div className="text-xs text-muted-foreground">Created / Updated</div>
          </div>
          <div className="rounded-md border border-border p-3 text-center">
            <div className="text-lg font-semibold">{formatDuration(elapsedMs)}</div>
            <div className="text-xs text-muted-foreground">Elapsed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
