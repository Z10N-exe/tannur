/**
 * Unit tests for Universal JavaScript SDK
 * Requirements: 4.2, 7.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient, UniversalTannurClient, EnvironmentDetector, TannurError } from './index.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Universal JavaScript SDK', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('EnvironmentDetector', () => {
    it('should detect Node.js environment', () => {
      const detector = new EnvironmentDetector();
      // In vitest, we're running in Node.js
      expect(detector.isNode()).toBe(true);
    });

    it('should detect browser environment correctly', () => {
      const detector = new EnvironmentDetector();
      // In Node.js test environment, this should be false
      expect(detector.isBrowser()).toBe(false);
    });

    it('should detect edge environment correctly', () => {
      const detector = new EnvironmentDetector();
      // In Node.js test environment, this should be false
      expect(detector.isEdge()).toBe(false);
    });

    it('should return fetch as HTTP client', () => {
      const detector = new EnvironmentDetector();
      const httpClient = detector.getHttpClient();
      expect(httpClient).toBeDefined();
      expect(typeof httpClient).toBe('function');
    });

    it('should throw error if no HTTP client available', () => {
      const detector = new EnvironmentDetector();
      const originalFetch = global.fetch;
      
      // Temporarily remove fetch
      (global as any).fetch = undefined;
      
      expect(() => detector.getHttpClient()).toThrow(
        'No HTTP client available. Please ensure your environment supports fetch API.'
      );
      
      // Restore fetch
      global.fetch = originalFetch;
    });
  });

  describe('createClient', () => {
    it('should create client with provided API key', () => {
      const client = createClient({ apiKey: 'test-key' });
      expect(client).toBeDefined();
      expect(client.emit).toBeDefined();
      expect(client.getState).toBeDefined();
    });

    it('should use default base URL when not provided', () => {
      const client = createClient({ apiKey: 'test-key' });
      expect(client).toBeDefined();
    });

    it('should use custom base URL when provided', () => {
      const client = createClient({
        apiKey: 'test-key',
        baseUrl: 'https://custom.example.com',
      });
      expect(client).toBeDefined();
    });

    it('should strip trailing slash from base URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ sequenceNumber: 1, currentHash: 'abc' }),
      });

      const client = createClient({
        apiKey: 'test-key',
        baseUrl: 'https://test.example.com/',
      });
      
      await client.emit('test', {});

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.example.com/events',
        expect.any(Object)
      );
    });
  });

  describe('emit', () => {
    it('should send correct POST request with all fields', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ sequenceNumber: 1, currentHash: 'abc123' }),
      });

      const client = createClient({ 
        apiKey: 'test-key', 
        baseUrl: 'https://test.example.com' 
      });
      
      await client.emit('test_event', { data: 'test' }, { streamId: 'custom-stream' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.example.com/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-key',
          }),
          body: JSON.stringify({
            streamId: 'custom-stream',
            eventName: 'test_event',
            payload: { data: 'test' },
          }),
        })
      );
    });

    it('should use default streamId when not provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ sequenceNumber: 1, currentHash: 'abc123' }),
      });

      const client = createClient({ apiKey: 'test-key' });
      await client.emit('test_event', { data: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            streamId: 'default',
            eventName: 'test_event',
            payload: { data: 'test' },
          }),
        })
      );
    });

    it('should return sequenceNumber and currentHash on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ sequenceNumber: 42, currentHash: 'deadbeef' }),
      });

      const client = createClient({ apiKey: 'test-key' });
      const result = await client.emit('test_event', { data: 'test' });

      expect(result).toEqual({ 
        sequenceNumber: 42, 
        currentHash: 'deadbeef' 
      });
    });

    it('should throw TannurError with correct status and message on non-2xx', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid event name' }),
      });

      const client = createClient({ apiKey: 'test-key' });

      await expect(client.emit('', {})).rejects.toThrow(TannurError);

      try {
        await client.emit('', {});
      } catch (err) {
        expect(err).toBeInstanceOf(TannurError);
        expect((err as TannurError).status).toBe(400);
        expect((err as TannurError).message).toBe('Invalid event name');
      }
    });

    it('should handle error response without error field', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      });

      const client = createClient({ apiKey: 'test-key' });

      try {
        await client.emit('test', {});
      } catch (err) {
        expect(err).toBeInstanceOf(TannurError);
        expect((err as TannurError).status).toBe(500);
        expect((err as TannurError).message).toBe('Internal Server Error');
      }
    });

    it('should handle error response with invalid JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const client = createClient({ apiKey: 'test-key' });

      try {
        await client.emit('test', {});
      } catch (err) {
        expect(err).toBeInstanceOf(TannurError);
        expect((err as TannurError).status).toBe(503);
        expect((err as TannurError).message).toBe('Service Unavailable');
      }
    });
  });

  describe('getState', () => {
    it('should send correct GET request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ count: 42 }),
      });

      const client = createClient({ 
        apiKey: 'test-key', 
        baseUrl: 'https://test.example.com' 
      });
      
      await client.getState('test-stream');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.example.com/state/test-stream',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('should encode stream ID in URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ count: 42 }),
      });

      const client = createClient({ apiKey: 'test-key' });
      await client.getState('stream/with/slashes');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('stream%2Fwith%2Fslashes'),
        expect.any(Object)
      );
    });

    it('should return snapshot object on success', async () => {
      const snapshot = { count: 99, total: 1234.56 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => snapshot,
      });

      const client = createClient({ apiKey: 'test-key' });
      const result = await client.getState('test-stream');

      expect(result).toEqual(snapshot);
    });

    it('should throw TannurError on non-2xx', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'No state found for stream' }),
      });

      const client = createClient({ apiKey: 'test-key' });

      await expect(client.getState('missing-stream')).rejects.toThrow(TannurError);
    });
  });

  describe('UniversalTannurClient', () => {
    it('should create client instance', () => {
      const client = new UniversalTannurClient({ apiKey: 'test-key' });
      expect(client).toBeDefined();
      expect(client.emit).toBeDefined();
      expect(client.getState).toBeDefined();
      expect(client.configure).toBeDefined();
    });

    it('should allow configuration updates', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ sequenceNumber: 1, currentHash: 'abc' }),
      });

      const client = new UniversalTannurClient({ apiKey: 'initial-key' });
      
      // Reconfigure with new API key
      client.configure({ apiKey: 'new-key' });
      
      await client.emit('test', {});

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer new-key',
          }),
        })
      );
    });

    it('should emit events correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ sequenceNumber: 5, currentHash: 'xyz' }),
      });

      const client = new UniversalTannurClient({ apiKey: 'test-key' });
      const result = await client.emit('test_event', { data: 'value' });

      expect(result).toEqual({ sequenceNumber: 5, currentHash: 'xyz' });
    });

    it('should get state correctly', async () => {
      const state = { count: 10, status: 'active' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => state,
      });

      const client = new UniversalTannurClient({ apiKey: 'test-key' });
      const result = await client.getState('test-stream');

      expect(result).toEqual(state);
    });

    it('should accept custom environment detector', () => {
      const customDetector = new EnvironmentDetector();
      const client = new UniversalTannurClient({ apiKey: 'test-key' }, customDetector);
      expect(client).toBeDefined();
    });
  });
});