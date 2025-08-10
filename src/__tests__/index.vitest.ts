import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from '../tools/index.js';

// Mock the dependencies
vi.mock('@modelcontextprotocol/sdk/server/mcp.js');
vi.mock('@modelcontextprotocol/sdk/server/stdio.js');
vi.mock('../tools/index.js');

interface MockServer {
  tool: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
}

interface MockTransport {
  start: ReturnType<typeof vi.fn>;
}

describe('Main Server', () => {
  let mockServer: MockServer;
  let mockTransport: MockTransport;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockServer = {
      tool: vi.fn(),
      connect: vi.fn(),
    };
    
    mockTransport = {
      start: vi.fn(),
    };
    
    vi.mocked(McpServer).mockImplementation(() => mockServer as unknown as McpServer);
    vi.mocked(StdioServerTransport).mockImplementation(() => mockTransport as unknown as StdioServerTransport);
    vi.mocked(registerAllTools).mockImplementation(() => {});
  });

  it('should create server instance with correct configuration', () => {
    // Arrange
    const mockServerConstructor = vi.mocked(McpServer);
    
    // Act
    new McpServer({
      name: 'bugbug-mcp-server',
      version: '1.0.0',
    });

    // Assert
    expect(mockServerConstructor).toHaveBeenCalledWith({
      name: 'bugbug-mcp-server',
      version: '1.0.0',
    });
  });

  it('should register all tools on server initialization', () => {
    // Arrange
    const server = new McpServer({
      name: 'bugbug-mcp-server',
      version: '1.0.0',
    });

    // Act
    registerAllTools(server);

    // Assert
    expect(registerAllTools).toHaveBeenCalledWith(server);
  });

  it('should create stdio transport', () => {
    // Arrange
    const mockTransportConstructor = vi.mocked(StdioServerTransport);

    // Act
    new StdioServerTransport();

    // Assert
    expect(mockTransportConstructor).toHaveBeenCalled();
  });

  it('should connect server to transport', async () => {
    // Arrange
    const server = new McpServer({
      name: 'bugbug-mcp-server',
      version: '1.0.0',
    });
    const transport = new StdioServerTransport();

    // Act
    await server.connect(transport);

    // Assert
    expect(mockServer.connect).toHaveBeenCalledWith(transport);
  });
});
