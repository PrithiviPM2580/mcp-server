import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "first-mcp-server",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

server.tool(
  "add-two-numbers",
  "Adds two numbers together",
  {
    a: z.number().describe("The first number to add"),
    b: z.number().describe("The second number to add"),
  },
  async ({ a, b }) => {
    return {
      content: [
        { type: "text", text: `The sum of ${a} and ${b} is ${a + b}.` },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Error starting MCP server:", err);
  process.exit(1);
});
