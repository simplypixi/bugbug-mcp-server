import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BugBugApiClient } from '../../utils/bugbugClient.js';

export function registerBugBugConfigTools(server: McpServer): void {
  server.tool(
    'bugbug_get_ip_addresses',
    'Get list of BugBug infrastructure IP addresses',
    {
      apiToken: z.string().describe('BugBug API token (with Token prefix)'),
    },
    async ({ apiToken }) => {
      try {
        const client = new BugBugApiClient({ apiToken });
        const response = await client.getIpAddresses();
        
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

        const ipList = response.data.map((ip: string) => `- ${ip}`).join('\n');
        
        return {
          content: [
            {
              type: 'text',
              text: `**BugBug Infrastructure IP Addresses:**\n\n${ipList}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching IP addresses: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );
}
