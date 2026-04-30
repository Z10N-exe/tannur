import { exec } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import { join } from "path";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import type { CliSessionStart, CliSessionPoll } from "@tannur/shared";
import { BASE_URL } from "../config.js";

const execAsync = promisify(exec);

/**
 * tannur login
 * 
 * Authenticates the user via browser and saves API key globally.
 * Similar to `npm login` flow.
 */
export async function login(): Promise<void> {
  console.log("🔐 Authenticating with Tannur...\n");

  try {
    // Step 1: Start CLI authentication session
    console.log("Starting authentication session...");
    const startRes = await fetch(`${BASE_URL}/auth/cli/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!startRes.ok) {
      const error = await startRes.text();
      console.error(`❌ Failed to start authentication: ${error}`);
      process.exit(1);
    }

    const session: CliSessionStart = await startRes.json();
    
    console.log(`\n🌐 Authenticate your account at:`);
    console.log(`   ${session.authUrl}`);
    console.log(`\n⏳ Press ENTER to open in the browser...`);
    
    // Wait for user to press Enter
    await waitForEnter();
    
    // Step 2: Open browser
    await openBrowser(session.authUrl);
    console.log("✅ Browser opened. Please complete authentication in your browser.\n");
    
    // Step 3: Poll for completion
    console.log("⏳ Waiting for authentication...");
    const apiKey = await pollForCompletion(session.sessionId);
    
    // Step 4: Save API key globally
    saveGlobalApiKey(apiKey);
    
    console.log("✅ Authentication successful!");
    console.log("🎉 You're now logged in to Tannur. Happy coding!");
    
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    process.exit(1);
  }
}

async function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    process.stdin.once("data", () => {
      resolve();
    });
  });
}

async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  
  try {
    if (platform === "darwin") {
      await execAsync(`open "${url}"`);
    } else if (platform === "win32") {
      await execAsync(`start "" "${url}"`);
    } else {
      // Linux and others
      await execAsync(`xdg-open "${url}"`);
    }
  } catch (error) {
    console.log(`⚠️  Could not open browser automatically. Please visit: ${url}`);
  }
}

async function pollForCompletion(sessionId: string): Promise<string> {
  const maxAttempts = 120; // 10 minutes (5 second intervals)
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const pollRes = await fetch(`${BASE_URL}/auth/cli/poll/${sessionId}`);
      
      if (!pollRes.ok) {
        throw new Error(`Poll failed: ${pollRes.status}`);
      }
      
      const result: CliSessionPoll = await pollRes.json();
      
      if (result.status === "completed" && result.apiKey) {
        return result.apiKey;
      }
      
      if (result.status === "expired") {
        throw new Error("Authentication session expired. Please try again.");
      }
      
      // Still pending, wait and try again
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      attempts++;
      
      // Show progress dots
      if (attempts % 6 === 0) {
        process.stdout.write(".");
      }
      
    } catch (error) {
      throw new Error(`Authentication polling failed: ${error}`);
    }
  }
  
  throw new Error("Authentication timed out. Please try again.");
}

function saveGlobalApiKey(apiKey: string): void {
  const configDir = join(homedir(), ".tannur");
  const configFile = join(configDir, "config");
  
  // Create config directory if it doesn't exist
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  
  // Save API key to global config
  const config = `TANNUR_API_KEY=${apiKey}\n`;
  writeFileSync(configFile, config, "utf8");
  
  console.log(`💾 API key saved to ${configFile}`);
}