import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerBugBugConfigTools } from '../config.js';
import type { BugBugApiClient } from '../../../utils/bugbugClient.js';

interface MockToolHandler {
  (): Promise<{ content: Array<{ type: string; text: string }> }>;
}

describe('BugBug Config Tools', () => {
  let mockServer: McpServer;
  let toolHandler: MockToolHandler;
  let mockClient: Partial<BugBugApiClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Arrange - Create mock client
    const mockGetIpAddresses = vi.fn();
    mockClient = {
      getIpAddresses: mockGetIpAddresses,
    };
    
    // Arrange - Create mock server
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        if (name === 'get_ip_addresses') {
          toolHandler = handler;
        }
      }),
    } as never;

    registerBugBugConfigTools(mockServer, mockClient);
  });

  it('should register get_ip_addresses tool with correct parameters', () => {
    // Assert
    expect(mockServer.tool).toHaveBeenCalledWith(
      'get_ip_addresses',
      'Get list of BugBug infrastructure IP addresses',
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should successfully fetch IP addresses', async () => {
    // Arrange
    const mockIpAddresses = ['192.168.1.1', '10.0.0.1', '172.16.0.1'];
    vi.mocked(mockClient.getIpAddresses).mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: mockIpAddresses,
    });

    // Act
    const result = await toolHandler({});

    // Assert
    expect(mockClient.getIpAddresses).toHaveBeenCalled();
    expect(result.content[0].text).toContain('BugBug Infrastructure IP Addresses');
    expect(result.content[0].text).toContain('192.168.1.1');
    expect(result.content[0].text).toContain('10.0.0.1');
    expect(result.content[0].text).toContain('172.16.0.1');
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    vi.mocked(mockClient.getIpAddresses).mockResolvedValue({
      status: 401,
      statusText: 'Unauthorized',
      data: [],
    });

    // Act
    const result = await toolHandler({});

    // Assert
    expect(result.content[0].text).toBe('Error: 401 Unauthorized');
  });

  it('should handle network errors gracefully', async () => {
    // Arrange
    vi.mocked(mockClient.getIpAddresses).mockRejectedValue(new Error('Network error'));

    // Act
    const result = await toolHandler({});

    // Assert
    expect(result.content[0].text).toContain('Error fetching IP addresses');
    expect(result.content[0].text).toContain('Network error');
  });

  it('should handle missing API_KEY environment variable', async () => {
    // Arrange
    delete process.env.API_KEY;
    vi.mocked(mockClient.getIpAddresses).mockRejectedValue(new Error('Cannot read properties of undefined (reading \'status\')'));

    // Act
    const result = await toolHandler({});

    // Assert
    expect(result.content[0].text).toContain('Error fetching IP addresses');
    expect(result.content[0].text).toContain('Cannot read properties of undefined (reading \'status\')');
  });
});
