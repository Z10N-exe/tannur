/**
 * Property Test: Monorepo Structure and Package Isolation
 * 
 * Feature: multi-platform-sdks
 * Property 1: Package isolation and dependency management
 * Validates: Requirements 7.1
 * 
 * This test validates that the monorepo structure maintains proper
 * package isolation and dependency management across all SDK packages.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

describe('Property 1: Monorepo Structure - Package Isolation and Dependency Management', () => {
  const packagesDir = join(process.cwd(), 'packages');
  const expectedSDKPackages = [
    'universal-sdk',
    'react-sdk',
    'react-native-sdk',
    'sveltekit-sdk',
    'go-sdk',
    'python-sdk',
    'shared'
  ];

  it('should have all required SDK package directories', () => {
    const packages = readdirSync(packagesDir).filter(name => {
      const path = join(packagesDir, name);
      return statSync(path).isDirectory();
    });

    expectedSDKPackages.forEach(sdkPackage => {
      expect(packages).toContain(sdkPackage);
    });
  });

  it('should have valid package.json for JavaScript SDKs', () => {
    const jsSDKs = ['universal-sdk', 'react-sdk', 'react-native-sdk', 'sveltekit-sdk', 'shared'];
    
    jsSDKs.forEach(sdk => {
      const packageJsonPath = join(packagesDir, sdk, 'package.json');
      expect(existsSync(packageJsonPath), `${sdk}/package.json should exist`).toBe(true);
      
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // Validate required fields
      expect(packageJson.name, `${sdk} should have a name`).toBeDefined();
      expect(packageJson.version, `${sdk} should have a version`).toBeDefined();
      
      // Validate build script exists (except for shared which might have different setup)
      if (sdk !== 'shared') {
        expect(packageJson.scripts?.build, `${sdk} should have a build script`).toBeDefined();
      }
    });
  });

  it('should have valid go.mod for Go SDK', () => {
    const goModPath = join(packagesDir, 'go-sdk', 'go.mod');
    expect(existsSync(goModPath), 'go-sdk/go.mod should exist').toBe(true);
    
    const goModContent = readFileSync(goModPath, 'utf-8');
    expect(goModContent).toContain('module github.com/tannur/go-sdk');
    expect(goModContent).toContain('go 1.21');
  });

  it('should have valid pyproject.toml for Python SDK', () => {
    const pyprojectPath = join(packagesDir, 'python-sdk', 'pyproject.toml');
    expect(existsSync(pyprojectPath), 'python-sdk/pyproject.toml should exist').toBe(true);
    
    const pyprojectContent = readFileSync(pyprojectPath, 'utf-8');
    expect(pyprojectContent).toContain('name = "tannur-python"');
    expect(pyprojectContent).toContain('requires-python = ">=3.8"');
  });

  it('should maintain proper dependency isolation - JavaScript SDKs depend on shared', () => {
    const jsSDKs = ['universal-sdk', 'react-sdk', 'react-native-sdk', 'sveltekit-sdk'];
    
    jsSDKs.forEach(sdk => {
      const packageJsonPath = join(packagesDir, sdk, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // All JavaScript SDKs should depend on @tannur/shared
      expect(
        packageJson.dependencies?.['@tannur/shared'],
        `${sdk} should depend on @tannur/shared`
      ).toBeDefined();
    });
  });

  it('should maintain proper dependency chain - framework SDKs depend on universal', () => {
    const frameworkSDKs = ['react-sdk', 'react-native-sdk', 'sveltekit-sdk'];
    
    frameworkSDKs.forEach(sdk => {
      const packageJsonPath = join(packagesDir, sdk, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // Framework SDKs should depend on universal SDK
      expect(
        packageJson.dependencies?.['tannur-universal'],
        `${sdk} should depend on tannur-universal`
      ).toBeDefined();
    });
  });

  it('should have shared API specification file', () => {
    const apiSpecPath = join(packagesDir, 'shared', 'src', 'api-spec.ts');
    expect(existsSync(apiSpecPath), 'shared/src/api-spec.ts should exist').toBe(true);
    
    const apiSpecContent = readFileSync(apiSpecPath, 'utf-8');
    
    // Validate core interfaces are exported
    expect(apiSpecContent).toContain('export interface EmitOptions');
    expect(apiSpecContent).toContain('export interface HttpClient');
    expect(apiSpecContent).toContain('export interface EnvironmentDetector');
  });

  it('should have shared test contracts file', () => {
    const testContractsPath = join(packagesDir, 'shared', 'src', 'test-contracts.ts');
    expect(existsSync(testContractsPath), 'shared/src/test-contracts.ts should exist').toBe(true);
    
    const testContractsContent = readFileSync(testContractsPath, 'utf-8');
    
    // Validate test contract interfaces are exported
    expect(testContractsContent).toContain('export interface SDKTestContract');
    expect(testContractsContent).toContain('export interface TestDataGenerators');
    expect(testContractsContent).toContain('export class CrossPlatformTestSuite');
  });

  it('should have CI/CD configuration for all platforms', () => {
    const ciConfigPath = join(process.cwd(), '.github', 'workflows', 'multi-sdk-ci.yml');
    expect(existsSync(ciConfigPath), '.github/workflows/multi-sdk-ci.yml should exist').toBe(true);
    
    const ciConfig = readFileSync(ciConfigPath, 'utf-8');
    
    // Validate all SDK types are tested
    expect(ciConfig).toContain('javascript-sdks');
    expect(ciConfig).toContain('go-sdk');
    expect(ciConfig).toContain('python-sdk');
    expect(ciConfig).toContain('integration-tests');
  });

  it('should have proper workspace configuration in root package.json', () => {
    const rootPackageJsonPath = join(process.cwd(), 'package.json');
    const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf-8'));
    
    // Validate workspaces are configured
    expect(rootPackageJson.workspaces).toBeDefined();
    expect(rootPackageJson.workspaces).toContain('packages/*');
    
    // Validate build scripts exist
    expect(rootPackageJson.scripts?.build).toBeDefined();
    expect(rootPackageJson.scripts?.test).toBeDefined();
  });

  it('should have TypeScript base configuration', () => {
    const tsconfigBasePath = join(process.cwd(), 'tsconfig.base.json');
    expect(existsSync(tsconfigBasePath), 'tsconfig.base.json should exist').toBe(true);
    
    const tsconfigBase = JSON.parse(readFileSync(tsconfigBasePath, 'utf-8'));
    
    // Validate essential compiler options
    expect(tsconfigBase.compilerOptions).toBeDefined();
    expect(tsconfigBase.compilerOptions.strict).toBe(true);
    expect(tsconfigBase.compilerOptions.declaration).toBe(true);
  });

  it('should have test setup files for integration and performance testing', () => {
    const integrationSetupPath = join(process.cwd(), 'test-setup', 'integration.setup.ts');
    const performanceSetupPath = join(process.cwd(), 'test-setup', 'performance.setup.ts');
    
    expect(existsSync(integrationSetupPath), 'test-setup/integration.setup.ts should exist').toBe(true);
    expect(existsSync(performanceSetupPath), 'test-setup/performance.setup.ts should exist').toBe(true);
  });

  it('should have vitest configuration for integration and performance tests', () => {
    const integrationConfigPath = join(process.cwd(), 'vitest.integration.config.ts');
    const performanceConfigPath = join(process.cwd(), 'vitest.performance.config.ts');
    
    expect(existsSync(integrationConfigPath), 'vitest.integration.config.ts should exist').toBe(true);
    expect(existsSync(performanceConfigPath), 'vitest.performance.config.ts should exist').toBe(true);
  });
});