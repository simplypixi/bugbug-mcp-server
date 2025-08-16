import { z } from 'zod';
import { bugbugClient } from '../services/bugbugClient.js';
import { Tool } from '../types/tools.js';

export const getIpAddressesTool: Tool = {
  name: 'get_ip_addresses',
  title: 'Get list of BugBug infrastructure IP addresses',
  description: 'Get list of BugBug infrastructure IP addresses',
  inputSchema: z.object({}).shape,
  handler: async () => {
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
};
