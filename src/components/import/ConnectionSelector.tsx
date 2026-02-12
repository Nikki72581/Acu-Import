"use client";

import { useEffect, useState } from "react";
import { Server, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Connection {
  id: string;
  name: string;
  instanceUrl: string;
  isActive: boolean;
}

interface ConnectionSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (connectionId: string) => void;
}

export function ConnectionSelector({
  open,
  onOpenChange,
  onSelect,
}: ConnectionSelectorProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    fetch("/api/connections")
      .then((res) => res.json())
      .then((data) => {
        const conns = data.connections ?? data ?? [];
        setConnections(conns);
        // Auto-select if only one connection
        if (conns.length === 1) {
          setSelectedId(conns[0].id);
        }
      })
      .catch(() => setConnections([]))
      .finally(() => setLoading(false));
  }, [open]);

  const handleContinue = () => {
    if (selectedId) {
      onSelect(selectedId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Connection</DialogTitle>
          <DialogDescription>
            Choose which Acumatica connection to use for validation and import.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading connections...
            </div>
          ) : connections.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No connections configured. Go to Settings to add one.
            </div>
          ) : (
            connections.map((conn) => (
              <button
                key={conn.id}
                onClick={() => setSelectedId(conn.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  selectedId === conn.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent/50"
                )}
              >
                <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{conn.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {conn.instanceUrl}
                  </div>
                </div>
                {selectedId === conn.id && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selectedId || loading}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
