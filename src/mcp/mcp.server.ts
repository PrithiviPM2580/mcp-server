import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const mcpServer = new McpServer({
  name: "MCP Stdio Server",
  title: "Model Context Protocol Stdio Server",
  version: "1.0.0",
});

mcpServer.registerTool(
  "add",
  {
    title: "Addition Tool",
    description: "Add two numbers",
    inputSchema: { a: z.number(), b: z.number() },
    outputSchema: { result: z.number() },
  },
  async ({ a, b }) => {
    const output = { result: a + b };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  }
);

mcpServer.registerTool(
  "subtract",
  {
    title: "Subtraction Tool",
    description: "Subtract two numbers",
    inputSchema: { a: z.number(), b: z.number() },
    outputSchema: { result: z.number() },
  },
  async ({ a, b }) => {
    const output = { result: a - b };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  }
);
mcpServer.registerTool(
  "multiply",
  {
    title: "Multiplication Tool",
    description: "Multiply two numbers",
    inputSchema: { a: z.number(), b: z.number() },
    outputSchema: { result: z.number() },
  },
  async ({ a, b }) => {
    const output = { result: a * b };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  }
);
mcpServer.registerTool(
  "divide",
  {
    title: "Division Tool",
    description: "Divide two numbers",
    inputSchema: { a: z.number(), b: z.number() },
    outputSchema: { result: z.number() },
  },
  async ({ a, b }) => {
    if (b === 0) {
      throw new Error("Division by zero is not allowed.");
    }
    const output = { result: a / b };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  }
);

async function main() {
  const serverTransport = new StdioServerTransport();
  await mcpServer.connect(serverTransport);
}

main().catch((error) => {
  console.error("Error starting MCP server:", error);
  process.exit(1);
});
