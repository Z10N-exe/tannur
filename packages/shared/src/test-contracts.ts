/**
 * Test Contracts for Multi-Platform SDK Consistency
 * 
 * This file defines test contracts that all platform SDKs must pass
 * to ensure API consistency and correctness across platforms.
 */

import { TannurClient, EmitResult, TannurConfig } from './api-spec.js';

// Test data generators for property-based testing
export interface TestDataGenerators {
  /** Generate a random valid event name */
  generateEventName(): string;
  
  /** Generate a random valid payload */
  generatePayload(): Record<string, unknown>;
  
  /** Generate a random valid stream ID */
  generateStreamId(): string;
  
  /** Generate a random valid configuration */
  generateConfig(): TannurConfig;
}

// Core test contract that all SDKs must implement
export interface SDKTestContract {
  /** Create a client instance for testing */
  createClient(config?: TannurConfig): TannurClient;
  
  /** Clean up resources after testing */
  cleanup(): Promise<void>;
  
  /** Get test data generators for this platform */
  getGenerators(): TestDataGenerators;
}

// Property test definitions
export interface PropertyTestSuite {
  /** Test that emit returns consistent results */
  testEmitConsistency(client: TannurClient): Promise<boolean>;
  
  /** Test that getState returns consistent results */
  testGetStateConsistency(client: TannurClient): Promise<boolean>;
  
  /** Test that configuration works correctly */
  testConfigurationConsistency(client: TannurClient): Promise<boolean>;
  
  /** Test error handling consistency */
  testErrorHandlingConsistency(client: TannurClient): Promise<boolean>;
}

// Cross-platform consistency tests
export class CrossPlatformTestSuite {
  private contracts: Map<string, SDKTestContract> = new Map();

  registerSDK(name: string, contract: SDKTestContract): void {
    this.contracts.set(name, contract);
  }

  async testAPIConsistency(): Promise<boolean> {
    const results: Record<string, EmitResult> = {};
    const testEventName = 'test-event';
    const testPayload = { test: 'data', timestamp: Date.now() };
    const testStreamId = 'test-stream';

    // Test emit consistency across all SDKs
    for (const [name, contract] of this.contracts) {
      const client = contract.createClient({
        apiKey: 'test-key',
        baseUrl: 'https://api.test.tannur.dev'
      });

      try {
        const result = await client.emit(testEventName, testPayload, {
          streamId: testStreamId
        });
        results[name] = result;
      } finally {
        await contract.cleanup();
      }
    }

    // Verify all SDKs produced equivalent results
    const resultValues = Object.values(results);
    if (resultValues.length < 2) return true;

    const firstResult = resultValues[0];
    return resultValues.every(result => 
      result.sequenceNumber === firstResult.sequenceNumber &&
      result.currentHash === firstResult.currentHash
    );
  }

  async testErrorHandlingConsistency(): Promise<boolean> {
    const errorResults: Record<string, { status: number; message: string }> = {};

    // Test error handling across all SDKs
    for (const [name, contract] of this.contracts) {
      const client = contract.createClient({
        apiKey: 'invalid-key',
        baseUrl: 'https://api.test.tannur.dev'
      });

      try {
        await client.emit('test-event', {});
        // Should not reach here
        return false;
      } catch (error: any) {
        errorResults[name] = {
          status: error.status || 0,
          message: error.message || ''
        };
      } finally {
        await contract.cleanup();
      }
    }

    // Verify all SDKs produced consistent error information
    const errorValues = Object.values(errorResults);
    if (errorValues.length < 2) return true;

    const firstError = errorValues[0];
    return errorValues.every(error => 
      error.status === firstError.status
    );
  }
}

// Utility functions for test data generation
export const defaultGenerators: TestDataGenerators = {
  generateEventName(): string {
    const names = ['user-created', 'order-placed', 'payment-processed', 'item-updated'];
    return names[Math.floor(Math.random() * names.length)];
  },

  generatePayload(): Record<string, unknown> {
    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      data: {
        value: Math.floor(Math.random() * 1000),
        type: 'test'
      }
    };
  },

  generateStreamId(): string {
    return `stream-${Math.random().toString(36).substr(2, 9)}`;
  },

  generateConfig(): TannurConfig {
    return {
      apiKey: `test-key-${Math.random().toString(36).substr(2, 9)}`,
      baseUrl: 'https://api.test.tannur.dev'
    };
  }
};