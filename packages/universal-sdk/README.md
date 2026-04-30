# Tannur Universal JavaScript SDK

Universal JavaScript SDK for Tannur Event-Sourced BaaS. Works seamlessly across Node.js, browsers, and edge runtime environments with zero framework dependencies.

## Features

- ✅ **Universal Compatibility**: Works in Node.js, browsers, and edge functions (Cloudflare Workers, Vercel Edge, etc.)
- ✅ **Zero Dependencies**: No framework dependencies, minimal bundle size
- ✅ **Automatic Environment Detection**: Detects runtime environment and uses appropriate APIs
- ✅ **TypeScript Support**: Full TypeScript definitions included
- ✅ **Dual Module Support**: Supports both CommonJS and ES modules
- ✅ **Consistent API**: Same API across all JavaScript environments

## Installation

```bash
npm install tannur-universal
```

## Quick Start

```typescript
import { createClient } from 'tannur-universal';

// Create a client
const client = createClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.tannur.xyz' // optional
});

// Emit an event
const result = await client.emit('user-created', {
  userId: '123',
  email: 'user@example.com'
}, {
  streamId: 'user-123' // optional, defaults to 'default'
});

console.log(result.sequenceNumber, result.currentHash);

// Get current state
const state = await client.getState('user-123');
console.log(state);
```

## API Reference

### `createClient(config)`

Creates a new Tannur client instance.

**Parameters:**
- `config.apiKey` (string, optional): Your Tannur API key. Can also be set via `TANNUR_API_KEY` environment variable or `~/.tannur/config` file.
- `config.baseUrl` (string, optional): Base URL for the Tannur API. Defaults to `https://api.tannur.xyz`.

**Returns:** `TannurClient`

### `client.emit(eventName, payload, options)`

Emits an event to the specified stream.

**Parameters:**
- `eventName` (string): Name of the event
- `payload` (object): Event payload data
- `options.streamId` (string, optional): Stream ID. Defaults to `'default'`.

**Returns:** `Promise<EmitResult>`
- `sequenceNumber` (number): Sequence number of the emitted event
- `currentHash` (string): Hash of the current event

### `client.getState(streamId)`

Retrieves the current projected state for a stream.

**Parameters:**
- `streamId` (string): Stream ID to retrieve state for

**Returns:** `Promise<Record<string, unknown>>`

## Advanced Usage

### Using the UniversalTannurClient Class

For more control, you can use the `UniversalTannurClient` class which supports runtime configuration updates:

```typescript
import { UniversalTannurClient } from 'tannur-universal';

const client = new UniversalTannurClient({
  apiKey: 'initial-key',
  baseUrl: 'https://api.tannur.xyz'
});

// Emit events
await client.emit('event-name', { data: 'value' });

// Reconfigure the client
client.configure({
  apiKey: 'new-key',
  baseUrl: 'https://api.tannur.xyz'
});

// Continue using with new configuration
await client.emit('another-event', { data: 'value' });
```

### Environment Detection

The SDK automatically detects the runtime environment and uses appropriate APIs:

```typescript
import { EnvironmentDetector } from 'tannur-universal';

const detector = new EnvironmentDetector();

if (detector.isNode()) {
  console.log('Running in Node.js');
} else if (detector.isBrowser()) {
  console.log('Running in browser');
} else if (detector.isEdge()) {
  console.log('Running in edge runtime');
}
```

## Error Handling

The SDK throws `TannurError` for API errors:

```typescript
import { createClient, TannurError } from 'tannur-universal';

const client = createClient({ apiKey: 'your-key' });

try {
  await client.emit('event-name', { data: 'value' });
} catch (error) {
  if (error instanceof TannurError) {
    console.error(`API Error ${error.status}: ${error.message}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Environment-Specific Notes

### Node.js
- Supports reading API key from `~/.tannur/config` file
- Supports `TANNUR_API_KEY` environment variable

### Browser
- API key must be provided in configuration
- Uses native `fetch` API

### Edge Runtimes
- API key must be provided in configuration
- Works with Cloudflare Workers, Vercel Edge Functions, and other edge runtimes
- Uses native `fetch` API

## TypeScript

The SDK is written in TypeScript and includes full type definitions:

```typescript
import type { TannurClient, TannurConfig, EmitResult } from 'tannur-universal';

const config: TannurConfig = {
  apiKey: 'your-key',
  baseUrl: 'https://api.tannur.xyz'
};

const client: TannurClient = createClient(config);

const result: EmitResult = await client.emit('event', { data: 'value' });
```

## License

MIT

## Links

- [Documentation](https://docs.tannur.xyz)
- [GitHub](https://github.com/Z10N-exe/tannur)
- [NPM](https://www.npmjs.com/package/tannur-universal)
