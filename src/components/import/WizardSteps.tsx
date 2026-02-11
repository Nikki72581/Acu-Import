"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Select" },
  { id: 2, label: "Upload" },
  { id: 3, label: "Map" },
  { id: 4, label: "Validate" },
  { id: 5, label: "Import" },
];

interface WizardStepsProps {
  currentStep: number;
}

export function WizardSteps({ currentStep }: WizardStepsProps) {
  return (
    <nav className="mb-8">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <li key={step.id} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    isCompleted &&
                      "bg-primary/15 text-primary",
                    isCurrent &&
                      "bg-primary text-primary-foreground",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-8",
                    isCompleted ? "bg-primary/30" : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
