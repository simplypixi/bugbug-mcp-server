import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BugBugApiClient } from '../../utils/bugbugClient.js';
import type { BugBugProfile } from '../../types/bugbug.types.js';

export function registerBugBugProfileTools(server: McpServer, bugbugClient: BugBugApiClient): void {
  server.tool(
    'get_profiles',
    'Get list of BugBug run profiles',
    {
      page: z.number().optional().describe('Page number for pagination'),
      pageSize: z.number().optional().describe('Number of results per page'),
    },
    async ({ page, pageSize }) => {
      try {
        const response = await bugbugClient.getProfiles(page, pageSize);
        
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
        
        let profilesList = '';
        if (results && results.length > 0) {
          profilesList = results.map((profile: BugBugProfile) => 
            `- **${profile.name}** (ID: ${profile.id})${profile.isDefault ? ' [DEFAULT]' : ''}`
          ).join('\n');
        } else {
          profilesList = 'No profiles found.';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `**BugBug Run Profiles** (Page ${currentPage || 1}, Total: ${count || 0}):\n\n${profilesList}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching profiles: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'get_profile',
    'Get details of a specific BugBug run profile',
    {
      profileId: z.string().describe('Profile UUID'),
    },
    async ({ profileId }) => {
      try {
        const response = await bugbugClient.getProfile(profileId);
        
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

        const profile = response.data;
        
        return {
          content: [
            {
              type: 'text',
              text: `**Profile Details:**\n\n- **Name:** ${profile.name}\n- **ID:** ${profile.id}\n- **Is Default:** ${profile.isDefault ? 'Yes' : 'No'}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    }
  );
}
