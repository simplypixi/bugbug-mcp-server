#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BugBugApiClient } from './utils/bugbugClient.js';
import { registerAllTools } from './tools/index.js';

// Start the server
async function main() {
  try {
    // Verify API token is available
    const apiToken = process.env.API_KEY;
    if (!apiToken) {
      throw new Error('API_KEY environment variable is not set');
    }

    // Create and verify BugBug client
    const bugbugClient = new BugBugApiClient({ apiToken });
    await bugbugClient.verifyConnection();
    console.debug('BugBug API connection verified successfully');

    // Create server instance
    const server = new McpServer({
      name: 'bugbug-mcp-server',
      version: '1.0.0',
    });

    // Register all tools with the client instance
    registerAllTools(server, bugbugClient);

    // Start the server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.debug('BugBug MCP Server is running...');
  } catch (error) {
    console.error('Failed to initialize BugBug MCP Server:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
