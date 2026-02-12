"use client";

import { useState } from "react";
import { Loader2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConnectionFormData {
  name: string;
  instanceUrl: string;
  apiVersion: string;
  username: string;
  password: string;
  company: string;
  branch: string;
}

interface ConnectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ConnectionFormData) => Promise<void>;
  initialData?: Partial<ConnectionFormData>;
  isEditing?: boolean;
}

export function ConnectionForm({
  open,
  onOpenChange,
  onSave,
  initialData,
  isEditing = false,
}: ConnectionFormProps) {
  const [form, setForm] = useState<ConnectionFormData>({
    name: initialData?.name ?? "",
    instanceUrl: initialData?.instanceUrl ?? "",
    apiVersion: initialData?.apiVersion ?? "24.200.001",
    username: initialData?.username ?? "",
    password: initialData?.password ?? "",
    company: initialData?.company ?? "",
    branch: initialData?.branch ?? "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof ConnectionFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTestResult(null);
    setError(null);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceUrl: form.instanceUrl,
          apiVersion: form.apiVersion,
          username: form.username,
          password: form.password,
          company: form.company || undefined,
          branch: form.branch || undefined,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, error: "Failed to test connection" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await onSave(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save connection");
    } finally {
      setIsSaving(false);
    }
  };

  const isValid =
    form.name.trim() &&
    form.instanceUrl.trim() &&
    form.username.trim() &&
    form.password.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Connection" : "Add Connection"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              placeholder="Production Instance"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instanceUrl">Instance URL</Label>
            <Input
              id="instanceUrl"
              placeholder="https://mycompany.acumatica.com"
              value={form.instanceUrl}
              onChange={(e) => handleChange("instanceUrl", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiVersion">API Version</Label>
            <Input
              id="apiVersion"
              placeholder="24.200.001"
              value={form.apiVersion}
              onChange={(e) => handleChange("apiVersion", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="company">Company (optional)</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => handleChange("company", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch (optional)</Label>
              <Input
                id="branch"
                value={form.branch}
                onChange={(e) => handleChange("branch", e.target.value)}
              />
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div
              className={`rounded-md px-3 py-2 text-sm ${
                testResult.success
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {testResult.success
                ? "Connection successful!"
                : testResult.error || "Connection failed"}
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive border border-destructive/20 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isValid || isTesting}
              onClick={handleTest}
              className="gap-1.5"
            >
              {isTesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wifi className="h-3.5 w-3.5" />
              )}
              Test Connection
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!isValid || isSaving}>
                {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
