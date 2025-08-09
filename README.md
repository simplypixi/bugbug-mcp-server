# BugBug MCP Server

A Model Context Protocol (MCP) server implementation in TypeScript that provides tools for BugBug functionality.

## Features

- **Echo Tool**: Echo back input text with Zod validation
- **Time Tool**: Get current timestamp in ISO format
- Built with TypeScript for type safety
- Modern McpServer implementation following official patterns
- Zod schema validation for robust input handling
- Comprehensive test suite with Vitest
- ESM module support

## Installation

```bash
npm install
```

## Development

```bash
# Build the project
npm run build

# Development mode with watch
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Usage

### Running the Server

```bash
npm start
```

The server runs on stdio transport and communicates via JSON-RPC.

### Available Tools

#### echo
Echoes back the provided text with input validation.

**Parameters:**
- `text` (string, required): Text to echo back

**Example:**
```json
{
  "text": "Hello, World!"
}
```

#### get_time
Returns the current timestamp in ISO format.

**Parameters:** None

**Example response:**
```
Current time: 2025-08-09T12:00:00.000Z
```

## Project Structure

```
src/
├── index.ts              # Main server implementation using McpServer
└── __tests__/
    └── index.vitest.ts   # Test suite
```

## Configuration

The server is configured to use:
- **Transport**: stdio
- **Protocol**: JSON-RPC over MCP
- **Server Class**: McpServer from @modelcontextprotocol/sdk
- **Validation**: Zod schemas for type-safe input validation

## Testing

Tests are written using Vitest and follow the AAA (Arrange, Act, Assert) pattern. Run tests with:

```bash
npm test
```

## Development Notes

- Uses modern McpServer class with `server.tool()` method
- Zod schemas for input validation and type safety
- ESM modules with .js extensions in imports
- TypeScript strict mode enabled
- Follows semantic naming conventions
- Includes comprehensive error handling

## Dependencies

- `@modelcontextprotocol/sdk`: MCP server implementation
- `zod`: Schema validation and type inference

## License

MIT
