import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "seo-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generateSeoPage",
        description: "生成 SEO 页面内容，包括 title、description 和 markdownContent",
        inputSchema: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "SEO 关键词",
            },
          },
          required: ["keyword"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "generateSeoPage") {
    const keyword = args?.keyword as string;

    const title = `Best ${keyword}`;
    const description = `A comprehensive guide to ${keyword}. Learn everything you need to know about ${keyword} with our expert insights.`;
    const markdownContent = `# ${title}\n\n## Introduction\n\nWelcome to our complete guide on ${keyword}. In this article, we'll explore everything you need to know about this important topic.\n\n## Key Points\n\n- ${keyword} is an essential concept in modern web development\n- Understanding ${keyword} can significantly improve your productivity\n- This guide covers both basic and advanced aspects of ${keyword}\n\n## Conclusion\n\nWe hope this guide has helped you understand ${keyword} better. Stay tuned for more updates!`;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ title, description, markdownContent }, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SEO MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main:", error);
  process.exit(1);
});
