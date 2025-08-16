import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

export const createToolError = (error: unknown, message?: string): CallToolResult => {
  return {
    content: [
      {
        type: 'text',
        text: `
          ${message || 'Unexpected error while tool execution'}
          Error details:
            - message: ${error instanceof Error ? error.message : 'Unknown error'}
            - name: ${error instanceof Error ? error.name : 'Unknown error'}
            - stack: ${error instanceof Error ? error.stack : 'Unknown error'}
        `,
      },
    ],
  };
};