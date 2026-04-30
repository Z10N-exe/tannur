#!/usr/bin/env node

import { deploy } from "./commands/deploy.js";
import { verify } from "./commands/verify.js";
import { login } from "./commands/login.js";

const [, , command, ...args] = process.argv;

switch (command) {
  case "login":
    login().catch((err) => {
      console.error("Unexpected error:", err);
      process.exit(1);
    });
    break;

  case "deploy":
    deploy().catch((err) => {
      console.error("Unexpected error:", err);
      process.exit(1);
    });
    break;

  case "verify": {
    const streamId = args[0];
    if (!streamId) {
      console.error("Usage: tannur verify <streamId>");
      process.exit(1);
    }
    verify(streamId).catch((err) => {
      console.error("Unexpected error:", err);
      process.exit(1);
    });
    break;
  }

  default:
    console.error(
      `Unknown command: ${command ?? "(none)"}\n\nUsage:\n  tannur login\n  tannur deploy\n  tannur verify <streamId>`
    );
    process.exit(1);
}
