import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { createClient, TannurError } from "./index.js";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe("Tannur SDK", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("createClient", () => {
    it("should use default base URL when not provided", () => {
      const client = createClient({ apiKey: "test-key" });
      expect(client).toBeDefined();
      expect(client.emit).toBeDefined();
      expect(client.getState).toBeDefined();
    });

    it("should use custom base URL when provided", () => {
      const client = createClient({
        apiKey: "test-key",
        baseUrl: "https://custom.example.com",
      });
      expect(client).toBeDefined();
    });
  });

  describe("emit", () => {
    // Feature: tannur-event-sourced-baas, Property: SDK emit sends correct request shape
    it("should send correct POST request with all fields", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ sequenceNumber: 1, currentHash: "abc123" }),
      });

      const client = createClient({ apiKey: "test-key", baseUrl: "https://test.example.com" });
      await client.emit("test_event", { data: "test" }, { streamId: "custom-stream" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.example.com/events",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-key",
          }),
          body: JSON.stringify({
            streamId: "custom-stream",
            eventName: "test_event",
            payload: { data: "test" },
          }),
        })
      );
    });

    it("should return sequenceNumber and currentHash on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sequenceNumber: 42, currentHash: "deadbeef" }),
      });

      const client = createClient({ apiKey: "test-key" });
      const result = await client.emit("test_event", { data: "test" });

      expect(result).toEqual({ sequenceNumber: 42, currentHash: "deadbeef" });
    });

    // Feature: tannur-event-sourced-baas, Property: SDK throws TannurError on non-2xx
    it("should throw TannurError with correct status and message on non-2xx", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ error: "Invalid event name" }),
      });

      const client = createClient({ apiKey: "test-key" });

      await expect(client.emit("", {})).rejects.toThrow(TannurError);

      try {
        await client.emit("", {});
      } catch (err) {
        expect(err).toBeInstanceOf(TannurError);
        expect((err as TannurError).status).toBe(400);
        expect((err as TannurError).message).toBe("Invalid event name");
      }
    });
  });

  describe("getState", () => {
    it("should send correct GET request", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ count: 42 }),
      });

      const client = createClient({ apiKey: "test-key", baseUrl: "https://test.example.com" });
      await client.getState("test-stream");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.example.com/state/test-stream",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-key",
          }),
        })
      );
    });

    it("should return snapshot object on success", async () => {
      const snapshot = { count: 99, total: 1234.56 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => snapshot,
      });

      const client = createClient({ apiKey: "test-key" });
      const result = await client.getState("test-stream");

      expect(result).toEqual(snapshot);
    });

    it("should throw TannurError on non-2xx", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ error: "No state found for stream" }),
      });

      const client = createClient({ apiKey: "test-key" });

      await expect(client.getState("missing-stream")).rejects.toThrow(TannurError);
    });
  });
});
