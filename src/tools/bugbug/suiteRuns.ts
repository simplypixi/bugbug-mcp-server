import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BugBugApiClient } from '../../utils/bugbugClient.js';

export function registerBugBugSuiteRunTools(server: McpServer, bugbugClient: BugBugApiClient): void {
  server.tool(
    'create_suite_run',
    'Execute a BugBug test suite',
    {
      suiteId: z.string().describe('Suite UUID to execute'),
      profileName: z.string().optional().describe('Profile name to use for execution'),
      variables: z.array(z.object({
        key: z.string(),
        value: z.string().optional(),
      })).optional().describe('Override variables for the suite run'),
      triggeredBy: z.enum(['user', 'api', 'scheduler', 'github', 'cli']).optional().default('api').describe('Who triggered the run'),
    },
    async ({ suiteId, profileName, variables, triggeredBy }) => {
      try {

        const data = {
          suiteId,
          profileName,
          variables,
          triggeredBy: triggeredBy || 'api',
        };
        
        const response = await bugbugClient.createSuiteRun(data);
        
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
        
        return {
          content: [
            {
              type: 'text',
              text: `**Suite Run Started:**\n\n- **Run ID:** ${run.id}\n- **Status:** ${run.status}\n- **Modified:** ${run.modified}\n- **Web App URL:** ${run.webappUrl}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error creating suite run: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'get_suite_run',
    'Get detailed results of a BugBug suite run',
    {
      
      runId: z.string().describe('Suite run UUID'),
    },
    async ({ runId }) => {
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

        const run = response.data;
        
        let testDetails = '';
        if (run.details && run.details.length > 0) {
          testDetails = run.details.map((test: any) => 
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
  );

  server.tool(
    'get_suite_run_status',
    'Get current status of a BugBug suite run',
    {
      
      runId: z.string().describe('Suite run UUID'),
    },
    async ({ runId }) => {
      try {

        const response = await bugbugClient.getSuiteRunStatus(runId);
        
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
  );

  server.tool(
    'get_suite_run_screenshots',
    'Get screenshots from a BugBug suite run',
    {
      
      runId: z.string().describe('Suite run UUID'),
    },
    async ({ runId }) => {
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
          screenshotsList = screenshots.testsRuns.map((testRun: any) => {
            const stepScreenshots = testRun.stepsRuns?.map((step: any) => 
              `    - Step ${step.stepId}: ${step.screenshotUrl}`
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
  );

  server.tool(
    'stop_suite_run',
    'Stop a running BugBug suite run',
    {
      
      runId: z.string().describe('Suite run UUID to stop'),
    },
    async ({ runId }) => {
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
  );
}
