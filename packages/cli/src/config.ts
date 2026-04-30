import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

/**
 * Resolves the tenant API key.
 * Priority: TANNUR_API_KEY env var → global ~/.tannur/config → local .tannur file
 * Requirements: 7.6
 */
export function resolveApiKey(): string {
  // 1. Check environment variable first
  if (process.env.TANNUR_API_KEY) {
    return process.env.TANNUR_API_KEY;
  }

  // 2. Check global config (~/.tannur/config)
  const globalConfigPath = join(homedir(), ".tannur", "config");
  if (existsSync(globalConfigPath)) {
    try {
      const contents = readFileSync(globalConfigPath, "utf8").trim();
      const match = contents.match(/^(?:TANNUR_API_KEY=)?(.+)$/m);
      if (match?.[1]) {
        return match[1].trim();
      }
    } catch (error) {
      // Ignore errors reading global config, fall through to local
    }
  }

  // 3. Check local project config (.tannur file in CWD)
  const localConfigPath = join(process.cwd(), ".tannur");
  if (existsSync(localConfigPath)) {
    try {
      const contents = readFileSync(localConfigPath, "utf8").trim();
      const match = contents.match(/^(?:TANNUR_API_KEY=)?(.+)$/m);
      if (match?.[1]) {
        return match[1].trim();
      }
    } catch (error) {
      // Ignore errors reading local config
    }
  }

  console.error(
    "❌ No API key found. Please run 'tannur login' or set TANNUR_API_KEY environment variable."
  );
  process.exit(1);
}

export const BASE_URL =
  process.env.TANNUR_BASE_URL ?? "https://api.tannur.xyz";
