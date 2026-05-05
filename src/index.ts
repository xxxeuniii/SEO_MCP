/**
 * SEO MCP Server - 一个用于生成高质量 SEO 页面内容的 MCP 服务
 * 
 * 功能：
 * 1. searchCompetitors - 搜索竞争对手页面，获取前10名的标题、摘要和链接
 * 2. generateSeoPage - 生成 SEO 页面内容，包括标题、描述、Markdown 内容和 Schema.org 结构化数据
 * 
 * @author euniii
 * @version 2.0.0
 */

// 导入 MCP SDK 相关模块
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 导入 HTTP 请求库，用于调用 Serper.dev API
import axios from "axios";
// 导入环境变量管理库
import dotenv from "dotenv";

// 从 .env 文件中加载环境变量
dotenv.config();

/**
 * 创建 MCP Server 实例
 * 
 * 配置：
 * - name: 服务器名称，使用作用域包名避免冲突
 * - version: 版本号
 * - capabilities.tools: 声明该服务器支持的工具类型
 */
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

/**
 * Serper.dev API 响应数据类型定义
 * 
 * organic: 自然搜索结果数组
 */
interface SerperResponse {
  organic: Array<{
    title: string;    // 页面标题
    snippet: string;  // 页面摘要
    link: string;    // 页面链接
  }>;
}

/**
 * 搜索竞争对手页面
 * 
 * 功能：调用 Serper.dev API 搜索指定关键词，返回前 10 名的搜索结果
 * 
 * @param keyword - SEO 关键词
 * @returns Promise<Array<{ rank: number; title: string; snippet: string; url: string }>>
 *          包含排名、标题、摘要和链接的竞争对手数组
 * @throws 当 SERPER_API_KEY 未配置或 API 搜索失败时抛出错误
 */
async function searchCompetitors(keyword: string) {
  // 从环境变量中获取 Serper.dev API Key
  const apiKey = process.env.SERPER_API_KEY;
  
  // 检查 API Key 是否配置
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not configured. Please set it in .env file.");
  }

  try {
    // 调用 Serper.dev 搜索 API
    const response = await axios.post<SerperResponse>(
      "https://google.serper.dev/search",
      { q: keyword, num: 10 },  // 搜索关键词，返回前 10 条结果
      {
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    // 格式化响应数据，添加排名字段
    return response.data.organic.map((result, index) => ({
      rank: index + 1,      // 排名（从 1 开始）
      title: result.title,  // 页面标题
      snippet: result.snippet,  // 页面摘要
      url: result.link,     // 页面链接
    }));
  } catch (error) {
    // 捕获并格式化错误信息
    throw new Error(`Search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * 生成 Schema.org FAQPage 结构化数据
 * 
 * 功能：生成 FAQ 类型的结构化数据，能让 Google 搜索结果显示 FAQ 下拉框
 * 
 * @param keyword - SEO 关键词
 * @returns FAQPage 类型的 JSON-LD 对象
 */
function generateFAQSchema(keyword: string) {
  return {
    "@context": "https://schema.org",  // Schema.org 上下文
    "@type": "FAQPage",              // 类型为 FAQ 页面
    mainEntity: [                     // 主要内容实体
      {
        "@type": "Question",         // 问题类型
        name: `What is ${keyword}?`,  // 问题标题
        acceptedAnswer: {           // 接受的答案
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

/**
 * 注册 listTools 请求处理器
 * 
 * 功能：当 AI 客户端请求可用工具列表时，返回本服务器支持的所有工具
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // 工具 1：搜索竞争对手
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
          required: ["keyword"],  // 必填参数
        },
      },
      // 工具 2：生成 SEO 页面
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
          required: ["keyword"],  // 必填参数
        },
      },
    ],
  };
});

/**
 * 注册 callTool 请求处理器
 * 
 * 功能：当 AI 客户端调用工具时，根据工具名称分发到对应的处理函数
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // 从请求参数中获取工具名称和参数
  const { name, arguments: args } = request.params;

  // 处理 searchCompetitors 工具调用
  if (name === "searchCompetitors") {
    // 获取关键词参数
    const keyword = args?.keyword as string;
    // 调用搜索函数
    const competitors = await searchCompetitors(keyword);
    // 返回 JSON 格式的结果
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(competitors, null, 2),
        },
      ],
    };
  }

  // 处理 generateSeoPage 工具调用
  if (name === "generateSeoPage") {
    // 获取关键词参数
    const keyword = args?.keyword as string;

    // 1. 生成页面标题（包含年份，显得更及时）
    const title = `Best ${keyword}: The Ultimate Guide [2024]`;
    
    // 2. 生成 Meta 描述（用于搜索引擎显示）
    const description = `Discover everything you need to know about ${keyword}. Our comprehensive guide covers all aspects, with expert insights and practical tips.`;
    
    // 3. 生成 Markdown 格式的页面正文内容
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
    
    // 4. 生成 Schema.org FAQ 结构化数据
    const schemaData = generateFAQSchema(keyword);

    // 返回完整的 SEO 页面数据
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ title, description, markdownContent, schemaData }, null, 2),
        },
      ],
    };
  }

  // 如果工具名称不匹配，抛出错误
  throw new Error(`Unknown tool: ${name}`);
});

/**
 * 主函数 - 启动 MCP Server
 * 
 * 功能：
 * 1. 创建 stdio 传输（这是 MCP 推荐的标准通信方式
 * 2. 连接服务器
 * 3. 打印启动日志
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("@euniii/seo-mcp-server running on stdio");
}

/**
 * 启动服务器并处理错误
 */
main().catch((error) => {
  console.error("Fatal error in main:", error);
  process.exit(1);
});
