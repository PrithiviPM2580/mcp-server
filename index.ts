import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const server = new McpServer({
  name: "first-mcp-server",
  version: "1.0.0",
  capabilities: {
    tools: {},
    resources: {},
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

server.tool(
  "github-repo",
  "Fetches information about a GitHub repository",
  {
    username: z.string().describe("The GitHub username"),
  },
  async ({ username }) => {
    const res = await fetch(`https://api.github.com/users/${username}/repos`, {
      headers: {
        "User-Agent": "MCP-Server",
      },
    });

    if (!res.ok)
      throw new Error(
        `Failed to fetch repos for user ${username}: ${res.statusText}`
      );

    const repos = await res.json();
    const repoNames = repos
      .map((repo: any, index: number) => `${index + 1}. ${repo.name}`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Repositories for user ${username}: ${repoNames}`,
        },
      ],
    };
  }
);

server.resource(
  "data-document", // Resource name
  "rules://all", // Resource URI schema
  {
    description:
      "A document containing security and performance configuration rules.",
    mimeType: "text/plain", // Correct MIME type
  },
  async (uri) => {
    const uriString = uri.toString();

    // Resolve directory path
    const __fileName = fileURLToPath(import.meta.url);
    const __dirName = path.dirname(__fileName);

    // File location
    const filePath = path.resolve(__dirName, "./data/rules.doc");

    // Read contents
    const rules = await fs.readFile(filePath, "utf-8");

    return {
      contents: [
        {
          uri: uriString, // ✅ Must be in "contents"
          text: rules, // ✅ Must be called "text"
          mimeType: "text/plain",
        },
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
