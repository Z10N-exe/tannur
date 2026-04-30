# Tannur Event-Sourced BaaS

A hosted Event-Sourced Backend-as-a-Service with cryptographic hash chains, sandboxed projections, and multi-tenant isolation.

## Architecture

- **Ledger**: Append-only event log with SHA-256 hash chains
- **Projections**: Tenant-supplied JavaScript executed in isolated-vm sandboxes
- **Snapshots**: In-memory cached current state
- **Multi-tenancy**: Row-level security + application-layer tenant scoping

## Stack

- **API**: Serverless functions
- **Database**: PostgreSQL
- **Cache**: Redis
- **SDK**: NPM package (`tannur`)
- **CLI**: Binary (`tannur deploy`, `tannur verify`)

## Local Development

### Prerequisites

- Node.js 18+ (Node.js 20+ requires `NODE_OPTIONS="--no-node-snapshot"` for isolated-vm)
- PostgreSQL database
- Redis instance

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your database and cache credentials:
```bash
DATABASE_URL=your-database-connection-string
CACHE_URL=your-redis-connection-string
```

3. Apply database migrations:
```bash
npm run migrate
```

4. Build packages:
```bash
npm run build
```

5. Run locally:
```bash
npm run dev --workspace=packages/api
```

## Deployment

1. Push to GitHub

2. Configure your hosting platform with environment variables:
   - `DATABASE_URL`
   - `CACHE_URL`

3. Deploy your application

## Usage

### Register a tenant

```bash
curl -X POST https://your-api.vercel.app/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
```

Returns: `{"apiKey":"..."}`

### Emit an event (SDK)

```typescript
import { createClient } from "tannur";

const tn = createClient({ apiKey: "your-key" });

await tn.emit("order_placed", { orderId: 123, amount: 99.99 });
```

### Deploy a projection (CLI)

Create `tannur.config.js`:
```javascript
function project(snapshot, event) {
  const state = snapshot || { total: 0 };
  if (event.eventName === "order_placed") {
    state.total += event.payload.amount;
  }
  return state;
}
```

Deploy:
```bash
export TANNUR_API_KEY=your-key
tannur deploy
```

### Query state (SDK)

```typescript
const state = await tn.getState("default");
console.log(state); // { total: 99.99 }
```

### Verify hash chain (CLI)

```bash
tannur verify default
```

## Project Structure

```
packages/
  api/          Vercel serverless functions
  sdk/          NPM package (tannur)
  cli/          Binary (tannur deploy, verify)
  shared/       Shared types and utilities
supabase/
  migrations/   Database schema
```

## Testing

```bash
npm test
```

## License

apache