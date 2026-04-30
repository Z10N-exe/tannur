import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { resolveApiKey, BASE_URL } from "../config.js";

/**
 * tannur deploy
 *
 * Reads tannur.config.js from CWD and uploads it to POST /deploy.
 * Requirements: 7.1, 7.2
 */
export async function deploy(): Promise<void> {
  const configPath = join(process.cwd(), "tannur.config.js");

  if (!existsSync(configPath)) {
    console.error(
      "Error: tannur.config.js not found in the current directory.\n" +
        "Create a tannur.config.js file with a `project` function export."
    );
    process.exit(1);
  }

  const code = readFileSync(configPath, "utf8");
  const apiKey = resolveApiKey();

  const res = await fetch(`${BASE_URL}/deploy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) msg = data.error;
    } catch { /* ignore */ }
    console.error(`Error: Deploy failed (${res.status}): ${msg}`);
    process.exit(1);
  }

  console.log("Projection deployed successfully.");
}
