import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerBugBugConfigTools } from './config.js';
import { registerBugBugProfileTools } from './profiles.js';
import { registerBugBugSuiteTools } from './suites.js';
import { registerBugBugSuiteRunTools } from './suiteRuns.js';
import { registerBugBugTestTools } from './tests.js';
import { registerBugBugTestRunTools } from './testRuns.js';

export function registerBugBugTools(server: McpServer): void {
  registerBugBugConfigTools(server);
  registerBugBugProfileTools(server);
  registerBugBugSuiteTools(server);
  registerBugBugSuiteRunTools(server);
  registerBugBugTestTools(server);
  registerBugBugTestRunTools(server);
}
