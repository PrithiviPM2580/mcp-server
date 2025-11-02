import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const mcpClient = new Client({
  name: "MCP Stdio Client",
  title: "Model Context Protocol Stdio Client",
  version: "1.0.0",
});

async function main() {
  const clientTransport = new StdioClientTransport({
    command: process.execPath,
    args: ["./src/mcp/mcp.server.ts"],
  });

  await mcpClient.connect(clientTransport);

  const tools = await mcpClient.listTools();
  console.log("Available tools:", tools);
}

main().catch((error) => {
  console.error("Error starting MCP Client:", error);
  process.exit(1);
});
