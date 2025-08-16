import { z } from 'zod';
import { bugbugClient } from '../services/bugbugClient.js';
import { Tool } from '../types/tools.js';
import {
  BugBugStepDetail,
  BugBugTestDetail,
  BugBugSuiteRun
} from '../types/bugbug.types.js';

export const getSuiteRunTool: Tool = {
  name: 'get_suite_run',
  title: 'Get detailed results of a BugBug suite run',
  description: 'Get detailed results of a BugBug suite run',
  inputSchema: z.object({
    runId: z.string().describe('Suite run UUID'),
  }).shape,
  handler: async ({ runId }) => {
      try {

        const response = await bugbugClient.getSuiteRun(runId);
        
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

        const run = response.data as BugBugSuiteRun;
        
        let testDetails = '';
        if (run.details && run.details.length > 0) {
          testDetails = run.details.map((test: BugBugTestDetail) => 
            `  - **${test.name}** (${test.status}) - Duration: ${test.duration || 'N/A'}`
          ).join('\n');
        } else {
          testDetails = '  No test details available';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `**Suite Run Details:**\n\n- **Name:** ${run.name}\n- **ID:** ${run.id}\n- **Status:** ${run.status}\n- **Duration:** ${run.duration || 'N/A'}\n- **Queued:** ${run.queued || 'N/A'}\n- **Error Code:** ${run.errorCode || 'None'}\n- **Web App URL:** ${run.webappUrl}\n\n**Test Results:**\n${testDetails}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching suite run: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  };

export const getSuiteRunStatusTool: Tool = {
  name: 'get_suite_run_status',
  title: 'Get current status of a BugBug suite run',
  description: 'Get current status of a BugBug suite run',
  inputSchema: z.object({
    runId: z.string().describe('Suite run UUID'),
  }).shape,
  handler: async ({ runId }) => {
      try {

        const statusResponse = await bugbugClient.getSuiteRunStatus(runId);
        
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
              text: `**Suite Run Status:**\n\n- **ID:** ${status.id}\n- **Status:** ${status.status}\n- **Last Modified:** ${status.modified}\n- **Web App URL:** ${status.webappUrl}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching suite run status: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
};

export const getSuiteRunScreenshotsTool: Tool = {
  name: 'get_suite_run_screenshots',
  title: 'Get screenshots from a BugBug suite run',
  description: 'Get screenshots from a BugBug suite run',
  inputSchema: z.object({
    runId: z.string().describe('Suite run UUID'),
  }).shape,
  handler: async ({ runId }) => {
      try {

        const response = await bugbugClient.getSuiteRunScreenshots(runId);
        
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
        if (screenshots.testsRuns && screenshots.testsRuns.length > 0) {
          screenshotsList = screenshots.testsRuns.map((testRun: { id: string; name: string; stepsRuns?: BugBugStepDetail[] }) => {
            const stepScreenshots = testRun.stepsRuns?.map((step: BugBugStepDetail) => 
              `    - Step ${step.stepId}: ${step.screenshots?.[0]?.url || 'No screenshot'}`
            ).join('\n') || '    No step screenshots';
            
            return `  **Test ${testRun.id}:**\n${stepScreenshots}`;
          }).join('\n\n');
        } else {
          screenshotsList = 'No screenshots available';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `**Suite Run Screenshots (ID: ${screenshots.id}):**\n\n${screenshotsList}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching suite run screenshots: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
};

export const stopSuiteRunTool: Tool = {
  name: 'stop_suite_run',
  title: 'Stop a running BugBug suite run',
  description: 'Stop a running BugBug suite run',
  inputSchema: z.object({
    runId: z.string().describe('Suite run UUID to stop'),
  }).shape,
  handler: async ({ runId }) => {
      try {

        const response = await bugbugClient.stopSuiteRun(runId);
        
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
              text: `**Suite Run Stopped:**\n\n- **ID:** ${status.id}\n- **Status:** ${status.status}\n- **Last Modified:** ${status.modified}\n- **Web App URL:** ${status.webappUrl}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error stopping suite run: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
};
