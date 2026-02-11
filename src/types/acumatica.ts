export interface AcumaticaCredentials {
  username: string;
  password: string;
  company?: string;
  branch?: string;
}

export interface AcumaticaOAuthCredentials {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AcumaticaAuthSession {
  cookies: string;
  expiresAt: number;
  instanceUrl: string;
}

export interface AcumaticaFieldValue {
  value: string | number | boolean | null;
}

export type AcumaticaRecord = Record<string, AcumaticaFieldValue>;

export interface AcumaticaApiError {
  message: string;
  exceptionMessage?: string;
  exceptionType?: string;
  stackTrace?: string;
  innerException?: AcumaticaApiError;
}

export interface AcumaticaErrorResponse {
  status: number;
  message: string;
  details?: string;
  retryable: boolean;
}

export interface LookupRequirement {
  name: string;
  entity: string;
  keyField: string;
  label: string;
}

export interface LookupContext {
  lookups: Record<string, Set<string>>;
  existingKeys: Set<string> | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
  value?: string;
}
