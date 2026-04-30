import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeHash, GENESIS_HASH } from "./hash.js";

describe("Hash Functions", () => {
  // Feature: tannur-event-sourced-baas, Property 3: Hash Determinism (Round Trip)
  it("should produce deterministic hashes for the same input", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.integer({ min: 1 }),
        fc.string({ minLength: 1 }),
        fc.jsonValue(),
        fc.hexaString({ minLength: 64, maxLength: 64 }),
        fc.date(),
        (streamId, sequenceNumber, eventName, payload, previousHash, timestamp) => {
          const fields = {
            streamId,
            sequenceNumber,
            eventName,
            payloadJson: JSON.stringify(payload),
            previousHash,
            timestamp: timestamp.toISOString(),
          };

          const hash1 = computeHash(fields);
          const hash2 = computeHash(fields);

          expect(hash1).toBe(hash2);
          expect(hash1).toHaveLength(64);
          expect(hash1).toMatch(/^[0-9a-f]{64}$/);
        }
      ),
      { numRuns: 500 }
    );
  });

  it("should produce different hashes for different inputs", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.integer({ min: 1 }),
        fc.string({ minLength: 1 }),
        fc.jsonValue(),
        fc.hexaString({ minLength: 64, maxLength: 64 }),
        fc.date(),
        fc.string({ minLength: 1 }),
        (streamId, sequenceNumber, eventName, payload, previousHash, timestamp, differentStreamId) => {
          fc.pre(streamId !== differentStreamId);

          const fields1 = {
            streamId,
            sequenceNumber,
            eventName,
            payloadJson: JSON.stringify(payload),
            previousHash,
            timestamp: timestamp.toISOString(),
          };

          const fields2 = {
            ...fields1,
            streamId: differentStreamId,
          };

          const hash1 = computeHash(fields1);
          const hash2 = computeHash(fields2);

          expect(hash1).not.toBe(hash2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("genesis hash should be 64 zeroes", () => {
    expect(GENESIS_HASH).toBe("0".repeat(64));
    expect(GENESIS_HASH).toHaveLength(64);
  });
});
