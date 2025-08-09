import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerGetTimeTool } from '../getTime.js';

// Mock the McpServer
vi.mock('@modelcontextprotocol/sdk/server/mcp.js');

describe('GetTime Tool', () => {
  let mockServer: any;
  let toolHandler: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = {
      tool: vi.fn(),
    };
    
    // Register the tool and capture the handler
    registerGetTimeTool(mockServer);
    toolHandler = mockServer.tool.mock.calls[0][3]; // Get the handler function
  });

  it('should register get_time tool with correct configuration', () => {
    // Arrange & Act
    registerGetTimeTool(mockServer);

    // Assert
    expect(mockServer.tool).toHaveBeenCalledWith(
      'get_time',
      'Get the current time in ISO format',
      {},
      expect.any(Function)
    );
  });

  it('should return current time in ISO format', async () => {
    // Arrange
    const mockDate = new Date('2023-01-01T12:00:00.000Z');
    vi.setSystemTime(mockDate);

    // Act
    const result = await toolHandler();

    // Assert
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Current time: 2023-01-01T12:00:00.000Z',
        },
      ],
    });
  });

  it('should return different times when called multiple times', async () => {
    // Arrange
    const firstDate = new Date('2023-01-01T12:00:00.000Z');
    const secondDate = new Date('2023-01-01T12:00:01.000Z');
    
    vi.setSystemTime(firstDate);
    const firstResult = await toolHandler();
    
    vi.setSystemTime(secondDate);
    const secondResult = await toolHandler();

    // Assert
    expect(firstResult.content[0].text).toBe('Current time: 2023-01-01T12:00:00.000Z');
    expect(secondResult.content[0].text).toBe('Current time: 2023-01-01T12:00:01.000Z');
    expect(firstResult.content[0].text).not.toBe(secondResult.content[0].text);
  });

  it('should handle leap year dates correctly', async () => {
    // Arrange
    const leapYearDate = new Date('2024-02-29T23:59:59.999Z');
    vi.setSystemTime(leapYearDate);

    // Act
    const result = await toolHandler();

    // Assert
    expect(result.content[0].text).toBe('Current time: 2024-02-29T23:59:59.999Z');
  });
});
