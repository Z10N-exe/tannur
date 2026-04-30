/**
 * Core API Specification for Tannur Multi-Platform SDKs
 * 
 * This file defines the shared interface extensions and additional types
 * for the multi-platform SDK ecosystem.
 */

import { TannurConfig, EmitResult, TannurClient } from './types.js';
import { TannurError } from './errors.js';

// Re-export core types for convenience
export { TannurConfig, EmitResult, TannurClient, TannurError };

// Extended options interface for emit operations
export interface EmitOptions {
  /** Stream ID for the event. Defaults to "default" if not specified */
  streamId?: string;
}

// Extended client interface with configure method
export interface ExtendedTannurClient extends TannurClient {
  /**
   * Configure the client with new settings
   * @param config Configuration to apply
   */
  configure(config: TannurConfig): void;
}

// Event model for internal use (extends StoredEvent from types.ts)
export interface Event {
  /** Unique identifier for the event */
  id: string;
  /** Stream ID containing the event */
  streamId: string;
  /** Name of the event */
  eventName: string;
  /** Event payload data */
  payload: Record<string, unknown>;
  /** Sequence number in the stream */
  sequenceNumber: number;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** SHA-256 hash of the event */
  hash: string;
}

// HTTP client interface for platform abstraction
export interface HttpClient {
  request<T>(
    method: string,
    url: string,
    options?: {
      headers?: Record<string, string>;
      body?: unknown;
      timeout?: number;
    }
  ): Promise<T>;
}

// Environment detection interface
export interface EnvironmentDetector {
  isNode(): boolean;
  isBrowser(): boolean;
  isEdge(): boolean;
  getHttpClient(): HttpClient;
}