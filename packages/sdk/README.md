# Tannur SDK

Official TypeScript/JavaScript SDK for the Tannur Event-Sourced Backend-as-a-Service platform.

## Installation

```bash
npm install tannur
```

## Authentication

### Option 1: CLI Login (Recommended)
```bash
# Install CLI globally
npm install -g @tannur/cli

# Authenticate (opens browser)
tannur login

# Now use SDK without API key
import { createClient } from "tannur";
const tannur = createClient(); // API key automatically resolved
```

### Option 2: Manual API Key
```bash
# Register for API key
curl -X POST https://api.tannur.xyz/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

```typescript
import { createClient } from "tannur";

const tannur = createClient({
  apiKey: "your-api-key-here"
});
```

### Option 3: Environment Variable
```bash
export TANNUR_API_KEY="your-api-key-here"
```

```typescript
import { createClient } from "tannur";
const tannur = createClient(); // Uses TANNUR_API_KEY env var
```

## Quick Start

```typescript
import { createClient } from "tannur";

// Initialize client (API key resolved automatically)
const tannur = createClient({
  baseUrl: "https://your-api.vercel.app" // optional, defaults to https://api.tannur.xyz
});

// Emit an event
await tannur.emit("order_placed", {
  orderId: "order_123",
  customerId: "user_456",
  amount: 99.99,
  items: ["item1", "item2"]
});

// Query current state
const state = await tannur.getState("default");
console.log(state); // Current projected state
```

## API Reference

### `createClient(config?)`

Creates a new Tannur client instance.

**Parameters:**
- `config.apiKey` (string, optional): Your tenant API key. If not provided, will be resolved from `TANNUR_API_KEY` environment variable or global config (`~/.tannur/config`)
- `config.baseUrl` (string, optional): API base URL, defaults to `https://api.tannur.xyz`

**Returns:** `TannurClient`

### `client.emit(eventName, payload, options?)`

Emits an event to the event stream.

**Parameters:**
- `eventName` (string): Name of the event (e.g., "order_placed", "user_registered")
- `payload` (object): Event data
- `options.streamId` (string, optional): Stream identifier, defaults to "default"

**Returns:** `Promise<{ sequenceNumber: number, currentHash: string }>`

**Example:**
```typescript
const result = await tannur.emit("user_registered", {
  userId: "user_123",
  email: "user@example.com",
  plan: "premium"
}, { streamId: "users" });

console.log(`Event #${result.sequenceNumber} with hash ${result.currentHash}`);
```

### `client.getState(streamId)`

Retrieves the current projected state for a stream.

**Parameters:**
- `streamId` (string): Stream identifier

**Returns:** `Promise<object>` - The current state snapshot

**Example:**
```typescript
const userState = await tannur.getState("users");
console.log(`Total users: ${userState.totalUsers}`);
```

## Error Handling

The SDK throws `TannurError` for API errors:

```typescript
import { TannurError } from "tannur";

try {
  await tannur.emit("", {}); // Invalid empty event name
} catch (error) {
  if (error instanceof TannurError) {
    console.log(`API Error ${error.status}: ${error.message}`);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import { createClient, TannurClient, TannurConfig, EmitResult } from "tannur";

const config: TannurConfig = {
  apiKey: "your-key", // optional
  baseUrl: "https://your-api.vercel.app"
};

const client: TannurClient = createClient(config);
const result: EmitResult = await client.emit("test", { data: "value" });
```

## CommonJS and ESM Support

The SDK supports both CommonJS and ES modules:

```javascript
// CommonJS
const { createClient } = require("tannur");

// ES Modules
import { createClient } from "tannur";
```

## License

MIT