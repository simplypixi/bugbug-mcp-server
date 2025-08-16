import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getTestRunsTool,
  getTestRunTool,
  getTestRunStatusTool,
  getTestRunScreenshotsTool,
  stopTestRunTool
} from '../testRuns.js';
import * as bugbugClientModule from '../../services/bugbugClient.js';

describe('BugBug Test Run Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the bugbugClient
    const mockClient = {
      createTestRun: vi.fn(),
      getTestRun: vi.fn(),
      getTestRunStatus: vi.fn(),
      getTestRunScreenshots: vi.fn(),
      stopTestRun: vi.fn(),
      getTestRuns: vi.fn(),
    };
    vi.spyOn(bugbugClientModule, 'bugbugClient', 'get').mockReturnValue(mockClient as unknown as typeof bugbugClientModule.bugbugClient);
    
    // Set API_KEY environment variable
    process.env.BUGBUG_API_TOKEN = 'test-token';
  });

  it('should export all test run tools', () => {
    // Assert - Check that all tools are properly exported
    expect(getTestRunsTool).toBeDefined();
    expect(getTestRunTool).toBeDefined();
    expect(getTestRunStatusTool).toBeDefined();
    expect(getTestRunScreenshotsTool).toBeDefined();
    expect(stopTestRunTool).toBeDefined();
    
    // Check tool properties
    expect(getTestRunsTool.name).toBe('get_test_runs');
    expect(getTestRunTool.name).toBe('get_test_run');
    expect(getTestRunStatusTool.name).toBe('get_test_run_status');
    expect(getTestRunScreenshotsTool.name).toBe('get_test_run_screenshots');
    expect(stopTestRunTool.name).toBe('stop_test_run');
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
    bugbugClientModule.bugbugClient.getTestRun = vi.fn().mockResolvedValue(mockResponse);

    // Act
    const result = await getTestRunTool.handler({ runId: 'test-run-123' });

    // Assert
    expect(bugbugClientModule.bugbugClient.getTestRun).toHaveBeenCalledWith('test-run-123');
    expect(result.content[0].text).toContain('Test run "Login Test" has finished with status "passed"');
    expect(result.content[0].text).toContain('Login Test');
    expect(result.content[0].text).toContain('passed');
    expect(result.content[0].text).toContain('<name>goto</name>');
    expect(result.content[0].text).toContain('<name>click</name>');
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
    bugbugClientModule.bugbugClient.getTestRunStatus = vi.fn().mockResolvedValue(mockResponse);

    // Act
    const result = await getTestRunStatusTool.handler({ runId: 'test-run-123' });

    // Assert
    expect(bugbugClientModule.bugbugClient.getTestRunStatus).toHaveBeenCalledWith('test-run-123');
    expect(result.content[0].text).toContain('Test Run Status');
    expect(result.content[0].text).toContain('running');
    expect(result.content[0].text).toContain('test-run-123');
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    bugbugClientModule.bugbugClient.getTestRun = vi.fn().mockResolvedValue({
      status: 404,
      statusText: 'Not Found',
    });

    // Act
    const result = await getTestRunTool.handler({ runId: 'invalid-test-id' });

    // Assert
    expect(result.content[0].text).toBe('Error: 404 Not Found');
  });

  it('should handle network errors gracefully', async () => {
    // Arrange
    bugbugClientModule.bugbugClient.getTestRun = vi.fn().mockRejectedValue(new Error('Connection timeout'));

    // Act
    const result = await getTestRunTool.handler({ runId: 'test-run-123' });

    // Assert
    expect(result.content[0].text).toContain('Error fetching test run');
    expect(result.content[0].text).toContain('Connection timeout');
  });
});
