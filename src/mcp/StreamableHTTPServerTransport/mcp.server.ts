import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";
import { number } from "zod/v4";
import { config } from "../../config/env.config.ts";

// Create MCP Server
const mcpServer = new McpServer({
  name: "MCP Streamable HTTP Server",
  version: "1.0.0",
  description: "An MCP server using Streamable HTTP Transport",
});

// Define Register Tool

// Tool 1: Addition Tool
mcpServer.registerTool(
  "addition-too",
  {
    title: "Addition Tool",
    description: "A tool that adds two numbers",
    inputSchema: {
      a: z.number().describe("The first number"),
      b: z.number().describe("The second number"),
    },
    outputSchema: {
      result: z.number().describe("The sum of the two numbers"),
    },
  },
  async ({ a, b }) => {
    const output = { result: a + b };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  }
);

// Tool 2: Calculate BMI Tool
mcpServer.registerTool(
  "bmi-calculator",
  {
    title: "BMI Calculator",
    description: "A tool that calculates Body Mass Index (BMI)",
    inputSchema: {
      weight: z.number().describe("Weight in kilograms"),
      height: z.number().describe("Height in meters"),
    },
    outputSchema: {
      bmi: z.number().describe("Calculated BMI value"),
    },
  },
  async ({ weight, height }) => {
    const bmi = weight / (height * height);
    const output = { bmi };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  }
);

// Tool 3: Fetch Weather Tool
mcpServer.registerTool(
  "fetch-weather",
  {
    title: "Fetch Weather",
    description: "A tool that fetches weather information for a given city",
    inputSchema: {
      city: z.string().describe("Name of the city"),
    },
    outputSchema: {
      temperature: z.number().describe("Current temperature in Celsius"),
      condition: z.string().describe("Weather condition description"),
    },
  },
  async ({ city }) => {
    const WEATHER_BASE_URL = "https://api.weatherapi.com/v1";
    const weather_url = `${WEATHER_BASE_URL}/current.json?key=${config.WEATHER_API_KEY}&q=${city}`;
    const response = await fetch(weather_url);
    const data = await response.json();
    const weatherInfo = {
      temperature: data.current.temp_c,
      condition: data.current.condition.text,
    };

    return {
      content: [{ type: "text", text: JSON.stringify({ weatherInfo }) }],
      structuredContent: { weatherInfo },
    };
  }
);

// Tool 4: List Files Tool
mcpServer.registerTool(
  "list-files",
  {
    title: "List Files",
    description: "A tool that lists files in a directory",
    inputSchema: {
      pattern: z.string().describe("File pattern to match"),
    },
    outputSchema: {
      count: z.number().describe("Number of files matched"),
      files: z
        .array(z.object({ name: z.string(), uri: z.string() }))
        .describe("List of matched files"),
    },
  },
  async ({ pattern }) => {
    const output = {
      count: 2,
      files: [
        {
          name: "tsconfig.json",
          uri: "file:///A:/Desktop/mcp-server/tsconfig.json",
        },
        {
          name: "package.json",
          uri: "file:///A:/Desktop/mcp-server/package.json",
        },
      ],
    };

    return {
      content: [
        { type: "text", text: JSON.stringify(output) },
        {
          type: "resource_link",
          uri: "file:///A:/Desktop/mcp-server/tsconfig.json",
          name: "tsconfig.json",
          mimeType: "application/json",
          description: "A TypeScript configuration file",
        },
        {
          type: "resource_link",
          uri: "file:///A:/Desktop/mcp-server/package.json",
          name: "package.json",
          mimeType: "application/json",
          description: "A package configuration file",
        },
      ],
      structuredContent: output,
    };
  }
);

// Start Express Server with Streamable HTTP Transport
const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close();
  });

  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const port = parseInt(config.PORT || "3001");
app
  .listen(port, () => {
    console.log(`Demo MCP Server running on http://localhost:${port}/mcp`);
  })
  .on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
