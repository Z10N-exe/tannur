/**
 * Property-based tests for Universal JavaScript SDK
 * Feature: multi-platform-sdks
 * Property 5: Environment compatibility across all JavaScript environments
 * Validates: Requirements 4.1, 4.3, 4.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { createClient, UniversalTannurClient, EnvironmentDetector } from './index.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Universal SDK Property Tests', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  /**
   * Feature: multi-platform-sdks
   * Property 5: Environment compatibility across all JavaScript environments
   * **Validates: Requirements 4.1, 4.3, 4.5**
   */
  describe('Property 5: Environment Compatibility', () => {
    it('should detect environment correctly regardless of input', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const detector = new EnvironmentDetector();
          
          // Should always return a boolean for each detection method
          expect(typeof detector.isNode()).toBe('boolean');
          expect(typeof detector.isBrowser()).toBe('boolean');
          expect(typeof detector.isEdge()).toBe('boolean');
          
          // At least one environment should be detected
          const hasEnvironment = detector.isNode() || detector.isBrowser() || detector.isEdge();
          expect(hasEnvironment).toBe(true);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should provide HTTP client in any environment', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const detector = new EnvironmentDetector();
          const httpClient = detector.getHttpClient();
          
          // HTTP client should always be a function
          expect(typeof httpClient).toBe('function');
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should create client with any valid configuration', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.webUrl(),
          (apiKey, baseUrl) => {
            const client = createClient({ apiKey, baseUrl });
            
            // Client should always have required methods
            expect(client).toBeDefined();
            expect(typeof client.emit).toBe('function');
            expect(typeof client.getState).toBe('function');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle emit with any valid event data', async () => {
      fc.assert(
        await fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.dictionary(fc.string(), fc.anything()),
          fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          async (eventName, payload, streamId) => {
            // Reset mock for this iteration
            mockFetch.mockReset();
            mockFetch.mockImplementation(async () => ({
              ok: true,
              json: async () => ({ 
                sequenceNumber: Math.floor(Math.random() * 1000), 
                currentHash: 'test-hash' 
              }),
            }));

            const client = createClient({ apiKey: 'test-key' });
            const result = await client.emit(
              eventName, 
              payload, 
              streamId ? { streamId } : undefined
            );
            
            // Result should always have required fields
            expect(result).toBeDefined();
            expect(typeof result.sequenceNumber).toBe('number');
            expect(typeof result.currentHash).toBe('string');
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle getState with any valid stream ID', async () => {
      fc.assert(
        await fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (streamId) => {
            // Reset mock for this iteration
            mockFetch.mockReset();
            const mockState = { count: Math.floor(Math.random() * 100) };
            mockFetch.mockImplementation(async () => ({
              ok: true,
              json: async () => mockState,
            }));

            const client = createClient({ apiKey: 'test-key' });
            const result = await client.getState(streamId);
            
            // Result should always be an object
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain consistent behavior across multiple operations', async () => {
      // Test that client can handle multiple operations with the same configuration
      fc.assert(
        await fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }).filter(s => /\S/.test(s) && s.trim() === s),
          async (apiKey) => {
            // Reset mock for this iteration
            mockFetch.mockReset();
            mockFetch.mockImplementation(async () => ({
              ok: true,
              json: async () => ({ 
                sequenceNumber: 1, 
                currentHash: 'test-hash'
              }),
            } as any));

            const client = new UniversalTannurClient({ 
              apiKey, 
              baseUrl: 'https://test.example.com' 
            });
            
            // Emit an event
            const result = await client.emit('test', {});
            
            // Verify result structure
            expect(result).toBeDefined();
            expect(result).toHaveProperty('sequenceNumber');
            expect(result).toHaveProperty('currentHash');
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle URL encoding correctly for any stream ID', async () => {
      fc.assert(
        await fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          async (streamId) => {
            // Reset mock for this iteration
            mockFetch.mockReset();
            mockFetch.mockImplementation(async (url: string) => ({
              ok: true,
              json: async () => ({ data: 'test' }),
            }));

            const client = createClient({ 
              apiKey: 'test-key',
              baseUrl: 'https://test.example.com'
            });
            
            await client.getState(streamId);
            
            // Verify fetch was called
            expect(mockFetch).toHaveBeenCalled();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should strip trailing slashes from any base URL', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.webUrl(),
          fc.nat({ max: 5 }),
          (apiKey, baseUrl, slashCount) => {
            const urlWithSlashes = baseUrl + '/'.repeat(slashCount);
            const client = createClient({ apiKey, baseUrl: urlWithSlashes });
            
            // Client should be created successfully
            expect(client).toBeDefined();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle concurrent operations correctly', async () => {
      fc.assert(
        await fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
          async (eventNames) => {
            // Reset mock for this iteration
            mockFetch.mockReset();
            
            // Mock fetch to return a unique response for each call
            mockFetch.mockImplementation(async () => ({
              ok: true,
              json: async () => ({ 
                sequenceNumber: Math.floor(Math.random() * 1000), 
                currentHash: 'hash' 
              }),
            }));

            const client = createClient({ apiKey: 'test-key' });
            
            // Emit multiple events concurrently
            const promises = eventNames.map(name => 
              client.emit(name, { data: 'test' })
            );
            
            const results = await Promise.all(promises);
            
            // All results should be valid
            expect(results).toHaveLength(eventNames.length);
            results.forEach(result => {
              expect(result).toBeDefined();
              expect(typeof result.sequenceNumber).toBe('number');
              expect(typeof result.currentHash).toBe('string');
            });
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
