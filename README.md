# Echo2 - AI 智能笔记本系统

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/hake971920/Echo2?style=social)](https://github.com/hake971920/Echo2)
[![Node.js Version](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18+-blue)](https://react.dev/)

**一个智能笔记系统，由 AI 驱动，让你的学习和研究更高效**

[📖 文档](#文档) • [🚀 快速开始](#快速开始) • [📝 API 文档](#api-文档) • [💬 讨论](#讨论) • [📄 许可证](#许可证)

</div>

---

## ✨ 特性

### 核心功能
- 📝 **笔记管理** - 创建、编辑、删除笔记，支持文本和图像
- 🤖 **AI 驱动** - 自动生成摘要、关键词和分类标签
- 🔍 **智能搜索** - 关键词搜索和 AI 自然语言查询
- 🏷️ **标签分类** - 自动和手动分类，组织知识
- 📊 **知识图谱** - 可视化笔记关系和知识网络

### 即将推出
- 📜 **版本历史** - 笔记编辑历史和恢复功能
- 📥 **导出功能** - 支持 PDF、Markdown 导出
- 🏗️ **分层标签** - 多级标签分类体系
- ⏰ **复习提醒** - 间隔式重复学习提醒
- 🔄 **高级搜索** - 日期、标签、用户等多维度过滤

---

## 🛠️ 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18+ | UI 框架 |
| **TypeScript** | 最新 | 类型安全 |
| **Vite** | 最新 | 构建工具 |
| **TailwindCSS** | 3+ | 样式框架 |
| **Axios** | 最新 | HTTP 客户端 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| **Node.js** | 18+ | 运行时 |
| **Express** | 4+ | Web 框架 |
| **TypeScript** | 最新 | 类型安全 |
| **SQLite** | 最新 | 数据库 |
| **better-sqlite3** | 最新 | 数据库驱动 |

### 外部服务
- **DeepSeek API** - AI 摘要和分类

---

## 🚀 快速开始

### 系统要求
- Node.js 18+
- npm 或 yarn 或 pnpm
- Git

### 安装步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/hake971920/Echo2.git
cd Echo2
```

#### 2. 安装依赖

```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

#### 3. 配置环境变量

**后端配置** - 创建 `backend/.env`

```bash
# 复制示例配置
cp backend/.env.example backend/.env

# 编辑 .env，设置以下变量
PORT=3001
DEEPSEEK_API_KEY=your_deepseek_api_key_here  # 从 DeepSeek 获取
AUTH_SECRET=your_secret_key_here             # 生成一个强密钥
```

**获取 DeepSeek API Key**：
1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册/登录账户
3. 获取 API Key
4. 粘贴到 `.env` 文件

#### 4. 初始化数据库

```bash
cd backend
npm run init-db  # 创建 SQLite 数据库
```

#### 5. 启动应用

```bash
# 终端 1：启动后端（从 backend 目录）
npm run dev

# 终端 2：启动前端（从 frontend 目录）
npm run dev
```

#### 6. 访问应用

打开浏览器访问：**http://localhost:5173**

---

## 📖 项目结构

```
Echo2/
├── backend/                    # 后端应用
│   ├── src/
│   │   ├── index.ts           # Express 主入口
│   │   ├── database.ts        # SQLite 数据库操作
│   │   ├── deepseek.ts        # AI 集成
│   │   └── sql.js.d.ts        # TypeScript 类型定义
│   ├── uploads/               # 上传文件存储
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── main.tsx           # React 入口
│   │   ├── App.tsx            # 主应用组件
│   │   ├── api.ts             # API 客户端
│   │   ├── KnowledgeGraph.tsx # 知识图可视化
│   │   └── index.css          # 全局样式
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── SPEC.md                    # 项目规格文档
├── GIT_WORKFLOW.md            # Git 工作流指南
├── GITHUB_SETUP.md            # GitHub 设置指南
└── README.md                  # 本文件
```

---

## 📝 使用示例

### 创建笔记

```bash
# POST /api/notes
curl -X POST http://localhost:3001/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "content": "React 是一个用于构建用户界面的 JavaScript 库。",
    "tags": []
  }'
```

**响应示例**：
```json
{
  "id": "uuid-1234",
  "content": "React 是一个用于构建用户界面的 JavaScript 库。",
  "summary": "React 是 Facebook 开发的前端框架，用于快速构建动态用户界面。",
  "tags": ["前端", "JavaScript", "React"],
  "images": [],
  "created_at": "2026-04-27T10:30:00Z",
  "updated_at": "2026-04-27T10:30:00Z",
  "deleted_at": null
}
```

### 搜索笔记

```bash
# POST /api/notes/search (AI 智能搜索)
curl -X POST http://localhost:3001/api/notes/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "React 框架",
    "useAI": true
  }'
```

### 上传图像

```bash
# POST /api/upload
curl -X POST http://localhost:3001/api/upload \
  -F "image=@path/to/image.jpg"
```

---

## 📚 API 文档

### 认证相关

| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册新用户 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/auth/me` | 获取当前用户信息 |
| PUT | `/api/profile` | 更新个人资料 |

### 笔记相关

| 方法 | 路由 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/notes` | 创建笔记 | ✅ |
| GET | `/api/notes` | 获取笔记列表 | ✅ |
| GET | `/api/notes/:id` | 获取单个笔记 | ✅ |
| PUT | `/api/notes/:id` | 更新笔记 | ✅ |
| DELETE | `/api/notes/:id` | 删除笔记（软删除） | ✅ |
| POST | `/api/notes/search` | 搜索笔记 | ✅ |
| POST | `/api/notes/from-url` | 从 URL 创建笔记 | ✅ |
| POST | `/api/notes/:id/summarize` | 重新生成 AI 摘要 | ✅ |

### 知识图相关

| 方法 | 路由 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/relations` | 创建笔记关系 | ✅ |
| GET | `/api/relations` | 获取所有关系 | ✅ |
| PUT | `/api/relations/:id` | 更新关系权重 | ✅ |
| DELETE | `/api/relations/:id` | 删除关系 | ✅ |

详见 [SPEC.md](./SPEC.md) 获取完整 API 规格。

---

## 🔧 开发指南

### 启用自动格式化

项目配置了 EditorConfig 和 Prettier，VS Code 安装以下扩展可自动格式化代码：

```bash
# 推荐扩展
- EditorConfig for VS Code
- Prettier - Code formatter
- ESLint
```

### 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

**示例**：
```bash
git commit -m "feat(notes): add version history support

- Save all note edits to version_history table
- Add restore functionality

Closes #42"
```

**类型**：`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

详见 [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)。

### 开发工作流

```bash
# 1. 创建功能分支
git checkout -b feature/your-feature

# 2. 开发和测试
npm run dev

# 3. 提交更改
git add .
git commit -m "feat(scope): description"

# 4. 推送到 GitHub
git push -u origin feature/your-feature

# 5. 在 GitHub 创建 Pull Request
# 6. 审查通过后合并到 develop
```

详见 [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)。

---

## 📦 构建和部署

### 构建前端

```bash
cd frontend
npm run build
# 生成优化的生产版本到 dist/
```

### 构建后端

```bash
cd backend
npm run build
# 编译 TypeScript 到 dist/
```

### 生产部署

```bash
# 1. 编译前后端
npm run build  # 在两个目录下分别运行

# 2. 启动后端服务
cd backend
npm run start

# 3. 提供前端静态文件
# 将 frontend/dist 部署到 Nginx 或 CDN
```

---

## 🤝 贡献指南

欢迎提交 Bug 报告、功能建议和 Pull Request！

### 报告 Bug

使用 GitHub Issues，提供以下信息：
- 详细描述问题
- 复现步骤
- 期望行为 vs 实际行为
- 环境信息（OS、Node 版本等）

### 提交功能建议

在 GitHub Issues 中描述：
- 功能概述
- 使用场景
- 建议的实现方案（可选）

### 提交 Pull Request

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

**PR 检查清单**：
- [ ] 代码符合项目风格
- [ ] 已添加相关文档
- [ ] 测试通过
- [ ] 提交消息遵循规范

---

## 📚 文档

| 文档 | 说明 |
|------|------|
| [SPEC.md](./SPEC.md) | 项目规格和设计文档 |
| [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) | Git 工作流和提交规范 |
| [GITHUB_SETUP.md](./GITHUB_SETUP.md) | GitHub 配置和远程仓库设置 |

---

## 🐛 已知问题

- 大文件上传可能超时（计划增加进度条）
- SQLite 在高并发场景下性能有限（考虑迁移到 PostgreSQL）

---

## 🗺️ 开发路线图

### 第一阶段（进行中）
- [x] 基础项目结构
- [x] 笔记 CRUD 功能
- [x] AI 集成（摘要和分类）
- [x] 知识图可视化
- [ ] 用户认证系统

### 第二阶段（计划中）
- [ ] 笔记版本历史和恢复
- [ ] 导出功能（PDF、Markdown）
- [ ] 分层标签系统
- [ ] 高级搜索过滤
- [ ] 间隔式复习提醒

### 第三阶段（未来）
- [ ] 语音笔记转文字
- [ ] 协作编辑
- [ ] 离线模式
- [ ] 移动端应用
- [ ] 团队工作空间

---

## 📊 项目统计

```
Languages:
  TypeScript    65%
  TSX/JSX       25%
  CSS           8%
  Other         2%

Lines of Code: ~3,500+
Commits: 3+
Contributors: 1+
```

---

## 💬 讨论

- 📮 [GitHub Issues](https://github.com/hake971920/Echo2/issues) - Bug 报告和功能建议
- 💭 [GitHub Discussions](https://github.com/hake971920/Echo2/discussions) - 一般讨论和问题

---

## 📄 许可证

此项目采用 **MIT License** 许可证。详见 [LICENSE](./LICENSE) 文件。

---

## 👤 作者

**Echo2 开发团队**
- GitHub: [@hake971920](https://github.com/hake971920)

---

## 🙏 致谢

- [React](https://react.dev/) - UI 框架
- [Express](https://expressjs.com/) - Web 框架
- [Vite](https://vitejs.dev/) - 构建工具
- [TailwindCSS](https://tailwindcss.com/) - 样式框架
- [DeepSeek](https://www.deepseek.com/) - AI API

---

## 📞 支持

如有问题或需要帮助：

1. **查看文档** - 阅读 [SPEC.md](./SPEC.md) 和 [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)
2. **搜索 Issues** - 检查是否已有类似问题
3. **提交 Issue** - 描述问题并附加相关信息
4. **Discussion** - 在讨论区提问

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

[返回顶部](#echo2---ai-智能笔记本系统)

</div>
