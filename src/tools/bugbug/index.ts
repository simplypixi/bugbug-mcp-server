import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BugBugApiClient } from '../../utils/bugbugClient.js';
import { registerBugBugConfigTools } from './config.js';
import { registerBugBugProfileTools } from './profiles.js';
import { registerBugBugSuiteTools } from './suites.js';
import { registerBugBugSuiteRunTools } from './suiteRuns.js';
import { registerBugBugTestTools } from './tests.js';
import { registerBugBugTestRunTools } from './testRuns.js';
import { registerBugBugAdvancedTools } from './advanced.js';

export function registerBugBugTools(server: McpServer, bugbugClient: BugBugApiClient): void {
  registerBugBugConfigTools(server, bugbugClient);
  registerBugBugProfileTools(server, bugbugClient);
  registerBugBugSuiteTools(server, bugbugClient);
  registerBugBugSuiteRunTools(server, bugbugClient);
  registerBugBugTestTools(server, bugbugClient);
  registerBugBugTestRunTools(server, bugbugClient);
  registerBugBugAdvancedTools(server, bugbugClient);
}
