import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  BugBugStepDetail,
  BugBugTestRun
} from '../../types/bugbug.types.js';
import type { BugBugApiClient } from '../../utils/bugbugClient.js';

export function registerBugBugTestRunTools(server: McpServer, bugbugClient: BugBugApiClient): void {
  server.tool(
    'get_test_runs',
    'Get list of historical BugBug test runs',
    {
      
      page: z.number().optional().describe('Page number for pagination'),
      pageSize: z.number().optional().describe('Number of results per page'),
      ordering: z.enum(['-started', 'started']).optional().describe('Sort order by start time'),
      startedAfter: z.string().optional().describe('Filter runs started after this datetime (ISO format)'),
      startedBefore: z.string().optional().describe('Filter runs started before this datetime (ISO format)'),
    },
    async ({ page, pageSize, ordering, startedAfter, startedBefore }) => {
      try {

        const response = await bugbugClient.getTestRuns(page, pageSize, ordering, startedAfter, startedBefore);
        
        if (response.status !== 200) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        const { count, page: currentPage, results } = response.data;
        
        let runsList = '';
        if (results && results.length > 0) {
          runsList = results.map((run: BugBugTestRun) => 
            `- **${run.status}** (ID: ${run.id}) - Started: ${run.started || 'N/A'} - Duration: ${run.duration || 'N/A'}`
          ).join('\n');
        } else {
          runsList = 'No test runs found.';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `**BugBug Test Runs** (Page ${currentPage || 1}, Total: ${count || 0}):\n\n${runsList}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching test runs: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'get_test_run',
    'Get detailed results of a BugBug test run',
    {
      
      runId: z.string().describe('Test run UUID'),
    },
    async ({ runId }) => {
      try {

        const response = await bugbugClient.getTestRun(runId);
        
        if (response.status !== 200) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        const run = response.data;
        
        let stepDetails = '';
        if (run.details && run.details.length > 0) {
          stepDetails = run.details.map((step: BugBugStepDetail) => 
            `  - **Step ${step.stepId}** (ID: ${step.id}) - Status: ${step.status}`
          ).join('\n');
        } else {
          stepDetails = '  No step details available';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `**Test Run Details:**\n\n- **Name:** ${run.name}\n- **ID:** ${run.id}\n- **Status:** ${run.status}\n- **Duration:** ${run.duration || 'N/A'}\n- **Queued:** ${run.queued || 'N/A'}\n- **Error Code:** ${run.errorCode || 'None'}\n- **Sequence:** ${run.sequence || 'N/A'}\n- **Web App URL:** ${run.webappUrl}\n\n**Step Details:**\n${stepDetails}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching test run: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'get_test_run_status',
    'Get current status of a BugBug test run',
    {
      
      runId: z.string().describe('Test run UUID'),
    },
    async ({ runId }) => {
      try {

        const statusResponse = await bugbugClient.getTestRunStatus(runId);
        
        if (statusResponse.status !== 200) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${statusResponse.status} ${statusResponse.statusText}`,
              },
            ],
          };
        }

        const status = statusResponse.data;
        
        return {
          content: [
            {
              type: 'text',
              text: `**Test Run Status:**\n\n- **ID:** ${status.id}\n- **Status:** ${status.status}\n- **Last Modified:** ${status.modified}\n- **Web App URL:** ${status.webappUrl}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching test run status: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'get_test_run_screenshots',
    'Get screenshots from a BugBug test run',
    {
      
      runId: z.string().describe('Test run UUID'),
    },
    async ({ runId }) => {
      try {

        const response = await bugbugClient.getTestRunScreenshots(runId);
        
        if (response.status !== 200) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        const screenshots = response.data;
        
        let screenshotsList = '';
        if (screenshots.stepsRuns && screenshots.stepsRuns.length > 0) {
          screenshotsList = screenshots.stepsRuns.map((step: BugBugStepDetail) => 
            `- **Step ${step.stepId}:** ${step.screenshots?.[0]?.url || 'No screenshot'}`
          ).join('\n');
        } else {
          screenshotsList = 'No screenshots available';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `**Test Run Screenshots (ID: ${screenshots.id}):**\n\n${screenshotsList}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching test run screenshots: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'stop_test_run',
    'Stop a running BugBug test run',
    {
      
      runId: z.string().describe('Test run UUID to stop'),
    },
    async ({ runId }) => {
      try {

        const response = await bugbugClient.stopTestRun(runId);
        
        if (response.status !== 200) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${response.status} ${response.statusText}`,
              },
            ],
          };
        }

        const status = response.data;
        
        return {
          content: [
            {
              type: 'text',
              text: `**Test Run Stopped:**\n\n- **ID:** ${status.id}\n- **Status:** ${status.status}\n- **Last Modified:** ${status.modified}\n- **Web App URL:** ${status.webappUrl}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error stopping test run: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );
}
