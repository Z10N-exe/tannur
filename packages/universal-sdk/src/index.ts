/**
 * Universal JavaScript SDK for Tannur Event-Sourced BaaS
 * Works in Node.js, browsers, and edge environments
 * Requirements: 4.1, 4.2, 4.3, 4.5, 7.1, 7.2
 */

import type { TannurConfig, TannurClient, EmitResult } from '@tannur/shared';
import { TannurError } from '@tannur/shared';

export { TannurError };
export type { TannurConfig, TannurClient, EmitResult };

const DEFAULT_BASE_URL = 'https://api.tannur.xyz';

/**
 * Environment detection for Universal SDK
 * Requirements: 4.1, 4.3
 */
export class EnvironmentDetector {
  /**
   * Detect if running in Node.js environment
   */
  isNode(): boolean {
    return (
      typeof process !== 'undefined' &&
      process.versions != null &&
      process.versions.node != null
    );
  }

  /**
   * Detect if running in browser environment
   */
  isBrowser(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.document !== 'undefined'
    );
  }

  /**
   * Detect if running in edge runtime (Cloudflare Workers, Vercel Edge, etc.)
   */
  isEdge(): boolean {
    // Edge runtimes typically have fetch but not window or process.versions.node
    return (
      typeof fetch !== 'undefined' &&
      !this.isNode() &&
      !this.isBrowser()
    );
  }

  /**
   * Get the appropriate HTTP client for the current environment
   * Requirements: 4.3, 4.5
   */
  getHttpClient(): typeof fetch {
    // All modern environments support fetch
    if (typeof fetch !== 'undefined') {
      return fetch;
    }

    throw new Error(
      'No HTTP client available. Please ensure your environment supports fetch API.'
    );
  }
}

/**
 * Resolves API key from various sources.
 * Priority: provided config → TANNUR_API_KEY env var → global ~/.tannur/config
 * Requirements: 7.1
 */
function resolveApiKey(providedKey?: string, detector?: EnvironmentDetector): string {
  const env = detector || new EnvironmentDetector();

  // 1. Use provided key if given
  if (providedKey) {
    return providedKey;
  }

  // 2. Check environment variable (Node.js and some edge runtimes)
  if (env.isNode() && typeof process !== 'undefined' && process.env?.TANNUR_API_KEY) {
    return process.env.TANNUR_API_KEY;
  }

  // 3. Check global config (~/.tannur/config) - only in Node.js environment
  if (env.isNode()) {
    try {
      // Dynamic import to avoid bundling fs in browser builds
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const globalConfigPath = path.join(os.homedir(), '.tannur', 'config');
      if (fs.existsSync(globalConfigPath)) {
        const contents = fs.readFileSync(globalConfigPath, 'utf8').trim();
        const match = contents.match(/^(?:TANNUR_API_KEY=)?(.+)$/m);
        if (match?.[1]) {
          return match[1].trim();
        }
      }
    } catch (error) {
      // Ignore errors when reading config
    }
  }

  throw new Error(
    'No API key found. Please provide apiKey in config, set TANNUR_API_KEY environment variable, or run \'tannur login\'.'
  );
}

/**
 * Creates a Universal Tannur client instance.
 * Works across Node.js, browsers, and edge environments.
 * Requirements: 4.1, 4.2, 4.3, 4.5, 7.1, 7.2
 */
export function createClient(config: Partial<TannurConfig> = {}): TannurClient {
  const detector = new EnvironmentDetector();
  const apiKey = resolveApiKey(config.apiKey, detector);
  const baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  const httpClient = detector.getHttpClient();

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  async function request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await httpClient(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let message = res.statusText;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) message = data.error;
      } catch {
        // ignore parse errors — use statusText
      }
      throw new TannurError(res.status, message);
    }

    return res.json() as Promise<T>;
  }

  return {
    /**
     * Emits a named event with a payload.
     * Requirements: 4.2, 7.1, 7.2
     */
    async emit(eventName, payload, options) {
      return request<EmitResult>('POST', '/events', {
        streamId: options?.streamId ?? 'default',
        eventName,
        payload,
      });
    },

    /**
     * Retrieves the latest projected state for a stream.
     * Requirements: 4.2, 7.2
     */
    async getState(streamId) {
      return request<Record<string, unknown>>('GET', `/state/${encodeURIComponent(streamId)}`);
    },
  };
}

/**
 * Universal Tannur Client class with configure method
 * Requirements: 4.2, 7.1
 */
export class UniversalTannurClient implements TannurClient {
  private config: TannurConfig;
  private detector: EnvironmentDetector;
  private client: TannurClient;

  constructor(config: Partial<TannurConfig> = {}, detector?: EnvironmentDetector) {
    this.detector = detector || new EnvironmentDetector();
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
    };
    this.client = createClient(this.config);
  }

  /**
   * Configure the client with new settings
   * Requirements: 7.1
   */
  configure(config: TannurConfig): void {
    this.config = { ...this.config, ...config };
    this.client = createClient(this.config);
  }

  async emit(
    eventName: string,
    payload: Record<string, unknown>,
    options?: { streamId?: string }
  ): Promise<EmitResult> {
    return this.client.emit(eventName, payload, options);
  }

  async getState(streamId: string): Promise<Record<string, unknown>> {
    return this.client.getState(streamId);
  }
}
