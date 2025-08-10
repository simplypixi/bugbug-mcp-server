import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerBugBugTestRunTools } from '../testRuns.js';
import type { BugBugApiClient } from '../../../utils/bugbugClient.js';

interface MockTestRunHandler {
  (args: { runId: string }): Promise<{ content: Array<{ type: string; text: string }> }>;
}

interface MockTestRunStatusHandler {
  (args: { runId: string }): Promise<{ content: Array<{ type: string; text: string }> }>;
}

describe('BugBug Test Run Tools', () => {
  let mockServer: McpServer;
  let mockClient: Partial<BugBugApiClient>;
  let getTestRunHandler: MockTestRunHandler;
  let getTestRunStatusHandler: MockTestRunStatusHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Arrange - Create mock client
    mockClient = {
      createTestRun: vi.fn(),
      getTestRun: vi.fn(),
      getTestRunStatus: vi.fn(),
      getTestRunScreenshots: vi.fn(),
      stopTestRun: vi.fn(),
      getTestRuns: vi.fn(),
    };
    
    // Arrange - Create mock server
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        if (name === 'get_test_run') getTestRunHandler = handler;
        if (name === 'get_test_run_status') getTestRunStatusHandler = handler;
      }),
    } as never;

    registerBugBugTestRunTools(mockServer, mockClient);
  });

  it('should register all test run tools', () => {
    // Assert
    expect(mockServer.tool).toHaveBeenCalledTimes(5);
  });

  it('should successfully get test run details', async () => {
    // Arrange
    const mockResponse = {
      status: 200,
      data: {
        id: 'test-run-123',
        name: 'Login Test',
        status: 'passed',
        duration: '00:02:30',
        details: [
          { id: 'step-1', stepId: 'goto', name: 'goto', status: 'passed' },
          { id: 'step-2', stepId: 'click', name: 'click', status: 'passed' },
        ],
        webappUrl: 'https://app.bugbug.io/run/test-run-123',
      },
    };
    mockClient.getTestRun.mockResolvedValue(mockResponse);

    // Act
    process.env.API_KEY = 'test-token';
    const result = await getTestRunHandler({
      
      runId: 'test-run-123',
    });

    // Assert
    expect(mockClient.getTestRun).toHaveBeenCalledWith('test-run-123');
    expect(result.content[0].text).toContain('Test Run Details');
    expect(result.content[0].text).toContain('Login Test');
    expect(result.content[0].text).toContain('passed');
    expect(result.content[0].text).toContain('Step goto');
    expect(result.content[0].text).toContain('Step click');
  });

  it('should successfully get test run status', async () => {
    // Arrange
    const mockResponse = {
      status: 200,
      data: {
        id: 'test-run-123',
        status: 'running',
        modified: '2024-01-01T10:05:00Z',
        webappUrl: 'https://app.bugbug.io/run/test-run-123',
      },
    };
    mockClient.getTestRunStatus.mockResolvedValue(mockResponse);

    // Act
    process.env.API_KEY = 'test-token';
    process.env.API_KEY = 'test-token';
    const result = await getTestRunStatusHandler({
      runId: 'test-run-123',
    });

    // Assert
    expect(mockClient.getTestRunStatus).toHaveBeenCalledWith('test-run-123');
    expect(result.content[0].text).toContain('Test Run Status');
    expect(result.content[0].text).toContain('running');
    expect(result.content[0].text).toContain('test-run-123');
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    mockClient.getTestRun.mockResolvedValue({
      status: 404,
      statusText: 'Not Found',
    });

    // Act
    process.env.API_KEY = 'test-token';
    const result = await getTestRunHandler({
      
      runId: 'invalid-test-id',
    });

    // Assert
    expect(result.content[0].text).toBe('Error: 404 Not Found');
  });

  it('should handle network errors gracefully', async () => {
    // Arrange
    mockClient.getTestRun.mockRejectedValue(new Error('Connection timeout'));

    // Act
    process.env.API_KEY = 'test-token';
    const result = await getTestRunHandler({
      
      runId: 'test-run-123',
    });

    // Assert
    expect(result.content[0].text).toContain('Error fetching test run');
    expect(result.content[0].text).toContain('Connection timeout');
  });
});
