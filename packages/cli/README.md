# Tannur CLI

Command-line interface for Tannur Event-Sourced BaaS. Deploy and manage your event-sourced applications with ease.

## Installation

```bash
npm install -g @tannur/cli
```

## Quick Start

### 1. Login

Authenticate with your Tannur account:

```bash
tannur login
```

This will:
- Open your browser for authentication
- Save your API key to `~/.tannur/config`
- Allow you to deploy and manage your applications

### 2. Deploy

Deploy your event-sourced application:

```bash
tannur deploy
```

This will:
- Read your `tannur.config.js` configuration
- Validate your projection and reducer functions
- Deploy them to Tannur's infrastructure
- Return a deployment URL

### 3. Verify

Verify the integrity of an event stream:

```bash
tannur verify <streamId>
```

This will:
- Fetch all events from the specified stream
- Verify the hash chain integrity
- Report any inconsistencies

## Configuration

### API Key

The CLI looks for your API key in the following order:

1. `TANNUR_API_KEY` environment variable
2. `~/.tannur/config` global configuration file
3. `.tannur` file in your project directory

### Base URL

Override the default API URL:

```bash
export TANNUR_BASE_URL=https://custom.tannur.xyz
```

## Commands

### `tannur login`

Authenticate with Tannur and save your API key.

**Usage:**
```bash
tannur login
```

**What it does:**
- Opens your browser to the Tannur authentication page
- Polls for authentication completion
- Saves your API key to `~/.tannur/config`

### `tannur deploy`

Deploy your event-sourced application configuration.

**Usage:**
```bash
tannur deploy
```

**Requirements:**
- `tannur.config.js` file in your project root
- Valid API key (run `tannur login` first)

**Configuration file example:**
```javascript
module.exports = {
  projection: (state, event) => {
    // Your projection logic
    return newState;
  },
  reducer: (events) => {
    // Your reducer logic
    return finalState;
  }
};
```

### `tannur verify <streamId>`

Verify the integrity of an event stream's hash chain.

**Usage:**
```bash
tannur verify user-123
```

**What it does:**
- Fetches all events from the specified stream
- Verifies each event's hash against the previous event
- Reports any hash chain breaks or inconsistencies

## Project Structure

```
your-project/
├── tannur.config.js    # Your Tannur configuration
├── .tannur             # Optional: Local API key (gitignored)
└── src/
    └── ...
```

## Environment Variables

- `TANNUR_API_KEY` - Your Tannur API key
- `TANNUR_BASE_URL` - Override the default API URL (default: `https://api.tannur.xyz`)

## Troubleshooting

### "No API key found"

Run `tannur login` to authenticate, or set the `TANNUR_API_KEY` environment variable.

### "Cannot find tannur.config.js"

Make sure you have a `tannur.config.js` file in your project root when running `tannur deploy`.

### "Stream not found"

Verify that the stream ID exists by checking your Tannur dashboard or trying a different stream ID.

## License

Apache-2.0

## Links

- [Documentation](https://docs.tannur.xyz)
- [GitHub](https://github.com/Z10N-exe/tannur)
- [NPM](https://www.npmjs.com/package/@tannur/cli)
