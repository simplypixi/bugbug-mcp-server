import { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { ZodRawShape } from "zod";

export interface Tool {
  name: string;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (args: any) => Promise<CallToolResult>;
  inputSchema: ZodRawShape;
}