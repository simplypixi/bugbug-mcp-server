import { z } from 'zod';
import { bugbugClient } from '../services/bugbugClient.js';
import { Tool } from '../types/tools.js';
import {
  BugBugStepDetail,
  BugBugTestRun
} from '../types/bugbug.types.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { createTestRunSummary } from '../utils/responses.js';

export const getTestRunsTool: Tool = {
  name: 'get_test_runs',
  title: 'Get list of historical BugBug test runs',
  description: 'Get list of historical BugBug test runs',
  inputSchema: z.object({
    page: z.number().optional().describe('Page number for pagination'),
    pageSize: z.number().optional().describe('Number of results per page'),
    ordering: z.enum(['-started', 'started']).optional().describe('Sort order by start time'),
    startedAfter: z.string().optional().describe('Filter runs started after this datetime (ISO format)'),
    startedBefore: z.string().optional().describe('Filter runs started before this datetime (ISO format)'),
  }).shape,
  handler: async ({ page, pageSize, ordering, startedAfter, startedBefore }) => {
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
};

export const getTestRunTool: Tool = {
  name: 'get_test_run',
  title: 'Get detailed results of a BugBug test run',
  description: 'Get detailed results of a BugBug test run',
  inputSchema: z.object({
    runId: z.string().describe('Test run UUID'),
  }).shape,
  handler: async ({ runId }) => {
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
    },
};

export const getTestRunStatusTool: Tool = {
  name: 'get_test_run_status',
  title: 'Get current status of a BugBug test run',
  description: 'Get current status of a BugBug test run',
  inputSchema: z.object({
    runId: z.string().describe('Test run UUID'),
  }).shape,
  handler: async ({ runId }) => {
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
};

export const getTestRunScreenshotsTool: Tool = {
  name: 'get_test_run_screenshots',
  title: 'Get screenshots from a BugBug test run',
  description: 'Get screenshots from a BugBug test run',
  inputSchema: z.object({
    runId: z.string().describe('Test run UUID'),
  }).shape,
  handler: async ({ runId }) => {
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
};

export const stopTestRunTool: Tool = {
  name: 'stop_test_run',
  title: 'Stop a running BugBug test run',
  description: 'Stop a running BugBug test run',
  inputSchema: z.object({
    runId: z.string().describe('Test run UUID to stop'),
  }).shape,
  handler: async ({ runId }) => {
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

};
