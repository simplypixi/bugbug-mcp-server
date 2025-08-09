import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BugBugApiClient } from '../../utils/bugbugClient.js';

export function registerBugBugSuiteTools(server: McpServer): void {
  server.tool(
    'bugbug_get_suites',
    'Get list of BugBug test suites',
    {
      apiToken: z.string().describe('BugBug API token'),
      page: z.number().optional().describe('Page number for pagination'),
      pageSize: z.number().optional().describe('Number of results per page'),
      query: z.string().optional().describe('Search query for suite names'),
      ordering: z.enum(['name', '-name', 'created', '-created']).optional().describe('Sort order'),
    },
    async ({ apiToken, page, pageSize, query, ordering }) => {
      try {
        const client = new BugBugApiClient({ apiToken });
        const response = await client.getSuites(page, pageSize, query, ordering);
        
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
        
        let suitesList = '';
        if (results && results.length > 0) {
          suitesList = results.map((suite: any) => 
            `- **${suite.name || 'Unnamed Suite'}** (ID: ${suite.id}) - ${suite.testsCount || 0} tests`
          ).join('\n');
        } else {
          suitesList = 'No suites found.';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `**BugBug Test Suites** (Page ${currentPage || 1}, Total: ${count || 0}):\n\n${suitesList}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching suites: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'bugbug_get_suite',
    'Get details of a specific BugBug test suite',
    {
      apiToken: z.string().describe('BugBug API token'),
      suiteId: z.string().describe('Suite UUID'),
    },
    async ({ apiToken, suiteId }) => {
      try {
        const client = new BugBugApiClient({ apiToken });
        const response = await client.getSuite(suiteId);
        
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

        const suite = response.data;
        
        return {
          content: [
            {
              type: 'text',
              text: `**Suite Details:**\n\n- **Name:** ${suite.name || 'Unnamed Suite'}\n- **ID:** ${suite.id}\n- **Tests Count:** ${suite.testsCount || 0}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching suite: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );
}
