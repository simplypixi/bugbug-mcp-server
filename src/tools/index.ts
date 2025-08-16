import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Tool } from '../types/tools';
import * as configTools from './config.js';
import * as testsTools from './tests.js';
import * as testRunsTools from './testRuns.js';
import * as suitesTools from './suites.js';
import * as suiteRunsTools from './suiteRuns.js';
import * as profilesTools from './profiles.js';
import * as advancedTools from './advanced.js';

export function registerAllTools(server: McpServer): void {
  const tools: Record<string, Tool> = {
    ...configTools,
    ...testsTools,
    ...testRunsTools,
    ...suitesTools,
    ...suiteRunsTools,
    ...profilesTools,
    ...advancedTools,
  };

  for (const t in tools) {
    server.registerTool(
      tools[t].name,
      {
        description: tools[t].description,
        inputSchema: tools[t].inputSchema,
        annotations: { title: tools[t].title },
      },
      (args: unknown) => tools[t].handler(args as unknown)
    );
  }
}
