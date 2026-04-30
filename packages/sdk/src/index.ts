import type { TannurConfig, TannurClient, EmitResult } from "./types.js";
import { TannurError } from "./errors.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export { TannurError };
export type { TannurConfig, TannurClient, EmitResult };

const DEFAULT_BASE_URL = "https://api.tannur.xyz";

/**
 * Resolves API key from various sources.
 * Priority: provided config → TANNUR_API_KEY env var → global ~/.tannur/config
 */
function resolveApiKey(providedKey?: string): string {
  // 1. Use provided key if given
  if (providedKey) {
    return providedKey;
  }

  // 2. Check environment variable
  if (process.env.TANNUR_API_KEY) {
    return process.env.TANNUR_API_KEY;
  }

  // 3. Check global config (~/.tannur/config) - only in Node.js environment
  if (typeof process !== "undefined" && process.env) {
    try {
      const globalConfigPath = join(homedir(), ".tannur", "config");
      if (existsSync(globalConfigPath)) {
        const contents = readFileSync(globalConfigPath, "utf8").trim();
        const match = contents.match(/^(?:TANNUR_API_KEY=)?(.+)$/m);
        if (match?.[1]) {
          return match[1].trim();
        }
      }
    } catch (error) {
      // Ignore errors in browser environment or when reading config
    }
  }

  throw new Error(
    "No API key found. Please provide apiKey in config, set TANNUR_API_KEY environment variable, or run 'tannur login'."
  );
}

/**
 * Creates a Tannur client instance.
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function createClient(config: Partial<TannurConfig> = {}): TannurClient {
  const apiKey = resolveApiKey(config.apiKey);
  const baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  async function request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
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
     * Requirements: 6.2
     */
    async emit(eventName, payload, options) {
      return request<EmitResult>("POST", "/events", {
        streamId: options?.streamId ?? "default",
        eventName,
        payload,
      });
    },

    /**
     * Retrieves the latest projected state for a stream.
     * Requirements: 6.3
     */
    async getState(streamId) {
      return request<Record<string, unknown>>("GET", `/state/${encodeURIComponent(streamId)}`);
    },
  };
}
