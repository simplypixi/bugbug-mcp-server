import { z } from 'zod';
import { bugbugClient } from '../services/bugbugClient.js';
import { Tool } from '../types/tools.js';
import { BugBugSuiteRun, BugBugTest, BugBugTestRun, isFinishedRunStatus } from '../types/bugbug.types.js';
import { createToolError } from '../utils/tools.js';
import { createTestRunSummary } from '../utils/responses.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export const waitForTestRunTool: Tool = {
  name: 'wait_for_test_run',
  title: 'Wait for test run to finish',
  description: 'Waits until test run finished, returns full test run data as result',
  inputSchema: z.object({
    runId: z.string().describe('Test run UUID to wait for'),
    timeoutMinutes: z.number().optional().default(30).describe('Maximum time to wait in minutes (default: 30)'),
    pollIntervalSeconds: z.number().optional().default(10).describe('Polling interval in seconds (default: 10)'),
  }).shape,
  handler: async ({ runId, timeoutMinutes = 30, pollIntervalSeconds = 10 }) => {
    try {
      const startTime = Date.now();
      const timeoutMs = timeoutMinutes * 60 * 1000;
      const pollIntervalMs = pollIntervalSeconds * 1000;

      while (Date.now() - startTime < timeoutMs) {
        const statusResponse = await bugbugClient.getTestRunStatus(runId);

        if (statusResponse.status !== 200) {
          return {
            content: [
              {
                type: 'text',
                text: `Error checking test run status: ${statusResponse.status} ${statusResponse.statusText}`,
              },
            ],
          };
        }

        if (isFinishedRunStatus(statusResponse.data.status)) {
          const runDetails = await bugbugClient.getTestRun(runId);
          const summary: CallToolResult['content'] = [
            {
              type: 'text',
              text: createTestRunSummary(runDetails.data),
            },
          ];
          const screenshotMessages: CallToolResult['content'] = runDetails.data.screenshots?.map(screenshot => ({
            type: 'image',
            data: screenshot,
            mimeType: 'image/png',
          })) || [];

          return {
            content: [...summary, ...screenshotMessages],
          };
        }

        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }

      return {
        content: [
          {
            type: 'text',
            text: `Test run ${runId} did not finish within ${timeoutMinutes} minutes`,
          },
        ],
      };
    } catch (error) {
      return createToolError(error, 'Error waiting for test run');
    }
  },
};

