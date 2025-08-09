import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BugBugApiClient } from '../../utils/bugbugClient.js';

export function registerBugBugConfigTools(server: McpServer, bugbugClient: BugBugApiClient): void {
  server.tool(
    'get_ip_addresses',
    'Get list of BugBug infrastructure IP addresses',
    {},
    async () => {
      try {
        const response = await bugbugClient.getIpAddresses();
        
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
