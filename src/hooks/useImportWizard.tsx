"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { EntityType, ImportMode } from "@/types/entities";
import type { ParsedFile } from "@/types/import";
import type { FieldMapping } from "@/types/mapping";

interface ImportWizardState {
  parsedFile: ParsedFile | null;
  setParsedFile: (file: ParsedFile | null) => void;
  mappings: FieldMapping[];
  setMappings: (mappings: FieldMapping[]) => void;
  entityType: EntityType | null;
  setEntityType: (type: EntityType | null) => void;
  importMode: ImportMode | null;
  setImportMode: (mode: ImportMode | null) => void;
  defaultValues: Record<string, string>;
  setDefaultValues: (values: Record<string, string>) => void;
  connectionId: string | null;
  setConnectionId: (id: string | null) => void;
  excludedRows: Set<number>;
  setExcludedRows: (rows: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  reset: () => void;
}

const ImportWizardContext = createContext<ImportWizardState | null>(null);

export function ImportWizardProvider({ children }: { children: ReactNode }) {
  const [parsedFile, setParsedFileState] = useState<ParsedFile | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [importMode, setImportMode] = useState<ImportMode | null>(null);
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>({});
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [excludedRows, setExcludedRowsState] = useState<Set<number>>(new Set());
  const setExcludedRows = useCallback(
    (rows: Set<number> | ((prev: Set<number>) => Set<number>)) => {
      if (typeof rows === "function") {
        setExcludedRowsState((prev) => rows(prev));
      } else {
        setExcludedRowsState(rows);
      }
    },
    []
  );

  const setParsedFile = useCallback((file: ParsedFile | null) => {
    setParsedFileState(file);
    if (!file) {
      setMappings([]);
    }
  }, []);

  const reset = useCallback(() => {
    setParsedFileState(null);
    setMappings([]);
    setEntityType(null);
    setImportMode(null);
    setDefaultValues({});
    setConnectionId(null);
    setExcludedRowsState(new Set());
  }, []);

  return (
    <ImportWizardContext.Provider
      value={{
        parsedFile,
        setParsedFile,
        mappings,
        setMappings,
        entityType,
        setEntityType,
        importMode,
        setImportMode,
        defaultValues,
        setDefaultValues,
        connectionId,
        setConnectionId,
        excludedRows,
        setExcludedRows,
        reset,
      }}
    >
      {children}
    </ImportWizardContext.Provider>
  );
}

export function useImportWizard(): ImportWizardState {
  const ctx = useContext(ImportWizardContext);
  if (!ctx) {
    throw new Error("useImportWizard must be used within an ImportWizardProvider");
  }
  return ctx;
}
