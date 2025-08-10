import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerBugBugAdvancedTools } from '../advanced.js';
import type { BugBugApiClient } from '../../../utils/bugbugClient.js';

interface MockServer {
  tool: ReturnType<typeof vi.fn>;
}

describe('BugBug Advanced Tools', () => {
  let mockServer: MockServer;
  let mockClient: Partial<BugBugApiClient>;

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
    };

    // Create mock server
    mockServer = {
      tool: vi.fn(),
    };

    registerBugBugAdvancedTools(mockServer as never, mockClient as BugBugApiClient);
  });

  it('should register all advanced tools with correct parameters', () => {
    // Assert that all 4 tools are registered
    expect(mockServer.tool).toHaveBeenCalledTimes(4);
    
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
