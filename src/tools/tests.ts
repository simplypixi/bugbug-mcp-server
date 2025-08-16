import { z } from 'zod';
import { bugbugClient } from '../services/bugbugClient.js';
import { Tool } from '../types/tools.js';
import type { BugBugTest } from '../types/bugbug.types.js';

export const getTestsTool: Tool = {
  name: 'get_tests',
  title: 'Get list of BugBug tests',
  description: 'Get list of BugBug tests',
  inputSchema: z.object({
    page: z.number().optional().describe('Page number for pagination'),
    pageSize: z.number().optional().describe('Number of results per page'),
    query: z.string().optional().describe('Search query for test names'),
    ordering: z.enum(['name', '-name', 'created', '-created', 'last_result', '-last_result']).optional().describe('Sort order'),
  }).shape,
  handler: async ({ page, pageSize, query, ordering }) => {
      try {

        const response = await bugbugClient.getTests(page, pageSize, query, ordering);
        
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
        
        let testsList = '';
        if (results && results.length > 0) {
          testsList = results.map((test: BugBugTest) => 
            `- **${test.name}** (ID: ${test.id}) - Active: ${test.isActive ? 'Yes' : 'No'}${test.isRecording ? ' [RECORDING]' : ''}`
          ).join('\n');
        } else {
          testsList = 'No tests found.';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `**BugBug Tests** (Page ${currentPage || 1}, Total: ${count || 0}):\n\n${testsList}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching tests: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
};

export const getTestTool: Tool = {
  name: 'get_test',
  title: 'Get details of a specific BugBug test',
  description: 'Get details of a specific BugBug test',
  inputSchema: z.object({
    testId: z.string().describe('Test UUID'),
  }).shape,
  handler: async ({ testId }) => {
      try {

        const response = await bugbugClient.getTest(testId);
        
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

        const test = response.data;
        
        return {
          content: [
            {
              type: 'text',
              text: `**Test Details:**\n\n- **Name:** ${test.name}\n- **ID:** ${test.id}\n- **Is Active:** ${test.isActive ? 'Yes' : 'No'}\n- **Is Recording:** ${test.isRecording ? 'Yes' : 'No'}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching test: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
};

