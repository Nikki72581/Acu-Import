"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFileDrop: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  hasFile: boolean;
}

export function FileDropzone({
  onFileDrop,
  isLoading,
  error,
  hasFile,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) onFileDrop(file);
    },
    [onFileDrop]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileDrop(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-12 transition-colors",
        isDragging && "border-primary bg-primary/5",
        error && "border-destructive/50 bg-destructive/5",
        hasFile && !error && "border-primary/30 bg-primary/5",
        !isDragging && !error && !hasFile && "border-border hover:border-muted-foreground/30"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleChange}
        className="hidden"
      />

      {isLoading ? (
        <>
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Parsing file...</p>
        </>
      ) : error ? (
        <>
          <AlertCircle className="mb-3 h-8 w-8 text-destructive" />
          <p className="text-sm font-medium text-destructive">{error}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click or drag to try another file
          </p>
        </>
      ) : hasFile ? (
        <>
          <FileSpreadsheet className="mb-3 h-8 w-8 text-primary" />
          <p className="text-sm text-foreground">File loaded successfully</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click or drag to replace
          </p>
        </>
      ) : (
        <>
          <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-foreground">
            Drop your file here, or{" "}
            <span className="text-primary">browse</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Supports CSV, XLSX, XLS (max 10MB, 10K rows)
          </p>
        </>
      )}
    </div>
  );
}
