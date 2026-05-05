import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const server = new Server(
  {
    name: "@euniii/seo-mcp-server",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

interface SerperResponse {
  organic: Array<{
    title: string;
    snippet: string;
    link: string;
  }>;
}

async function searchCompetitors(keyword: string) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not configured. Please set it in .env file.");
  }

  try {
    const response = await axios.post<SerperResponse>(
      "https://google.serper.dev/search",
      { q: keyword, num: 10 },
      {
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.organic.map((result, index) => ({
      rank: index + 1,
      title: result.title,
      snippet: result.snippet,
      url: result.link,
    }));
  } catch (error) {
    throw new Error(`Search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function generateFAQSchema(keyword: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is ${keyword}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${keyword} is an important topic that many people are interested in learning more about. This guide covers all aspects of ${keyword}.`,
        },
      },
      {
        "@type": "Question",
        name: `Why is ${keyword} important?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${keyword} is important because it helps users achieve better results and improve their understanding of the subject matter.`,
        },
      },
      {
        "@type": "Question",
        name: `How to get started with ${keyword}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `To get started with ${keyword}, begin by understanding the basics and gradually build upon them and then move on to more advanced topics.`,
        },
      },
    ],
  };
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "searchCompetitors",
        description: "搜索关键词的前10名竞争对手页面，包括标题、摘要和链接",
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
      {
        name: "generateSeoPage",
        description: "生成高质量 SEO 页面内容，包括 title、description、markdownContent 和 schemaData（Schema.org 结构化数据）",
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

  if (name === "searchCompetitors") {
    const keyword = args?.keyword as string;
    const competitors = await searchCompetitors(keyword);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(competitors, null, 2),
        },
      ],
    };
  }

  if (name === "generateSeoPage") {
    const keyword = args?.keyword as string;

    const title = `Best ${keyword}: The Ultimate Guide [2024]`;
    const description = `Discover everything you need to know about ${keyword}. Our comprehensive guide covers all aspects, with expert insights and practical tips.`;
    const markdownContent = `# ${title}

## Introduction

Welcome to the ultimate guide on ${keyword}! In this comprehensive article, we'll explore everything you need to know about this important topic.

## What is ${keyword}?

${keyword} is a crucial concept that has gained significant attention in recent years. Understanding ${keyword} refers to the practice or technology that helps users achieve better results.

## Why ${keyword} Matters

Understanding ${keyword} is important because:

1. It improves efficiency
2. It saves time
3. It delivers better outcomes
4. It keeps you ahead of the competition

## Getting Started with ${keyword}

To get started with ${keyword}, follow these steps:

1. Understand the basics
2. Practice regularly
3. Learn from experts
4. Iterate and improve

## Advanced Tips for ${keyword}

Once you've mastered the basics, consider these advanced strategies:

- Dive deeper into niche areas
- Experiment with different approaches
- Stay updated with the latest trends

## Conclusion

We hope this guide has been helpful in your journey with ${keyword}. Remember, practice makes perfect!`;

    const schemaData = generateFAQSchema(keyword);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ title, description, markdownContent, schemaData }, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("@euniii/seo-mcp-server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main:", error);
  process.exit(1);
});
