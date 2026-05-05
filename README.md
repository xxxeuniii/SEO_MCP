# SEO MCP Server

一个用于生成高质量 SEO 页面内容的 MCP Server，支持竞争对手研究和 Schema.org 结构化数据。

## 安装

```bash
npm install @euniii/seo-mcp-server
```

## 功能说明

### 1. searchCompetitors 工具 - 竞争对手研究

搜索关键词的前 10 名竞争对手页面，获取他们的标题、摘要和链接。

- **输入**: keyword（字符串，SEO 关键词）
- **输出**: 包含前 10 名竞争对手的数组，每个对象包含 rank, title, snippet, url

### 2. generateSeoPage 工具 - 生成 SEO 页面

生成高质量 SEO 页面内容，包含完整的 Schema.org 结构化数据（FAQPage）。

- **输入**: keyword（字符串，SEO 关键词）
- **输出**: JSON 格式，包含：
  - `title`: 页面标题
  - `description`: Meta 描述
  - `markdownContent`: Markdown 格式的正文内容
  - `schemaData`: Schema.org 结构化数据（JSON-LD 格式，FAQPage 类型）

## 配置

### Serper.dev API Key (可选)

如果你想使用 `searchCompetitors` 工具：

1. 复制 `.env.example` 为 `.env`
2. 访问 https://serper.dev/ 注册并获取 API Key（免费额度 2500 次/月）
3. 在 `.env` 文件中填入你的 API Key：

```env
SERPER_API_KEY=your_serper_api_key_here
```

## 使用示例

在 Trae/Claude 中，你可以这样使用：

```
帮我写一个关于 "React Hooks" 的 SEO 页面。
先调用 searchCompetitors 看看竞争对手都是怎么写的，
然后基于他们的内容生成一个更全面、覆盖维度更多的页面。
```

## 开发

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
npm run build
```

### 启动 Server

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## 在 Trae 中配置 MCP Server

在 Trae 的配置文件中添加此 MCP Server 即可使用。

## Links

- 📦 npm: https://www.npmjs.com/package/@euniii/seo-mcp-server
- 📁 GitHub: https://github.com/xxxeuniii/SEO_MCP
- 🔍 Serper.dev: https://serper.dev/
