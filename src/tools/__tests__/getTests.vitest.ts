import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerGetTestsTool } from '../getTests.js';
import { promises as fs } from 'fs';
import path from 'path';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
    stat: vi.fn(),
  },
}));

// Mock path module
vi.mock('path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/')),
  },
}));

describe('getTests tool', () => {
  let mockServer: McpServer;
  let toolHandler: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Arrange - Create mock server
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        if (name === 'get_tests') {
          toolHandler = handler;
        }
      }),
    } as any;

    registerGetTestsTool(mockServer);
  });

  it('should register get_tests tool with correct parameters', () => {
    // Assert
    expect(mockServer.tool).toHaveBeenCalledWith(
      'get_tests',
      'Get a list of all test files in the project',
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should find vitest test files', async () => {
    // Arrange
    const mockDirEntries = [
      { name: 'component.vitest.ts', isDirectory: () => false, isFile: () => true },
      { name: 'utils.vitest.tsx', isDirectory: () => false, isFile: () => true },
      { name: 'regular.ts', isDirectory: () => false, isFile: () => true },
    ];

    vi.mocked(fs.readdir).mockResolvedValue(mockDirEntries as any);
    vi.mocked(fs.stat).mockResolvedValue({ size: 1024 } as any);

    // Act
    const result = await toolHandler({ directory: '/test/dir' });

    // Assert
    expect(result.content[0].text).toContain('Found 2 test file(s)');
    expect(result.content[0].text).toContain('Vitest Tests (2)');
    expect(result.content[0].text).toContain('component.vitest.ts');
    expect(result.content[0].text).toContain('utils.vitest.tsx');
  });

  it('should find jest test files', async () => {
    // Arrange
    const mockDirEntries = [
      { name: 'component.test.ts', isDirectory: () => false, isFile: () => true },
      { name: 'utils.spec.js', isDirectory: () => false, isFile: () => true },
    ];

    vi.mocked(fs.readdir).mockResolvedValue(mockDirEntries as any);
    vi.mocked(fs.stat).mockResolvedValue({ size: 512 } as any);

    // Act
    const result = await toolHandler({ directory: '/test/dir' });

    // Assert
    expect(result.content[0].text).toContain('Found 2 test file(s)');
    expect(result.content[0].text).toContain('Jest Tests (2)');
    expect(result.content[0].text).toContain('component.test.ts');
    expect(result.content[0].text).toContain('utils.spec.js');
  });

  it('should find test files in __tests__ directory', async () => {
    // Arrange
    const mockDirEntries = [
      { name: '__tests__', isDirectory: () => true, isFile: () => false },
    ];

    const mockTestDirEntries = [
      { name: 'component.ts', isDirectory: () => false, isFile: () => true },
    ];

    vi.mocked(fs.readdir)
      .mockResolvedValueOnce(mockDirEntries as any)
      .mockResolvedValueOnce(mockTestDirEntries as any);
    vi.mocked(fs.stat).mockResolvedValue({ size: 256 } as any);

    // Act
    const result = await toolHandler({ directory: '/test/dir' });

    // Assert
    expect(result.content[0].text).toContain('Found 1 test file(s)');
    expect(result.content[0].text).toContain('component.ts');
  });

  it('should return message when no test files found', async () => {
    // Arrange
    const mockDirEntries = [
      { name: 'regular.ts', isDirectory: () => false, isFile: () => true },
      { name: 'component.tsx', isDirectory: () => false, isFile: () => true },
    ];

    vi.mocked(fs.readdir).mockResolvedValue(mockDirEntries as any);

    // Act
    const result = await toolHandler({ directory: '/test/dir' });

    // Assert
    expect(result.content[0].text).toBe('No test files found in the specified directory.');
  });

  it('should handle directory read errors gracefully', async () => {
    // Arrange
    vi.mocked(fs.readdir).mockRejectedValue(new Error('Permission denied'));

    // Act
    const result = await toolHandler({ directory: '/invalid/dir' });

    // Assert
    expect(result.content[0].text).toContain('Error scanning for test files');
    expect(result.content[0].text).toContain('Permission denied');
  });

  it('should use current working directory when no directory specified', async () => {
    // Arrange
    const originalCwd = process.cwd;
    process.cwd = vi.fn().mockReturnValue('/current/dir');
    
    const mockDirEntries = [
      { name: 'test.vitest.ts', isDirectory: () => false, isFile: () => true },
    ];

    vi.mocked(fs.readdir).mockResolvedValue(mockDirEntries as any);
    vi.mocked(fs.stat).mockResolvedValue({ size: 128 } as any);

    // Act
    const result = await toolHandler({});

    // Assert
    expect(fs.readdir).toHaveBeenCalledWith('/current/dir', { withFileTypes: true });
    expect(result.content[0].text).toContain('Found 1 test file(s)');
    
    // Cleanup
    process.cwd = originalCwd;
  });

  it('should categorize mixed test file types correctly', async () => {
    // Arrange
    const mockDirEntries = [
      { name: 'component.vitest.ts', isDirectory: () => false, isFile: () => true },
      { name: 'utils.test.js', isDirectory: () => false, isFile: () => true },
      { name: 'integration.spec.ts', isDirectory: () => false, isFile: () => true },
    ];

    vi.mocked(fs.readdir).mockResolvedValue(mockDirEntries as any);
    vi.mocked(fs.stat).mockResolvedValue({ size: 1024 } as any);

    // Act
    const result = await toolHandler({ directory: '/test/dir' });

    // Assert
    expect(result.content[0].text).toContain('Found 3 test file(s)');
    expect(result.content[0].text).toContain('Vitest Tests (1)');
    expect(result.content[0].text).toContain('Jest Tests (2)');
    expect(result.content[0].text).toContain('component.vitest.ts');
    expect(result.content[0].text).toContain('utils.test.js');
    expect(result.content[0].text).toContain('integration.spec.ts');
  });
});
