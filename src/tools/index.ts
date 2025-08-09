import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BugBugApiClient } from '../utils/bugbugClient.js';
import { registerBugBugTools } from './bugbug/index.js';

export function registerAllTools(server: McpServer, bugbugClient: BugBugApiClient): void {
  registerBugBugTools(server, bugbugClient);
}
