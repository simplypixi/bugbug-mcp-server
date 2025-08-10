import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerBugBugAdvancedTools } from '../advanced.js';
import type { BugBugApiClient } from '../../../utils/bugbugClient.js';

describe('BugBug Advanced Tools', () => {
  let mockServer: McpServer;
  let mockClient: BugBugApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock client
    mockClient = {
      getTestRunStatus: vi.fn(),
      getTestRun: vi.fn(),
      getSuiteRunStatus: vi.fn(),
      getSuiteRun: vi.fn(),
      getTestRuns: vi.fn(),
      getSuites: vi.fn(),
      getTests: vi.fn(),
      getTest: vi.fn(),
      createTestRun: vi.fn(),
    } as any;

    // Create mock server
    mockServer = {
      tool: vi.fn(),
    } as any;

    registerBugBugAdvancedTools(mockServer, mockClient);
  });

  it('should register all advanced tools with correct parameters', () => {
    // Assert that all 5 tools are registered
    expect(mockServer.tool).toHaveBeenCalledTimes(5);
    
    expect(mockServer.tool).toHaveBeenCalledWith(
      'wait_for_test_run',
      'Waits until test run finished, returns full test run data as result',
      expect.any(Object),
      expect.any(Function)
    );
    
    expect(mockServer.tool).toHaveBeenCalledWith(
      'wait_for_suite_run',
      'Waits until suite run finished, returns full suite run data as result',
      expect.any(Object),
      expect.any(Function)
    );
    
    expect(mockServer.tool).toHaveBeenCalledWith(
      'explain_error',
      'Gets test run or suite run error code and checks in docs.bugbug.io details about the issue',
      expect.any(Object),
      expect.any(Function)
    );
    
    expect(mockServer.tool).toHaveBeenCalledWith(
      'show_run_from_last_24',
      'Shows tests/suites runs from last 24 hours',
      expect.any(Object),
      expect.any(Function)
    );
    
    expect(mockServer.tool).toHaveBeenCalledWith(
      'run_test_by_name_or_id',
      'Run test by name or ID - automatically finds test by name if not a UUID',
      expect.any(Object),
      expect.any(Function)
    );
  });
});
