import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getIpAddressesTool } from '../config.js';
import * as bugbugClientModule from '../../services/bugbugClient.js';

describe('BugBug Config Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the bugbugClient
    const mockClient = {
      getIpAddresses: vi.fn(),
    };
    vi.spyOn(bugbugClientModule, 'bugbugClient', 'get').mockReturnValue(mockClient as unknown as typeof bugbugClientModule.bugbugClient);
    
    // Set API_KEY environment variable
    process.env.API_KEY = 'test-token';
  });

  it('should export get_ip_addresses tool', () => {
    // Assert
    expect(getIpAddressesTool).toBeDefined();
    expect(getIpAddressesTool.name).toBe('get_ip_addresses');
    expect(getIpAddressesTool.title).toBe('Get list of BugBug infrastructure IP addresses');
    expect(getIpAddressesTool.description).toBe('Get list of BugBug infrastructure IP addresses');
  });

  it('should successfully fetch IP addresses', async () => {
    // Arrange
    const mockIpAddresses = ['192.168.1.1', '10.0.0.1', '172.16.0.1'];
    bugbugClientModule.bugbugClient.getIpAddresses = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: mockIpAddresses,
    });

    // Act
    const result = await getIpAddressesTool.handler({});

    // Assert
    expect(bugbugClientModule.bugbugClient.getIpAddresses).toHaveBeenCalled();
    expect(result.content[0].text).toContain('BugBug Infrastructure IP Addresses');
    expect(result.content[0].text).toContain('192.168.1.1');
    expect(result.content[0].text).toContain('10.0.0.1');
    expect(result.content[0].text).toContain('172.16.0.1');
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    bugbugClientModule.bugbugClient.getIpAddresses = vi.fn().mockResolvedValue({
      status: 401,
      statusText: 'Unauthorized',
      data: [],
    });

    // Act
    const result = await getIpAddressesTool.handler({});

    // Assert
    expect(result.content[0].text).toBe('Error: 401 Unauthorized');
  });

  it('should handle network errors gracefully', async () => {
    // Arrange
    bugbugClientModule.bugbugClient.getIpAddresses = vi.fn().mockRejectedValue(new Error('Network error'));

    // Act
    const result = await getIpAddressesTool.handler({});

    // Assert
    expect(result.content[0].text).toContain('Error fetching IP addresses');
    expect(result.content[0].text).toContain('Network error');
  });

  it('should handle missing API_KEY environment variable', async () => {
    // Arrange
    delete process.env.API_KEY;
    bugbugClientModule.bugbugClient.getIpAddresses = vi.fn().mockRejectedValue(new Error('Cannot read properties of undefined (reading \'status\')'));

    // Act
    const result = await getIpAddressesTool.handler({});

    // Assert
    expect(result.content[0].text).toContain('Error fetching IP addresses');
    expect(result.content[0].text).toContain('Cannot read properties of undefined (reading \'status\')');
  });
});
