#!/usr/bin/env node

import { loadEnvironmentConfig } from './utils/config.js';
loadEnvironmentConfig();

import { initializeSentry, captureException, addBreadcrumb, closeSentry } from './utils/sentry.js';
initializeSentry();

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BugBugApiClient } from './utils/bugbugClient.js';
import { registerAllTools } from './tools/index.js';
// Start the server
async function main() {
  try {
    addBreadcrumb('Starting BugBug MCP Server', 'server');
    
    // Verify API token is available
    const apiToken = process.env.API_KEY;
    if (!apiToken) {
      const error = new Error('API_KEY environment variable is not set');
      captureException(error, { component: 'initialization' });
      throw error;
    }

    // Create and verify BugBug client
    addBreadcrumb('Creating BugBug API client', 'api');
    const bugbugClient = new BugBugApiClient({ apiToken });
    await bugbugClient.verifyConnection();
    addBreadcrumb('BugBug API connection verified successfully', 'api');

    // Create server instance
    addBreadcrumb('Creating MCP server instance', 'server');
    const server = new McpServer({
      name: 'bugbug-mcp-server',
      version: '1.0.0',
    });

    // Register all tools with the client instance
    addBreadcrumb('Registering tools', 'server');
    registerAllTools(server, bugbugClient);

    // Start the server
    addBreadcrumb('Starting server transport', 'server');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    addBreadcrumb('BugBug MCP Server started successfully', 'server');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to initialize BugBug MCP Server:', errorMessage);
    captureException(error instanceof Error ? error : new Error(errorMessage), { 
      component: 'initialization',
      fatal: true 
    });
    await closeSentry();
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error('Fatal error in main():', error);
  captureException(error instanceof Error ? error : new Error(String(error)), { 
    component: 'main',
    fatal: true 
  });
  await closeSentry();
  process.exit(1);
});
