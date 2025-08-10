import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BugBugApiClient } from '../../utils/bugbugClient.js';
import type { BugBugTest } from '../../types/bugbug.types.js';

export function registerBugBugTestTools(server: McpServer, bugbugClient: BugBugApiClient): void {
  server.tool(
    'get_tests',
    'Get list of BugBug tests',
    {
      page: z.number().optional().describe('Page number for pagination'),
      pageSize: z.number().optional().describe('Number of results per page'),
      query: z.string().optional().describe('Search query for test names'),
      ordering: z.enum(['name', '-name', 'created', '-created', 'last_result', '-last_result']).optional().describe('Sort order'),
    },
    async ({ page, pageSize, query, ordering }) => {
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
  );

  server.tool(
    'get_test',
    'Get details of a specific BugBug test',
    {
      testId: z.string().describe('Test UUID'),
    },
    async ({ testId }) => {
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
  );

  server.tool(
    'update_test',
    'Update a BugBug test (full update)',
    {
      testId: z.string().describe('Test UUID'),
      name: z.string().describe('Test name'),
      isActive: z.boolean().describe('Whether the test is active'),
    },
    async ({ testId, name, isActive }) => {
      try {

        const data = {
          name,
          isActive,
        };
        
        const response = await bugbugClient.updateTest(testId, data);
        
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
              text: `**Test Updated:**\n\n- **Name:** ${test.name}\n- **ID:** ${test.id}\n- **Is Active:** ${test.isActive ? 'Yes' : 'No'}\n- **Is Recording:** ${test.isRecording ? 'Yes' : 'No'}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error updating test: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'partial_update_test',
    'Partially update a BugBug test',
    {
      testId: z.string().describe('Test UUID'),
      name: z.string().optional().describe('Test name'),
      isActive: z.boolean().optional().describe('Whether the test is active'),
    },
    async ({ testId, name, isActive }) => {
      try {

        const data: Partial<BugBugTest> = {};
        
        if (name !== undefined) data.name = name;
        if (isActive !== undefined) data.isActive = isActive;
        
        const response = await bugbugClient.partialUpdateTest(testId, data);
        
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
              text: `**Test Partially Updated:**\n\n- **Name:** ${test.name}\n- **ID:** ${test.id}\n- **Is Active:** ${test.isActive ? 'Yes' : 'No'}\n- **Is Recording:** ${test.isRecording ? 'Yes' : 'No'}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error partially updating test: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );
}
