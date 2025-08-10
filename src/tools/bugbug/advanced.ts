import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BugBugApiClient } from '../../utils/bugbugClient.js';
import {
  BugBugStepDetail,
  BugBugTestDetail,
  BugBugTest,
  BugBugTestRun,
  BugBugSuiteRun
} from '../../types/bugbug.types.js';

export function registerBugBugAdvancedTools(server: McpServer, bugbugClient: BugBugApiClient): void {
  server.tool(
    'wait_for_test_run',
    'Waits until test run finished, returns full test run data as result',
    {
      runId: z.string().describe('Test run UUID to wait for'),
      timeoutMinutes: z.number().optional().default(30).describe('Maximum time to wait in minutes (default: 30)'),
      pollIntervalSeconds: z.number().optional().default(10).describe('Polling interval in seconds (default: 10)'),
    },
    async ({ runId, timeoutMinutes = 30, pollIntervalSeconds = 10 }) => {
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

          const status = statusResponse.data.status;
          
          // Check if run is finished (completed, failed, or stopped)
          if (['completed', 'failed', 'stopped', 'error'].includes(status.toLowerCase())) {
            // Get full test run data
            const fullRunResponse = await bugbugClient.getTestRun(runId);
            
            if (fullRunResponse.status !== 200) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Test run finished with status: ${status}, but failed to get full details: ${fullRunResponse.status} ${fullRunResponse.statusText}`,
                  },
                ],
              };
            }

            const run = fullRunResponse.data;
            
            let stepDetails = '';
            if (run.details && run.details.length > 0) {
              stepDetails = run.details.map((step: BugBugStepDetail) => 
                `  - **Step ${step.stepId}:** ${step.status} - ${step.name || 'N/A'} (Duration: ${step.duration || 'N/A'})`
              ).join('\n');
            } else {
              stepDetails = '  No step details available';
            }

            return {
              content: [
                {
                  type: 'text',
                  text: `**Test Run Completed:**\n\n- **Name:** ${run.name}\n- **ID:** ${run.id}\n- **Final Status:** ${run.status}\n- **Duration:** ${run.duration || 'N/A'}\n- **Queued:** ${run.queued || 'N/A'}\n- **Error Code:** ${run.errorCode || 'None'}\n- **Web App URL:** ${run.webappUrl}\n\n**Step Results:**\n${stepDetails}`,
                },
              ],
            };
          }

          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }

        // Timeout reached
        return {
          content: [
            {
              type: 'text',
              text: `**Timeout:** Test run ${runId} did not finish within ${timeoutMinutes} minutes. Last known status can be checked with get_test_run_status.`,
            },
          ],
        };

      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error waiting for test run: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'wait_for_suite_run',
    'Waits until suite run finished, returns full suite run data as result',
    {
      runId: z.string().describe('Suite run UUID to wait for'),
      timeoutMinutes: z.number().optional().default(60).describe('Maximum time to wait in minutes (default: 60)'),
      pollIntervalSeconds: z.number().optional().default(15).describe('Polling interval in seconds (default: 15)'),
    },
    async ({ runId, timeoutMinutes = 60, pollIntervalSeconds = 15 }) => {
      try {
        const startTime = Date.now();
        const timeoutMs = timeoutMinutes * 60 * 1000;
        const pollIntervalMs = pollIntervalSeconds * 1000;

        while (Date.now() - startTime < timeoutMs) {
          const statusResponse = await bugbugClient.getSuiteRunStatus(runId);
          
          if (statusResponse.status !== 200) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error checking suite run status: ${statusResponse.status} ${statusResponse.statusText}`,
                },
              ],
            };
          }

          const status = statusResponse.data.status;
          
          // Check if run is finished (completed, failed, or stopped)
          if (['completed', 'failed', 'stopped', 'error'].includes(status.toLowerCase())) {
            // Get full suite run data
            const fullRunResponse = await bugbugClient.getSuiteRun(runId);
            
            if (fullRunResponse.status !== 200) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Suite run finished with status: ${status}, but failed to get full details: ${fullRunResponse.status} ${fullRunResponse.statusText}`,
                  },
                ],
              };
            }

            const run = fullRunResponse.data;
            
            let testDetails = '';
            if (run.details && run.details.length > 0) {
              testDetails = run.details.map((test: BugBugTestDetail) => 
                `  - **${test.name}** (${test.status}) - Duration: ${test.duration || 'N/A'} - Error: ${test.errorCode || 'None'}`
              ).join('\n');
            } else {
              testDetails = '  No test details available';
            }

            return {
              content: [
                {
                  type: 'text',
                  text: `**Suite Run Completed:**\n\n- **Name:** ${run.name}\n- **ID:** ${run.id}\n- **Final Status:** ${run.status}\n- **Duration:** ${run.duration || 'N/A'}\n- **Queued:** ${run.queued || 'N/A'}\n- **Error Code:** ${run.errorCode || 'None'}\n- **Web App URL:** ${run.webappUrl}\n\n**Test Results:**\n${testDetails}`,
                },
              ],
            };
          }

          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }

        // Timeout reached
        return {
          content: [
            {
              type: 'text',
              text: `**Timeout:** Suite run ${runId} did not finish within ${timeoutMinutes} minutes. Last known status can be checked with get_suite_run_status.`,
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
    }
  );

  server.tool(
    'explain_error',
    'Gets test run or suite run error code and checks in docs.bugbug.io details about the issue',
    {
      runId: z.string().describe('Test run or suite run UUID'),
      runType: z.enum(['test', 'suite']).describe('Type of run - test or suite'),
    },
    async ({ runId, runType }) => {
      try {
        // First get the run details to extract error code
        let runResponse;
        if (runType === 'test') {
          runResponse = await bugbugClient.getTestRun(runId);
        } else {
          runResponse = await bugbugClient.getSuiteRun(runId);
        }

        if (runResponse.status !== 200) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching ${runType} run details: ${runResponse.status} ${runResponse.statusText}`,
              },
            ],
          };
        }

        const run = runResponse.data;
        const errorCode = run.errorCode;

        if (!errorCode || errorCode === 'None' || errorCode === null) {
          return {
            content: [
              {
                type: 'text',
                text: `**No Error Found:**\n\n${runType === 'test' ? 'Test' : 'Suite'} run ${runId} does not have an error code. Current status: ${run.status}`,
              },
            ],
          };
        }

        // Try to fetch error documentation from docs.bugbug.io
        try {
          const docsUrl = `https://docs.bugbug.io/error-codes/${errorCode.toLowerCase()}`;
          const docsResponse = await fetch(docsUrl);
          
          let errorExplanation = '';
          if (docsResponse.ok) {
            const docsContent = await docsResponse.text();
            // Extract meaningful content from the docs page
            // This is a simplified extraction - in a real implementation you might want to parse HTML properly
            const titleMatch = docsContent.match(/<title>(.*?)<\/title>/i);
            const descriptionMatch = docsContent.match(/<meta name="description" content="(.*?)"/i);
            
            if (titleMatch || descriptionMatch) {
              errorExplanation = `\n\n**Documentation Found:**\n- Title: ${titleMatch?.[1] || 'N/A'}\n- Description: ${descriptionMatch?.[1] || 'N/A'}\n- Full docs: ${docsUrl}`;
            } else {
              errorExplanation = `\n\n**Documentation:** ${docsUrl} (content available but couldn't extract details)`;
            }
          } else {
            errorExplanation = `\n\n**Documentation:** No specific documentation found for error code ${errorCode} at ${docsUrl}`;
          }

          // Common error code explanations (fallback)
          const commonErrors: Record<string, string> = {
            'timeout': 'The test exceeded the maximum allowed execution time',
            'element_not_found': 'A required element could not be located on the page',
            'network_error': 'Network connectivity issues prevented test execution',
            'browser_crash': 'The browser instance crashed during test execution',
            'assertion_failed': 'One or more test assertions failed',
            'script_error': 'JavaScript error occurred during test execution',
            'page_load_timeout': 'Page failed to load within the specified timeout',
            'invalid_selector': 'CSS or XPath selector is invalid or malformed',
          };

          const commonExplanation = commonErrors[errorCode.toLowerCase()] || 'Unknown error code';

          return {
            content: [
              {
                type: 'text',
                text: `**Error Analysis for ${runType === 'test' ? 'Test' : 'Suite'} Run:**\n\n- **Run ID:** ${runId}\n- **Error Code:** ${errorCode}\n- **Status:** ${run.status}\n- **Common Explanation:** ${commonExplanation}${errorExplanation}\n\n**Troubleshooting Tips:**\n- Check the test steps and selectors\n- Verify page load times and network conditions\n- Review browser console logs if available\n- Consider increasing timeouts if applicable`,
              },
            ],
          };

        } catch (fetchError) {
          return {
            content: [
              {
                type: 'text',
                text: `**Error Analysis for ${runType === 'test' ? 'Test' : 'Suite'} Run:**\n\n- **Run ID:** ${runId}\n- **Error Code:** ${errorCode}\n- **Status:** ${run.status}\n\n**Note:** Could not fetch additional documentation due to network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}\n\n**General Advice:** Check BugBug documentation at https://docs.bugbug.io for error code details.`,
              },
            ],
          };
        }

      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error explaining error code: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'show_run_from_last_24',
    'Shows tests/suites runs from last 24 hours',
    {
      runType: z.enum(['test', 'suite', 'both']).optional().default('both').describe('Type of runs to show - test, suite, or both'),
      pageSize: z.number().optional().default(50).describe('Number of results per page (default: 50)'),
    },
    async ({ runType = 'both', pageSize = 50 }) => {
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
    }
  );

  server.tool(
    'run_test_by_name_or_id',
    'Run test by name or ID - automatically finds test by name if not a UUID',
    {
      testNameOrId: z.string().describe('Test name or UUID to execute'),
      profileName: z.string().optional().describe('Profile name to use for execution'),
      variables: z.array(z.object({
        key: z.string(),
        value: z.string().optional(),
      })).optional().describe('Override variables for the test run'),
    },
    async ({ testNameOrId, profileName, variables }) => {
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
          variables: variables?.filter(v => v.value !== undefined).map(v => ({ key: v.key, value: v.value! })),
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
    }
  );
}
