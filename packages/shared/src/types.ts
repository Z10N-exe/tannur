// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthContext {
  tenantId: string;
}

// ─── CLI Authentication ──────────────────────────────────────────────────────

export interface CliSessionStart {
  sessionId: string;
  authUrl: string;
  expiresAt: string; // ISO 8601 UTC
}

export interface CliSessionPoll {
  status: "pending" | "completed" | "expired";
  apiKey?: string; // Only present when status is "completed"
}

export interface CliSessionComplete {
  sessionId: string;
  apiKey: string;
}

// ─── Ledger ───────────────────────────────────────────────────────────────────

export interface AppendEventInput {
  tenantId: string;
  streamId: string;
  eventName: string;
  payload: Record<string, unknown>;
  serverTimestamp: Date;
}

export interface AppendedEvent {
  sequenceNumber: number;
  currentHash: string;
  previousHash: string;
}

/** Raw event row as stored in the database (used by CLI verify and events fetch route) */
export interface StoredEvent {
  id: string;
  tenantId: string;
  streamId: string;
  sequenceNumber: number;
  eventName: string;
  payload: Record<string, unknown>;
  previousHash: string;
  currentHash: string;
  createdAt: string; // ISO 8601 UTC
}

// ─── Projection ───────────────────────────────────────────────────────────────

export interface ProjectionInput {
  tenantId: string;
  streamId: string;
  currentSnapshot: Record<string, unknown> | null;
  newEvent: {
    eventName: string;
    payload: Record<string, unknown>;
    sequenceNumber: number;
  };
}

export interface ProjectionResult {
  snapshot: Record<string, unknown>;
}

// ─── SDK / Client ─────────────────────────────────────────────────────────────

export interface TannurConfig {
  apiKey?: string; // Optional - can be resolved from env or global config
  /** Defaults to https://api.tannur.xyz */
  baseUrl?: string;
}

export interface EmitResult {
  sequenceNumber: number;
  currentHash: string;
}

export interface TannurClient {
  emit(
    eventName: string,
    payload: Record<string, unknown>,
    options?: { streamId?: string }
  ): Promise<EmitResult>;
  getState(streamId: string): Promise<Record<string, unknown>>;
}
