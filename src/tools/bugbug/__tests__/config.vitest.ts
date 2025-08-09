import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerBugBugConfigTools } from '../config.js';
import { BugBugApiClient } from '../../../utils/bugbugClient.js';

// Mock the BugBugApiClient
vi.mock('../../../utils/bugbugClient.js', () => ({
  BugBugApiClient: vi.fn(),
}));

describe('BugBug Config Tools', () => {
  let mockServer: McpServer;
  let toolHandler: any;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Arrange - Create mock client
    mockClient = {
      getIpAddresses: vi.fn(),
    };
    
    vi.mocked(BugBugApiClient).mockImplementation(() => mockClient);
    
    // Arrange - Create mock server
    mockServer = {
      tool: vi.fn((name, description, schema, handler) => {
        if (name === 'bugbug_get_ip_addresses') {
          toolHandler = handler;
        }
      }),
    } as any;

    registerBugBugConfigTools(mockServer);
  });

  it('should register bugbug_get_ip_addresses tool with correct parameters', () => {
    // Assert
    expect(mockServer.tool).toHaveBeenCalledWith(
      'bugbug_get_ip_addresses',
      'Get list of BugBug infrastructure IP addresses',
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('should successfully fetch IP addresses', async () => {
    // Arrange
    const mockIpAddresses = ['192.168.1.1', '10.0.0.1', '172.16.0.1'];
    mockClient.getIpAddresses.mockResolvedValue({
      status: 200,
      data: mockIpAddresses,
    });

    // Act
    const result = await toolHandler({ apiToken: 'test-token' });

    // Assert
    expect(BugBugApiClient).toHaveBeenCalledWith({ apiToken: 'test-token' });
    expect(mockClient.getIpAddresses).toHaveBeenCalled();
    expect(result.content[0].text).toContain('BugBug Infrastructure IP Addresses');
    expect(result.content[0].text).toContain('192.168.1.1');
    expect(result.content[0].text).toContain('10.0.0.1');
    expect(result.content[0].text).toContain('172.16.0.1');
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    mockClient.getIpAddresses.mockResolvedValue({
      status: 401,
      statusText: 'Unauthorized',
    });

    // Act
    const result = await toolHandler({ apiToken: 'invalid-token' });

    // Assert
    expect(result.content[0].text).toBe('Error: 401 Unauthorized');
  });

  it('should handle network errors gracefully', async () => {
    // Arrange
    mockClient.getIpAddresses.mockRejectedValue(new Error('Network error'));

    // Act
    const result = await toolHandler({ apiToken: 'test-token' });

    // Assert
    expect(result.content[0].text).toContain('Error fetching IP addresses');
    expect(result.content[0].text).toContain('Network error');
  });
});
