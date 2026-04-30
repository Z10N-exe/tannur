import { computeHash, GENESIS_HASH } from "@tannur/shared";
import type { StoredEvent } from "@tannur/shared";
import { resolveApiKey, BASE_URL } from "../config.js";

/**
 * tannur verify <streamId>
 *
 * Fetches all events for the stream and re-computes the hash chain locally.
 * Exits 0 on a clean chain, exits 1 on the first detected corruption.
 * Requirements: 7.3, 7.4, 7.5
 */
export async function verify(streamId: string): Promise<void> {
  const apiKey = resolveApiKey();

  const res = await fetch(
    `${BASE_URL}/events/${encodeURIComponent(streamId)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) msg = data.error;
    } catch { /* ignore */ }
    console.error(`Error: Could not fetch events (${res.status}): ${msg}`);
    process.exit(1);
  }

  const { events } = (await res.json()) as { events: StoredEvent[] };

  if (events.length === 0) {
    console.log(`Stream "${streamId}" is empty — nothing to verify.`);
    process.exit(0);
  }

  for (const event of events) {
    const expectedPreviousHash =
      event.sequenceNumber === 1
        ? GENESIS_HASH
        : events[event.sequenceNumber - 2].currentHash;

    const recomputed = computeHash({
      streamId: event.streamId,
      sequenceNumber: event.sequenceNumber,
      eventName: event.eventName,
      payloadJson: JSON.stringify(event.payload),
      previousHash: expectedPreviousHash,
      timestamp: event.createdAt,
    });

    if (recomputed !== event.currentHash) {
      console.error(
        `Chain corruption detected at sequence number ${event.sequenceNumber} in stream "${streamId}".`
      );
      process.exit(1);
    }
  }

  console.log(
    `Stream "${streamId}" verified successfully — ${events.length} event(s), chain intact.`
  );
  process.exit(0);
}
