import type { AcumaticaCredentials, AcumaticaAuthSession } from "@/types/acumatica";

const SESSION_DURATION_MS = 20 * 60 * 1000; // 20 minutes

// In-memory session cache keyed by instanceUrl
const sessionCache = new Map<string, AcumaticaAuthSession>();

export class AcumaticaAuthManager {
  private instanceUrl: string;
  private apiVersion: string;

  constructor(instanceUrl: string, apiVersion: string = "24.200.001") {
    // Remove trailing slash
    this.instanceUrl = instanceUrl.replace(/\/+$/, "");
    this.apiVersion = apiVersion;
  }

  async login(credentials: AcumaticaCredentials): Promise<AcumaticaAuthSession> {
    const url = `${this.instanceUrl}/entity/auth/login`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: credentials.username,
        password: credentials.password,
        company: credentials.company,
        branch: credentials.branch,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Acumatica login failed (${response.status}): ${errorText}`
      );
    }

    // Extract session cookies from response
    const setCookieHeaders = response.headers.getSetCookie?.() ?? [];
    const cookies = setCookieHeaders
      .map((c) => c.split(";")[0])
      .join("; ");

    if (!cookies) {
      throw new Error("No session cookies received from Acumatica login");
    }

    const session: AcumaticaAuthSession = {
      cookies,
      expiresAt: Date.now() + SESSION_DURATION_MS,
      instanceUrl: this.instanceUrl,
    };

    sessionCache.set(this.instanceUrl, session);
    return session;
  }

  async getSession(
    credentials: AcumaticaCredentials
  ): Promise<AcumaticaAuthSession> {
    const cached = sessionCache.get(this.instanceUrl);

    if (cached && cached.expiresAt > Date.now() + 60_000) {
      return cached;
    }

    return this.login(credentials);
  }

  async refreshSession(
    credentials: AcumaticaCredentials
  ): Promise<AcumaticaAuthSession> {
    sessionCache.delete(this.instanceUrl);
    return this.login(credentials);
  }

  invalidateSession(): void {
    sessionCache.delete(this.instanceUrl);
  }

  get baseEntityUrl(): string {
    return `${this.instanceUrl}/entity/Default/${this.apiVersion}`;
  }

  // OAuth2 stub — will be implemented in a future phase
  async loginOAuth2(_clientId: string, _clientSecret: string): Promise<AcumaticaAuthSession> {
    throw new Error("OAuth2 authentication is not yet implemented");
  }
}
