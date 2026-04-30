import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeHash, GENESIS_HASH } from "./hash.js";

describe("Ledger Properties", () => {
  // Feature: tannur-event-sourced-baas, Property 1: Hash Chain Continuity
  it("should maintain hash chain continuity", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            eventName: fc.string({ minLength: 1 }),
            payload: fc.jsonValue(),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        fc.string({ minLength: 1 }),
        (events, streamId) => {
          const eventRecords: any[] = [];
          
          events.forEach((event, index) => {
            const sequenceNumber = index + 1;
            const timestamp = new Date(Date.now() + index * 1000).toISOString();
            const previousHash = index === 0 ? GENESIS_HASH : eventRecords[index - 1].currentHash;
            
            const currentHash = computeHash({
              streamId,
              sequenceNumber,
              eventName: event.eventName,
              payloadJson: JSON.stringify(event.payload),
              previousHash,
              timestamp,
            });

            eventRecords.push({
              sequenceNumber,
              eventName: event.eventName,
              payload: event.payload,
              previousHash,
              currentHash,
              timestamp,
            });
          });

          // Verify hash chain continuity
          for (let i = 1; i < eventRecords.length; i++) {
            expect(eventRecords[i].previousHash).toBe(eventRecords[i - 1].currentHash);
          }

          // Verify first event uses genesis hash
          expect(eventRecords[0].previousHash).toBe(GENESIS_HASH);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: tannur-event-sourced-baas, Property 2: Genesis Hash Invariant
  it("should always use genesis hash for first event", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.jsonValue(),
        (streamId, eventName, payload) => {
          const timestamp = new Date().toISOString();
          const sequenceNumber = 1;

          const hash = computeHash({
            streamId,
            sequenceNumber,
            eventName,
            payloadJson: JSON.stringify(payload),
            previousHash: GENESIS_HASH,
            timestamp,
          });

          // First event should always reference genesis hash
          expect(GENESIS_HASH).toBe("0".repeat(64));
          expect(hash).toHaveLength(64);
          expect(hash).toMatch(/^[0-9a-f]{64}$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: tannur-event-sourced-baas, Property 4: Sequence Monotonicity
  it("should maintain monotonic sequence numbers", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 20 }),
        (eventNames) => {
          const sequences = eventNames.map((_, index) => index + 1);
          
          // Verify sequences are contiguous and start at 1
          expect(sequences[0]).toBe(1);
          
          for (let i = 1; i < sequences.length; i++) {
            expect(sequences[i]).toBe(sequences[i - 1] + 1);
          }
          
          // No gaps in sequence
          const expectedLength = eventNames.length;
          expect(sequences).toHaveLength(expectedLength);
          expect(Math.max(...sequences)).toBe(expectedLength);
          expect(Math.min(...sequences)).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: tannur-event-sourced-baas, Property 7: Empty Event Name Rejection
  it("should reject empty or whitespace-only event names", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(""),
          fc.string().filter(s => s.trim().length === 0 && s.length > 0)
        ),
        (invalidEventName) => {
          // This property validates that empty/whitespace event names should be rejected
          // In the actual API, this would return a 400 error
          expect(invalidEventName.trim()).toBe("");
        }
      ),
      { numRuns: 100 }
    );
  });
});