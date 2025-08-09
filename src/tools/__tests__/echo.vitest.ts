import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerEchoTool } from '../echo.js';

// Mock the McpServer
vi.mock('@modelcontextprotocol/sdk/server/mcp.js');

describe('Echo Tool', () => {
  let mockServer: any;
  let toolHandler: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = {
      tool: vi.fn(),
    };
    
    // Register the tool and capture the handler
    registerEchoTool(mockServer);
    toolHandler = mockServer.tool.mock.calls[0][3]; // Get the handler function
  });

  it('should register echo tool with correct configuration', () => {
    // Arrange & Act
    registerEchoTool(mockServer);

    // Assert
    expect(mockServer.tool).toHaveBeenCalledWith(
      'echo',
      'Echo back the input text',
      expect.objectContaining({
        text: expect.any(Object), // Zod schema
      }),
      expect.any(Function)
    );
  });

  it('should echo back the provided text', async () => {
    // Arrange
    const testText = 'Hello, World!';
    const expectedResponse = {
      content: [
        {
          type: 'text',
          text: `Echo: ${testText}`,
        },
      ],
    };

    // Act
    const result = await toolHandler({ text: testText });

    // Assert
    expect(result).toEqual(expectedResponse);
  });

  it('should handle empty string', async () => {
    // Arrange
    const testText = '';
    const expectedResponse = {
      content: [
        {
          type: 'text',
          text: 'Echo: ',
        },
      ],
    };

    // Act
    const result = await toolHandler({ text: testText });

    // Assert
    expect(result).toEqual(expectedResponse);
  });

  it('should handle special characters', async () => {
    // Arrange
    const testText = '!@#$%^&*()_+{}|:"<>?[]\\;\',./ 🚀';
    const expectedResponse = {
      content: [
        {
          type: 'text',
          text: `Echo: ${testText}`,
        },
      ],
    };

    // Act
    const result = await toolHandler({ text: testText });

    // Assert
    expect(result).toEqual(expectedResponse);
  });
});