export const waitForSuiteRunTool: Tool = {
  name: 'wait_for_suite_run',
  title: 'Wait for suite run to finish',
  description: 'Waits until suite run finished, returns full suite run data as result',
  inputSchema: z.object({
    runId: z.string().describe('Suite run UUID to wait for'),
    timeoutMinutes: z.number().optional().default(30).describe('Maximum time to wait in minutes (default: 30)'),
    pollIntervalSeconds: z.number().optional().default(10).describe('Polling interval in seconds (default: 10)'),
  }).shape,
  handler: async ({ runId, timeoutMinutes, pollIntervalSeconds }) => {
    try {
      const timeoutMs = timeoutMinutes * 60 * 1000;
      const pollIntervalMs = pollIntervalSeconds * 1000;
      
      let run = await bugbugClient.getSuiteRun(runId);
      
      if (isFinishedRunStatus(run.data.status)) {
        return {
          content: [
            {
              type: 'text',
              text: `Suite run ${run.data.id} completed with status: ${run.data.status}`,
            },
          ],
        };
      }
      
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeoutMs) {
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        run = await bugbugClient.getSuiteRun(runId);
        
        if (isFinishedRunStatus(run.data.status)) {
          return {
            content: [
              {
                type: 'text',
                text: `Suite run ${run.data.id} completed with status: ${run.data.status}`,
              },
            ],
          };
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Suite run ${runId} did not complete within ${timeoutMinutes} minutes`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error waiting for suite run: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  },
};

export const showRunFromLast24Tool: Tool = {
  name: 'show_run_from_last_24',
  title: 'Show runs from last 24 hours',
  description: 'Shows tests/suites runs from last 24 hours',
  inputSchema: z.object({
    runType: z.enum(['test', 'suite', 'both']).optional().default('both').describe('Type of runs to show - test, suite, or both'),
    pageSize: z.number().optional().default(50).describe('Number of results per page (default: 50)'),
  }).shape,
  handler: async ({ runType = 'both', pageSize = 50 }) => {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const startedAfter = yesterday.toISOString();

      let testRuns: BugBugTestRun[] = [];
      let suiteRuns: BugBugSuiteRun[] = [];

      // Fetch test runs if requested
      if (runType === 'test') {
        const testRunsResponse = await bugbugClient.getTestRuns(1, pageSize, '-started', startedAfter);
        if (testRunsResponse.status === 200 && testRunsResponse.data.results) {
          testRuns = testRunsResponse.data.results;
        }
      }

      // Fetch suite runs if requested (we'll need to get all recent suite runs and filter)
      if (runType === 'suite') {
        // Note: BugBug API might not have a direct suite runs endpoint with date filtering
        // We'll try to get recent suite runs by checking individual suites
        // This is a limitation that might need API enhancement
        try {
          const suitesResponse = await bugbugClient.getSuites(1, 20, undefined, '-created');
          if (suitesResponse.status === 200 && suitesResponse.data.results) {
            // For each suite, we could check recent runs, but this would be expensive
            // For now, we'll note this limitation
            suiteRuns = [];
          }
        } catch (suiteError) {
          // Suite runs fetching failed, continue with test runs only
        }
      }

      // Combine and sort results
      const allRuns = [
        ...testRuns.map((run: BugBugTestRun) => ({ ...run, type: 'test' as const })),
        ...suiteRuns.map((run: BugBugSuiteRun) => ({ ...run, type: 'suite' as const }))
      ].sort((a, b) => new Date(b.started || b.modified || 0).getTime() - new Date(a.started || a.modified || 0).getTime());

      if (allRuns.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `**No runs found in the last 24 hours**\n\nSearched for: ${runType} runs\nTime range: ${yesterday.toISOString()} to ${now.toISOString()}\n\n*Note: Suite run history might have limited API support.*`,
            },
          ],
        };
      }

      const runsList = allRuns.slice(0, pageSize).map((run: (BugBugTestRun | BugBugSuiteRun) & { type: 'test' | 'suite' }) => {
        const startTime = run.started || run.modified || 'N/A';
        const duration = run.duration || 'N/A';
        const status = run.status || 'Unknown';
        const runTypeLabel = run.type === 'test' ? '🧪 Test' : '📦 Suite';
        const errorInfo = run.errorCode && run.errorCode !== 'None' ? ` - Error: ${run.errorCode}` : '';
        
        return `- **${runTypeLabel}** ${run.name || run.id} - **${status}** (${startTime}) - Duration: ${duration}${errorInfo}`;
      }).join('\n');

      const summary = {
        total: allRuns.length,
        completed: allRuns.filter(r => r.status?.toLowerCase() === 'completed').length,
        failed: allRuns.filter(r => r.status?.toLowerCase() === 'failed').length,
        running: allRuns.filter(r => ['running', 'queued'].includes(r.status?.toLowerCase())).length,
      };

      return {
        content: [
          {
            type: 'text',
            text: `**Runs from Last 24 Hours** (${runType} runs)\n\n**Summary:**\n- Total: ${summary.total}\n- Completed: ${summary.completed}\n- Failed: ${summary.failed}\n- Running/Queued: ${summary.running}\n\n**Recent Runs:**\n${runsList}\n\n*Showing up to ${pageSize} most recent runs*`,
          },
        ],
      };

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching runs from last 24 hours: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  },
};

export const runTestByNameOrIdTool: Tool = {
  name: 'run_test_by_name_or_id',
  title: 'Run test by name or ID',
  description: 'Run test by name or ID - automatically finds test by name if not a UUID',
  inputSchema: z.object({
    testNameOrId: z.string().describe('Test name or UUID to execute'),
    profileName: z.string().optional().describe('Profile name to use for execution'),
    variables: z.array(z.object({
      key: z.string(),
      value: z.string().optional(),
    })).optional().describe('Override variables for the test run'),
  }).shape,
  handler: async ({ testNameOrId, profileName, variables }) => {
    try {
      let testId = testNameOrId;

      // Check if the input looks like a UUID (basic check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(testNameOrId)) {
        // Input is likely a test name, search for it
        const searchResponse = await bugbugClient.getTests(1, 50, testNameOrId);
        
        if (searchResponse.status !== 200) {
          return {
            content: [
              {
                type: 'text',
                text: `Error searching for test "${testNameOrId}": ${searchResponse.status} ${searchResponse.statusText}`,
              },
            ],
          };
        }

        const { results } = searchResponse.data;
        
        if (!results || results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ **No test found** with name "${testNameOrId}"\n\nTry using the exact test name or UUID. Use \`get_tests\` to list available tests.`,
              },
            ],
          };
        }

        // Find exact match first, then partial match
        let matchedTest = results.find((test: BugBugTest) => test.name.toLowerCase() === testNameOrId.toLowerCase());
        
        if (!matchedTest) {
          matchedTest = results.find((test: BugBugTest) => test.name.toLowerCase().includes(testNameOrId.toLowerCase()));
        }

        if (!matchedTest) {
          const testsList = results.slice(0, 5).map((test: BugBugTest) => `- ${test.name} (${test.id})`).join('\n');
          return {
            content: [
              {
                type: 'text',
                text: `❌ **No exact match found** for "${testNameOrId}"\n\n**Similar tests found:**\n${testsList}\n\n${results.length > 5 ? `...and ${results.length - 5} more` : ''}`,
              },
            ],
          };
        }

        testId = matchedTest.id;
        
        // Show multiple matches if found
        if (results.length > 1) {
          const matchesList = results.slice(0, 3).map((test: BugBugTest) => 
            `- ${test.name} ${test.id === testId ? '← **SELECTED**' : ''}`
          ).join('\n');
          
          return {
            content: [
              {
                type: 'text',
                text: `⚠️ **Multiple tests found** for "${testNameOrId}":\n\n${matchesList}\n${results.length > 3 ? `...and ${results.length - 3} more` : ''}\n\n**Selected:** ${matchedTest.name}\n\nTo run a specific test, use its exact name or UUID.`,
              },
            ],
          };
        }
      }

      // Now execute the test
      const data = {
        testId,
        profileName,
        variables: variables?.filter((v: { value: string }) => v.value !== undefined).map((v: { key: string, value: string }) => ({ key: v.key, value: v.value! })),
        triggeredBy: 'api' as const,
      };
      
      const response = await bugbugClient.createTestRun(data);
      
      if (response.status !== 200) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ **Error starting test run**: ${response.status} ${response.statusText}`,
          },
          ],
        };
      }

      const run = response.data;
      
      // Get test details for better output
      let testName = testNameOrId;
      if (uuidRegex.test(testNameOrId)) {
        try {
          const testResponse = await bugbugClient.getTest(testId);
          if (testResponse.status === 200) {
            testName = testResponse.data.name;
          }
        } catch (error) {
          // Continue with UUID if test details can't be fetched
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `🚀 **Test Run Started Successfully!**\n\n- **Test:** ${testName}\n- **Test ID:** ${testId}\n- **Run ID:** ${run.id}\n- **Status:** ${run.status}\n- **Started:** ${run.modified}\n- **Profile:** ${profileName || 'Default'}\n- **Web App URL:** ${run.webappUrl}\n\n💡 **Next steps:**\n- Use \`get_test_run_status\` with run ID \`${run.id}\` to check progress\n- Use \`wait_for_test_run\` with run ID \`${run.id}\` to wait for completion\n- Use \`get_test_run\` with run ID \`${run.id}\` to get detailed results`,
          },
        ],
      };

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Error running test**: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  },
};