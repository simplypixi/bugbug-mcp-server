import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerBugBugTools } from './bugbug/index.js';

export function registerAllTools(server: McpServer): void {
  registerBugBugTools(server);
}
