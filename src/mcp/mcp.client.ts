import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import ai from "../config/gemini.config.ts";

const toolCalls: any[] = [];

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

  const { tools } = await mcpClient.listTools();
  tools.forEach((tool: any) => {
    toolCalls.push({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: tool.inputSchema.properties,
        required: tool.inputSchema.required,
      },
    });
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Add 2 and 3",
    config: {
      tools: [
        {
          functionDeclarations: toolCalls,
        },
      ],
    },
  });

  console.log("Tool Called: ", response.functionCalls);

  response.functionCalls?.forEach(async (call) => {
    const result = await mcpClient.callTool({
      name: call.name!,
      arguments: call.args!,
    });

    console.log("Result:", result);
  });
}

main().catch((error) => {
  console.error("Error starting MCP Client:", error);
  process.exit(1);
});
