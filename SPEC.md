# Echo2 智能笔记本系统规格文档

## 1. 项目概述

**项目名称**: Echo2 - AI 智能笔记本
**项目类型**: 前后端分离的 Web 应用
**核心功能**: 支持文本/图像上传，AI 自动总结分类，智能搜索
**目标用户**: 需要整理学习资料、研究笔记的用户

## 2. 技术栈

### 前端
- React 18 + TypeScript
- Vite (构建工具)
- TailwindCSS (样式)
- Axios (HTTP 请求)

### 后端
- Node.js + Express + TypeScript
- SQLite + better-sqlite3
- multer (文件上传)

### AI 集成
- DeepSeek API (chat/completions)

## 3. 功能规格

### 3.1 笔记管理
- **创建笔记**: 文本输入 + 图像上传
- **编辑笔记**: 支持修改文本内容和标签
- **删除笔记**: 软删除，可恢复
- **分类标签**: 自动生成或手动添加

### 3.2 AI 整合
- **自动总结**: 上传内容后调用 AI 生成摘要和关键词
- **自动分类**: AI 根据内容推荐标签
- **智能问答**: 搜索时 AI 相关性排序

### 3.3 搜索功能
- **关键词搜索**: 全文检索
- **AI 智能搜索**: 自然语言查询，AI 匹配相关内容

### 3.4 数据模型

```
Note {
  id: string (UUID)
  content: string (原始内容)
  summary: string (AI 生成摘要)
  tags: string[] (标签)
  images: string[] (图片路径数组)
  created_at: datetime
  updated_at: datetime
  deleted_at: datetime | null
}
```

## 4. API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/notes | 创建笔记 |
| GET | /api/notes | 获取笔记列表 |
| GET | /api/notes/:id | 获取单个笔记 |
| PUT | /api/notes/:id | 更新笔记 |
| DELETE | /api/notes/:id | 删除笔记 |
| POST | /api/notes/:id/summarize | AI 总结 |
| POST | /api/notes/search | AI 智能搜索 |
| POST | /api/upload | 上传图片 |

## 5. 验收标准

1. 用户可以创建包含文本和图像的笔记
2. 创建笔记后 AI 自动生成摘要和标签
3. 用户可以搜索笔记，AI 返回相关内容
4. 所有数据保存在 SQLite 中
5. 项目可正常运行，无报错