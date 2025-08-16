import { z } from 'zod';
import { bugbugClient } from '../services/bugbugClient.js';
import { Tool } from '../types/tools.js';
import type { BugBugProfile } from '../types/bugbug.types.js';


export const getProfilesTool: Tool = {
  name: 'get_profiles',
  title: 'Get list of BugBug run profiles',
  description: 'Get list of BugBug run profiles',
  inputSchema: z.object({
    page: z.number().optional().describe('Page number for pagination'),
    pageSize: z.number().optional().describe('Number of results per page'),
  }).shape,
  handler: async ({ page, pageSize }) => {
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
};

export const getProfileTool: Tool = {
  name: 'get_profile',
  title: 'Get details of a specific BugBug run profile',
  description: 'Get details of a specific BugBug run profile',
  inputSchema: z.object({
    profileId: z.string().describe('Profile UUID'),
  }).shape,
  handler: async ({ profileId }) => {
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
};
