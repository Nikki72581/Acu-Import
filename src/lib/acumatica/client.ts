import type {
  AcumaticaCredentials,
  AcumaticaAuthSession,
  AcumaticaErrorResponse,
} from "@/types/acumatica";
import { AcumaticaAuthManager } from "./auth";

interface ClientConfig {
  maxRetries?: number;
  timeoutMs?: number;
  retryBaseDelayMs?: number;
}

const DEFAULT_CONFIG: Required<ClientConfig> = {
  maxRetries: 3,
  timeoutMs: 30_000,
  retryBaseDelayMs: 1_000,
};

export class AcumaticaClient {
  private authManager: AcumaticaAuthManager;
  private credentials: AcumaticaCredentials;
  private session: AcumaticaAuthSession | null = null;
  private config: Required<ClientConfig>;

  constructor(
    instanceUrl: string,
    apiVersion: string,
    credentials: AcumaticaCredentials,
    config?: ClientConfig
  ) {
    this.authManager = new AcumaticaAuthManager(instanceUrl, apiVersion);
    this.credentials = credentials;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async ensureSession(): Promise<AcumaticaAuthSession> {
    if (!this.session) {
      this.session = await this.authManager.getSession(this.credentials);
    }
    return this.session;
  }

  private async refreshSession(): Promise<AcumaticaAuthSession> {
    this.session = await this.authManager.refreshSession(this.credentials);
    return this.session;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    attempt: number = 0
  ): Promise<T> {
    const session = await this.ensureSession();
    const url = `${this.authManager.baseEntityUrl}${path}`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs
    );

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Cookie: session.cookies,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Handle 401 — re-authenticate and retry once
      if (response.status === 401 && attempt === 0) {
        await this.refreshSession();
        return this.request<T>(method, path, body, attempt + 1);
      }

      // Handle 429 — rate limited
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : this.config.retryBaseDelayMs * 2;

        if (attempt < this.config.maxRetries) {
          await this.delay(waitMs);
          return this.request<T>(method, path, body, attempt + 1);
        }

        throw this.createError(429, "Rate limited by Acumatica", false);
      }

      // Handle 5xx — server errors with exponential backoff
      if (response.status >= 500 && attempt < this.config.maxRetries) {
        const delayMs =
          this.config.retryBaseDelayMs * Math.pow(2, attempt);
        await this.delay(delayMs);
        return this.request<T>(method, path, body, attempt + 1);
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let message = `Acumatica API error (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          message =
            errorJson.exceptionMessage || errorJson.message || message;
        } catch {
          if (errorText) message = errorText;
        }
        throw this.createError(response.status, message, false);
      }

      // Some endpoints return empty responses
      const text = await response.text();
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof Error && error.name === "AbortError") {
        if (attempt < this.config.maxRetries) {
          return this.request<T>(method, path, body, attempt + 1);
        }
        throw this.createError(0, "Request timed out", true);
      }

      throw error;
    }
  }

  async get<T = unknown>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async put<T = unknown>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  async post<T = unknown>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async delete(path: string): Promise<void> {
    await this.request("DELETE", path);
  }

  private createError(
    status: number,
    message: string,
    retryable: boolean
  ): AcumaticaErrorResponse {
    return { status, message, retryable };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
