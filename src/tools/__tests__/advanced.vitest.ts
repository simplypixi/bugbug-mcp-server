import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  waitForTestRunTool,
  waitForSuiteRunTool,
  showRunFromLast24Tool,
  runTestByNameOrIdTool
} from '../advanced.js';
import * as bugbugClientModule from '../../services/bugbugClient.js';

describe('BugBug Advanced Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the bugbugClient
    const mockClient = {
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
    vi.spyOn(bugbugClientModule, 'bugbugClient', 'get').mockReturnValue(mockClient as unknown as typeof bugbugClientModule.bugbugClient);
    
    // Set API_KEY environment variable
    process.env.API_KEY = 'test-token';
  });

  it('should export all advanced tools with correct properties', () => {
    // Assert that all 4 tools are properly exported
    expect(waitForTestRunTool).toBeDefined();
    expect(waitForSuiteRunTool).toBeDefined();
    expect(showRunFromLast24Tool).toBeDefined();
    expect(runTestByNameOrIdTool).toBeDefined();
    
    // Check tool names
    expect(waitForTestRunTool.name).toBe('wait_for_test_run');
    expect(waitForSuiteRunTool.name).toBe('wait_for_suite_run');
    expect(showRunFromLast24Tool.name).toBe('show_run_from_last_24');
    expect(runTestByNameOrIdTool.name).toBe('run_test_by_name_or_id');
    
    // Check tool descriptions
    expect(waitForTestRunTool.description).toBe('Waits until test run finished, returns full test run data as result');
    expect(waitForSuiteRunTool.description).toBe('Waits until suite run finished, returns full suite run data as result');
    expect(showRunFromLast24Tool.description).toBe('Shows tests/suites runs from last 24 hours');
    expect(runTestByNameOrIdTool.description).toBe('Run test by name or ID - automatically finds test by name if not a UUID');
  });
});
