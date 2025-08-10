<div align="center">

![BugBug Logo](https://bugbug.io/favicon-96x96.png)

# BugBug MCP Server

**Unofficial MCP Server for BugBug**

A Model Context Protocol (MCP) server implementation in TypeScript that provides comprehensive tools for [BugBug](https://bugbug.io) test automation platform.

</div>

## Features

- **Complete BugBug API Integration**: Full access to tests, suites, runs, and profiles
- **Cross AI Assistant Support**: Works with Claude, Windsurf, GitHub Copilot, and other AI assistants
- **Advanced Tools**: Wait for completion, error explanation, and batch operations
- **Smart Test Running**: Run tests by name or UUID with intelligent matching
- **Real-time Monitoring**: Track test and suite execution with live status updates
- **Built with TypeScript**: Type safety and modern development practices

## Setup

### Prerequisites

- Node.js 18 or higher
- BugBug account and API token

### Adding to AI Assistants

Add to your MCP settings:

```json
{
  "mcpServers": {
    "bugbug": {
      "command": "npx",
      "args": ["-y", "@simplypixi/bugbug-mcp-server@latest"],
      "env": {
        "API_KEY": "your_bugbug_api_token_here"
      }
    }
  }
}
```

## Available Tools

### **Advanced Tools**

| Tool Name                   | Description                                        | Parameters                                                           |
| --------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| `wait_for_test_run`         | Wait until test run finishes, return full results  | `runId`, `timeoutMinutes?`, `pollIntervalSeconds?`                   |
| `wait_for_suite_run`        | Wait until suite run finishes, return full results | `runId`, `timeoutMinutes?`, `pollIntervalSeconds?`                   |
| `explain_error`             | Get error details and documentation                | `runId`, `runType`                                                   |
| `show_run_from_last_24`     | Show recent runs from last 24 hours                | `runType?`, `pageSize?`                                              |
| `run_test_by_name_or_id`    | Run test by name or UUID with smart matching       | `testNameOrId`, `profileName?`, `variables?`, `triggeredBy?`         |

### **Profiles**

| Tool Name                   | Description                                        | Parameters                                                           |
| --------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| `get_profiles`              | Get list of BugBug run profiles                    | `page?`, `pageSize?`                                                 |
| `get_profile`               | Get details of a specific run profile              | `profileId`                                                          |

### **Tests**

| Tool Name                   | Description                                        | Parameters                                                           |
| --------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| `get_tests`                 | Get list of BugBug tests                           | `page?`, `pageSize?`, `query?`, `ordering?`                          |
| `get_test`                  | Get details of a specific test                     | `testId`                                                             |
| `update_test`               | Update a test (full update)                        | `testId`, `name`, `isActive`                                         |
| `partial_update_test`       | Partially update a test                            | `testId`, `name?`, `isActive?`                                       |

### **Test Suites**

| Tool Name                   | Description                                        | Parameters                                                           |
| --------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| `get_suites`                | Get list of test suites                            | `page?`, `pageSize?`, `query?`, `ordering?`                          |
| `get_suite`                 | Get details of a specific test suite               | `suiteId`                                                            |

### **Test Runs**

| Tool Name                   | Description                                        | Parameters                                                           |
| --------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| `get_test_runs`             | Get list of historical test runs                   | `page?`, `pageSize?`, `ordering?`, `startedAfter?`, `startedBefore?` |
| `get_test_run`              | Get detailed results of a test run                 | `runId`                                                              |
| `get_test_run_status`       | Get current status of a test run                   | `runId`                                                              |
| `get_test_run_screenshots`  | Get screenshots from a test run                    | `runId`                                                              |
| `stop_test_run`             | Stop a running test                                | `runId`                                                              |

### **Suite Runs**

| Tool Name                   | Description                                        | Parameters                                                           |
| --------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| `get_suite_run`             | Get detailed results of a suite run                | `runId`                                                              |
| `get_suite_run_status`      | Get current status of a suite run                  | `runId`                                                              |
| `get_suite_run_screenshots` | Get screenshots from a suite run                   | `runId`                                                              |
| `stop_suite_run`            | Stop a running suite                               | `runId`                                                              |

### **Configuration**

| Tool Name                   | Description                                        | Parameters                                                           |
| --------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| `get_ip_addresses`          | Get list of BugBug infrastructure IP addresses     | None                                                                 |
