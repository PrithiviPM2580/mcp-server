import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";
import { config } from "../../config/env.config.ts";

const mcpServer = new McpServer({
  name: "MCP Streamable HTTP Server for Resource",
  title: "Model Context Protocol Streamable HTTP Server for Resource",
  version: "1.0.0",
});

mcpServer.registerResource(
  "weather",
  new ResourceTemplate("weather://city/{cityName}", { list: undefined }),
  {
    title: "Weather Information Resource",
    description: "Provides weather information for a specified city",
  },
  async (uri, { cityName }) => {
    const WEATHER_BASE_URL = "https://api.weatherapi.com/v1";
    const weather_url = `${WEATHER_BASE_URL}/current.json?key=${config.WEATHER_API_KEY}&q=${cityName}`;
    const response = await fetch(weather_url);
    const data = await response.json();
    const weatherInfo = `The current temperature in ${cityName} is ${data.current.temp_c}°C with ${data.current.condition.text}.`;
    return {
      contents: [
        {
          uri: uri.href,
          text: weatherInfo,
        },
      ],
    };
  }
);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/mcp/weather", async (req, res) => {
  console.log("MCP is working");
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    console.log("Transport Close");
    transport.close();
  });

  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const PORT = 3002;
app
  .listen(PORT, () => {
    console.log(
      `Demo MCP Server running on http://localhost:${PORT}/mcp/weather`
    );
  })
  .on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
