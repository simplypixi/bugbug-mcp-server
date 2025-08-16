import { z } from 'zod';
import { bugbugClient } from '../services/bugbugClient.js';
import { Tool } from '../types/tools.js';
import type { BugBugSuite } from '../types/bugbug.types.js';


export const getSuitesTool: Tool = {
  name: 'get_suites',
  title: 'Get list of BugBug test suites',
  description: 'Get list of BugBug test suites',
  inputSchema: z.object({
    page: z.number().optional().describe('Page number for pagination'),
    pageSize: z.number().optional().describe('Number of results per page'),
    query: z.string().optional().describe('Search query for suite names'),
    ordering: z.enum(['name', '-name', 'created', '-created']).optional().describe('Sort order'),
  }).shape,
  handler: async ({ page, pageSize, query, ordering }) => {
      try {
        const response = await bugbugClient.getSuites(page, pageSize, query, ordering);
        
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
          suitesList = results.map((suite: BugBugSuite) => 
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
};

export const getSuiteTool: Tool = {
  name: 'get_suite',
  title: 'Get details of a specific BugBug test suite',
  description: 'Get details of a specific BugBug test suite',
  inputSchema: z.object({
    suiteId: z.string().describe('Suite UUID'),
  }).shape,
  handler: async ({ suiteId }) => {
      try {
        const response = await bugbugClient.getSuite(suiteId);
        
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
};
