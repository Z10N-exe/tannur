import { createHash } from "crypto";

export const GENESIS_HASH = "0".repeat(64);

export interface HashFields {
  streamId: string;
  sequenceNumber: number;
  eventName: string;
  payloadJson: string;
  previousHash: string;
  timestamp: string; // ISO 8601 UTC
}

/**
 * Computes the SHA-256 hash for an event record.
 *
 * Formula (Requirements 2.3):
 *   SHA-256(stream_id:sequence_number:event_name:payload_json:previous_hash:timestamp)
 *
 * This function is pure and shared between the Ledger Service (API) and the
 * CLI `verify` command so both use identical hash logic.
 */
export function computeHash(fields: HashFields): string {
  const input = [
    fields.streamId,
    fields.sequenceNumber.toString(),
    fields.eventName,
    fields.payloadJson,
    fields.previousHash,
    fields.timestamp,
  ].join(":");

  return createHash("sha256").update(input).digest("hex");
}
