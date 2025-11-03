import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import ai from "../config/gemini.config.ts";

const messages: any[] = []; // ✅ Full conversation history

async function main() {
  console.log("🚀 Starting MCP Client...");

  // ✅ 1. Initialize MCP Client
  const mcpClient = new Client({
    name: "MCP Stdio Client",
    title: "Model Context Protocol Stdio Client",
    version: "1.0.0",
  });

  const clientTransport = new StdioClientTransport({
    command: process.execPath,
    args: ["./src/mcp/mcp.server.ts"],
  });

  await mcpClient.connect(clientTransport);
  console.log("✅ Connected to MCP Server\n");

  // ✅ 2. Add user message
  const userMessage = "Subtract 15 from 45 and tell me the result.";
  messages.push({ role: "user", parts: [{ text: userMessage }] });
  console.log("👤 User:", userMessage);

  // ✅ 3. Load tool definitions from MCP server
  const { tools } = await mcpClient.listTools();
  const toolDefinitions = tools.map((tool: any) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: "object",
      properties: tool.inputSchema.properties,
      required: tool.inputSchema.required,
    },
  }));
  console.log("🛠️ Tools Available:", toolDefinitions, "\n");

  // ✅ 4. Loop → Ask Gemini → If tool call → execute → return result → repeat
  while (true) {
    console.log("🤖 Sending conversation to Gemini to decide next step...");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages,
      config: { tools: [{ functionDeclarations: toolDefinitions as any }] },
    });

    console.log("📥 Raw Gemini Response:", JSON.stringify(response, null, 2));

    // ✅ 5. If no functionCall → final natural answer → exit loop
    if (!response.functionCalls || response.functionCalls.length === 0) {
      console.log("✅ Final Answer:", response.text);
      break;
    }

    // ✅ 6. Gemini requested a tool → handle it
    const call = response.functionCalls[0];
    console.log(
      "🛎️ Gemini is calling tool:",
      call.name,
      "with args:",
      call.args
    );

    // Add function call to conversation
    messages.push({
      role: "model",
      parts: [{ functionCall: call }],
    });

    // ✅ 7. Execute tool using MCP server
    const toolResult = await mcpClient.callTool({
      name: call.name!,
      arguments: call.args,
    });
    console.log("📦 MCP Tool Result:", toolResult);

    // Add tool result back to LLM context
    messages.push({
      role: "function",
      parts: [
        {
          functionResponse: {
            name: call.name,
            response: toolResult,
          },
        },
      ],
    });
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
});
