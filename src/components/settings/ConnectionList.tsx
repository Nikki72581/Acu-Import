"use client";

import { useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Wifi, Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConnectionForm } from "./ConnectionForm";

interface Connection {
  id: string;
  name: string;
  instanceUrl: string;
  apiVersion: string;
  authType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConnectionListProps {
  initialConnections: Connection[];
}

export function ConnectionList({ initialConnections }: ConnectionListProps) {
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [formOpen, setFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshConnections = useCallback(async () => {
    const res = await fetch("/api/connections");
    if (res.ok) {
      setConnections(await res.json());
    }
  }, []);

  const handleCreate = useCallback(
    async (data: {
      name: string;
      instanceUrl: string;
      apiVersion: string;
      username: string;
      password: string;
      company: string;
      branch: string;
    }) => {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create connection");
      }

      await refreshConnections();
    },
    [refreshConnections]
  );

  const handleUpdate = useCallback(
    async (data: {
      name: string;
      instanceUrl: string;
      apiVersion: string;
      username: string;
      password: string;
      company: string;
      branch: string;
    }) => {
      if (!editingConnection) return;

      const res = await fetch(`/api/connections/${editingConnection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update connection");
      }

      setEditingConnection(null);
      await refreshConnections();
    },
    [editingConnection, refreshConnections]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        const res = await fetch(`/api/connections/${id}`, { method: "DELETE" });
        if (res.ok) {
          setConnections((prev) => prev.filter((c) => c.id !== id));
        }
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  const handleTest = useCallback(async (id: string) => {
    setTestingId(id);
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      const res = await fetch(`/api/connections/${id}/test`, { method: "POST" });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [id]: data }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [id]: { success: false, error: "Test request failed" },
      }));
    } finally {
      setTestingId(null);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Connections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your Acumatica instance connections
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Connection
        </Button>
      </div>

      {connections.length === 0 ? (
        <Card className="border-dashed border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wifi className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No connections configured. Add one to start importing.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <Card key={conn.id} className="border-border bg-card">
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {conn.name}
                    </h3>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {conn.authType}
                    </Badge>
                    {conn.isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {conn.instanceUrl}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    API v{conn.apiVersion}
                  </p>
                  {testResults[conn.id] && (
                    <p
                      className={`mt-1 text-xs ${
                        testResults[conn.id].success
                          ? "text-emerald-400"
                          : "text-destructive"
                      }`}
                    >
                      {testResults[conn.id].success
                        ? "Connection successful"
                        : testResults[conn.id].error || "Connection failed"}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={testingId === conn.id}
                    onClick={() => handleTest(conn.id)}
                    title="Test connection"
                  >
                    {testingId === conn.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wifi className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingConnection(conn);
                        }}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={deletingId === conn.id}
                        onClick={() => handleDelete(conn.id)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <ConnectionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleCreate}
      />

      {/* Edit dialog */}
      {editingConnection && (
        <ConnectionForm
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingConnection(null);
          }}
          onSave={handleUpdate}
          initialData={{
            name: editingConnection.name,
            instanceUrl: editingConnection.instanceUrl,
            apiVersion: editingConnection.apiVersion,
          }}
          isEditing
        />
      )}
    </div>
  );
}
