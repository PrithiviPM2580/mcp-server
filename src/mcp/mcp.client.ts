import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import ai from "../config/gemini.config.ts";

const messages: any[] = []; // Full conversation tracking

async function main() {
  console.log("🚀 Starting MCP Client...");

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
  console.log("✅ Connected to MCP Server");

  // 1. Step: Add user input
  const userMessage = "Add 2 and 3";
  messages.push({ role: "user", parts: [{ text: userMessage }] });
  console.log("👤 User:", userMessage);

  // 2. Step: Load tools from MCP server
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
  console.log("🛠️ Loaded Tools from MCP Server:", toolDefinitions);

  // Ask Gemini: Should it use a tool?
  console.log("🤖 Sending to Gemini (with tools enabled)...");
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: messages,
    config: { tools: [{ functionDeclarations: toolDefinitions as any }] },
  });

  console.log("📥 Gemini Raw Response:", JSON.stringify(response, null, 2));

  if (!response.functionCalls || response.functionCalls.length === 0) {
    console.log("⚠️ Gemini did not request any tool.");
    return;
  }

  const call = response.functionCalls[0];
  console.log("🛎️ Gemini wants to use Tool:", call);

  // 3. Add model function call to messages
  messages.push({ role: "model", parts: [{ functionCall: call }] });

  // 4. Execute tool
  console.log(`⚙️ Executing MCP Tool '${call.name}' with args:`, call.args);
  const toolResult = await mcpClient.callTool({
    name: call.name!,
    arguments: call.args,
  });

  console.log("📦 Tool Response:", toolResult);

  // 5. Add tool result
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

  // 6. Ask Gemini final natural language response
  console.log("💬 Sending final function result back to Gemini...");
  const finalResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: messages,
  });

  console.log("✅ Final Answer:", finalResponse.text);
}

main().catch((error) => {
  console.error("❌ Error occurred:", error);
});
