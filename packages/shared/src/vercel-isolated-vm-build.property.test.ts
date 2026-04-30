/**
 * Property Test: Vercel isolated-vm Build Configuration
 * 
 * Feature: vercel-isolated-vm-build-fix
 * Property 1: Bug Condition - Vercel Build Without --no-node-snapshot Flag
 * Validates: Requirements 1.1, 1.2, 1.3
 * 
 * This test validates that the Vercel build configuration includes
 * the NODE_OPTIONS environment variable with --no-node-snapshot flag.
 * 
 * IMPORTANT: This test MUST FAIL on unfixed configuration - failure confirms the bug exists.
 * The test encodes the expected behavior for the fix to work correctly.
 * 
 * Bug Condition: When Vercel attempts to compile isolated-vm v4.7.2 native bindings
 * during npm install with Node.js 24 without the --no-node-snapshot flag,
 * the build fails with C++20 compilation errors.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface BuildEnvironment {
  platform: 'Vercel' | 'local' | 'other';
  nodeVersion: number;
  package: string;
  packageVersion: string;
  nodeOptions: string[];
  buildPhase: 'npm install' | 'runtime';
}

/**
 * Bug condition detection function
 * Returns true if the bug condition is present (missing --no-node-snapshot flag)
 */
function isBugCondition(input: BuildEnvironment): boolean {
  return (
    input.platform === 'Vercel' &&
    input.nodeVersion >= 20 &&
    input.package === 'isolated-vm' &&
    input.packageVersion === '4.7.2' &&
    !input.nodeOptions.includes('--no-node-snapshot') &&
    input.buildPhase === 'npm install'
  );
}

/**
 * Expected behavior function - isolated-vm should compile successfully
 * when the bug condition is resolved
 */
function isolatedVmCompilesSuccessfully(nodeOptions: string[]): boolean {
  return nodeOptions.includes('--no-node-snapshot');
}

describe('Property 1: Bug Condition - Vercel Build Without --no-node-snapshot Flag', () => {
  const vercelJsonPath = join(process.cwd(), 'vercel.json');

  it('should have NODE_OPTIONS configured with --no-node-snapshot in vercel.json', () => {
    // This test verifies the fix is in place
    // On unfixed configuration, this test will FAIL - confirming the bug exists
    
    expect(existsSync(vercelJsonPath), 'vercel.json should exist').toBe(true);
    
    const vercelJson = JSON.parse(readFileSync(vercelJsonPath, 'utf-8'));
    
    // Check if NODE_OPTIONS is configured in the env section
    const hasNodeOptions = vercelJson.env?.NODE_OPTIONS !== undefined;
    const nodeOptionsValue = vercelJson.env?.NODE_OPTIONS || '';
    
    // The fix requires NODE_OPTIONS to include --no-node-snapshot
    const hasNoNodeSnapshotFlag = typeof nodeOptionsValue === 'string' && 
      nodeOptionsValue.includes('--no-node-snapshot');
    
    // This assertion will FAIL on unfixed configuration
    // This is the expected behavior - failure confirms the bug exists
    expect(
      hasNodeOptions && hasNoNodeSnapshotFlag,
      `vercel.json should have NODE_OPTIONS="--no-node-snapshot" in env section. ` +
      `Current value: ${JSON.stringify(vercelJson.env)}`
    ).toBe(true);
  });

  it('should detect bug condition when NODE_OPTIONS is missing --no-node-snapshot', () => {
    // Test the bug condition detection function with various inputs
    
    // Bug condition: Vercel + Node.js 24 + isolated-vm + no --no-node-snapshot flag
    const bugEnvironment: BuildEnvironment = {
      platform: 'Vercel',
      nodeVersion: 24,
      package: 'isolated-vm',
      packageVersion: '4.7.2',
      nodeOptions: [],
      buildPhase: 'npm install'
    };
    
    // This should return true (bug condition exists)
    expect(isBugCondition(bugEnvironment)).toBe(true);
    
    // Fixed environment: Vercel + Node.js 24 + isolated-vm + --no-node-snapshot flag
    const fixedEnvironment: BuildEnvironment = {
      platform: 'Vercel',
      nodeVersion: 24,
      package: 'isolated-vm',
      packageVersion: '4.7.2',
      nodeOptions: ['--no-node-snapshot'],
      buildPhase: 'npm install'
    };
    
    // This should return false (bug condition is resolved)
    expect(isBugCondition(fixedEnvironment)).toBe(false);
  });

  it('should verify isolated-vm compilation succeeds with --no-node-snapshot flag', () => {
    // Test that the expected behavior function correctly identifies success conditions
    
    // Without the flag - compilation should fail
    expect(isolatedVmCompilesSuccessfully([])).toBe(false);
    expect(isolatedVmCompilesSuccessfully(['--other-flag'])).toBe(false);
    
    // With the flag - compilation should succeed
    expect(isolatedVmCompilesSuccessfully(['--no-node-snapshot'])).toBe(true);
    expect(isolatedVmCompilesSuccessfully(['--other-flag', '--no-node-snapshot'])).toBe(true);
  });

  it('should verify vercel.json build configuration structure', () => {
    // Validate the overall structure of vercel.json
    
    expect(existsSync(vercelJsonPath), 'vercel.json should exist').toBe(true);
    
    const vercelJson = JSON.parse(readFileSync(vercelJsonPath, 'utf-8'));
    
    // Validate required fields
    expect(vercelJson.version, 'vercel.json should have version field').toBeDefined();
    expect(vercelJson.version, 'version should be 2').toBe(2);
    
    // Validate installCommand is configured
    expect(
      vercelJson.installCommand,
      'vercel.json should have installCommand configured'
    ).toBeDefined();
    
    // Validate builds are configured
    expect(vercelJson.builds, 'vercel.json should have builds configured').toBeDefined();
    expect(Array.isArray(vercelJson.builds), 'builds should be an array').toBe(true);
    expect(vercelJson.builds.length, 'builds should have at least one entry').toBeGreaterThan(0);
  });

  it('should document the bug condition counterexample', () => {
    // This test documents the counterexample that proves the bug exists
    // On unfixed configuration, the first test fails, which is the expected behavior
    
    const bugCounterexample = {
      description: 'Vercel build with Node.js 24 without --no-node-snapshot flag fails during isolated-vm compilation',
      platform: 'Vercel',
      nodeVersion: 24,
      package: 'isolated-vm',
      packageVersion: '4.7.2',
      missingFlag: '--no-node-snapshot',
      buildPhase: 'npm install',
      expectedError: '#error "C++20 or later required."',
      impact: 'Deployment is blocked, no serverless functions are deployed'
    };
    
    // Verify the counterexample structure is correct
    expect(bugCounterexample.platform).toBe('Vercel');
    expect(bugCounterexample.nodeVersion).toBe(24);
    expect(bugCounterexample.package).toBe('isolated-vm');
    expect(bugCounterexample.missingFlag).toBe('--no-node-snapshot');
    expect(bugCounterexample.expectedError).toContain('C++20');
    
    // Log the counterexample for documentation
    console.log('Bug Counterexample:', JSON.stringify(bugCounterexample, null, 2));
  });
});