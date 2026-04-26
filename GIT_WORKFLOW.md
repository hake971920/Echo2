# Echo2 Git 工作流指南

## 📋 项目已初始化

✅ **Git 配置完成**
- 初始仓库：`master` 分支
- 首次提交：配置文件和项目源代码
- 用户：Echo2 Developer (dev@echo2.local)

## 🔄 Git 工作流规范

### 分支策略（Git Flow）

```
main/master
    ↑
    ├── develop (开发主分支)
    │   ├── feature/* (功能分支)
    │   ├── bugfix/* (bug修复)
    │   └── hotfix/* (紧急修复)
```

### 分支命名规则

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| 功能分支 | `feature/<功能名>` | `feature/note-version-history` |
| Bug修复 | `bugfix/<问题描述>` | `bugfix/search-tag-filter` |
| 热修复 | `hotfix/<问题描述>` | `hotfix/database-connection-error` |
| 发布 | `release/<版本号>` | `release/1.0.0` |

### 创建功能分支

```bash
# 1. 确保在最新的 develop 分支
git checkout develop
git pull origin develop

# 2. 从 develop 创建功能分支
git checkout -b feature/note-version-history

# 3. 进行开发和提交
git add .
git commit -m "feat(notes): add version history support"

# 4. 推送到远程仓库
git push -u origin feature/note-version-history

# 5. 在 GitHub 上创建 Pull Request (PR)
# 6. 审核通过后合并到 develop
```

---

## 📝 提交消息规范

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型（Type）

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(notes): add version history` |
| `fix` | bug 修复 | `fix(search): fix tag filtering` |
| `docs` | 文档 | `docs(readme): update setup steps` |
| `style` | 代码风格 | `style(format): remove unused imports` |
| `refactor` | 代码重构 | `refactor(api): simplify search logic` |
| `perf` | 性能优化 | `perf(search): optimize query performance` |
| `test` | 测试 | `test(notes): add unit tests` |
| `chore` | 构建、依赖等 | `chore: update dependencies` |
| `ci` | CI/CD | `ci: add github actions workflow` |

### 作用域（Scope）

- `notes` - 笔记功能
- `search` - 搜索功能
- `tags` - 标签功能
- `api` - API 接口
- `db` - 数据库
- `ui` - 用户界面
- `auth` - 认证
- `export` - 导出功能
- `reminders` - 提醒功能

### 主题（Subject）

- 使用命令式语态："add" 而不是 "adds" 或 "added"
- 不要以大写字母开头
- 末尾不要加句号
- 限制在 50 字符以内

### 正文（Body）

- 解释"是什么"和"为什么"，而不是"怎么做"
- 每行 72 字符左右
- 分段说明复杂变化

### 页脚（Footer）

关联 issue 或 PR：
```
Closes #123
Fixes #456
Related to #789
```

### 完整示例

```
feat(notes): add version history and restoration

Save all note edits to version history table to allow users
to view and restore previous versions. Implement timeline UI
for easy navigation through versions.

Changes:
- Create note_versions database table
- Add saveNoteVersion() function to database layer
- Add version history panel to Note details page
- Add restore confirmation dialog

Closes #42
```

---

## 🔧 常用 Git 命令

### 查看状态和历史

```bash
# 查看当前分支和修改
git status

# 查看提交历史（单行格式）
git log --oneline

# 查看提交历史（图形化）
git log --oneline --graph --all

# 查看某次提交的详细信息
git show <commit-hash>

# 查看文件的修改历史
git log -p <file-path>
```

### 提交工作流

```bash
# 查看修改
git diff

# 暂存所有修改
git add .

# 暂存指定文件
git add <file-path>

# 提交
git commit -m "type(scope): subject"

# 修改最后一次提交（未推送到远程时）
git commit --amend

# 查看暂存区和工作区的差异
git diff --staged
```

### 分支管理

```bash
# 查看本地分支
git branch

# 查看所有分支（含远程）
git branch -a

# 创建新分支
git branch <branch-name>

# 切换分支
git checkout <branch-name>

# 创建并切换到新分支
git checkout -b <branch-name>

# 删除分支
git branch -d <branch-name>

# 重命名分支
git branch -m <old-name> <new-name>
```

### 远程仓库操作

```bash
# 查看远程仓库配置
git remote -v

# 添加远程仓库
git remote add origin <repository-url>

# 推送到远程
git push -u origin <branch-name>

# 拉取远程更新
git pull origin <branch-name>

# 获取远程更新（不合并）
git fetch origin
```

### 撤销修改

```bash
# 撤销工作区修改
git checkout <file-path>

# 撤销暂存
git reset HEAD <file-path>

# 撤销最后一次提交（保留修改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃修改）
git reset --hard HEAD~1

# 找回丢失的提交
git reflog
```

---

## 🚀 本地开发流程

### 1️⃣ **启动开发**

```bash
# 克隆或进入项目目录
cd d:\Development\Projects\Echo2

# 确认在正确分支
git status

# 创建功能分支
git checkout -b feature/my-feature
```

### 2️⃣ **开发中的提交**

```bash
# 每完成一个小功能就提交
git add .
git commit -m "feat(scope): description"

# 查看本地提交
git log --oneline -5
```

### 3️⃣ **推送到远程**

```bash
# 推送分支到远程（第一次）
git push -u origin feature/my-feature

# 后续推送
git push
```

### 4️⃣ **完成功能**

```bash
# 切回 develop 分支
git checkout develop

# 拉取最新更新
git pull origin develop

# 合并功能分支（本地）
git merge feature/my-feature

# 推送到远程
git push origin develop

# 删除功能分支
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

---

## 🔍 代码审查检查清单

在合并前，确保：

- [ ] 提交消息遵循规范
- [ ] 代码符合项目风格（EditorConfig + Prettier）
- [ ] 没有调试代码或 console.log
- [ ] 测试通过
- [ ] 文档已更新
- [ ] 没有合并冲突

---

## ⚠️ 常见问题处理

### 问题1：不小心提交了敏感信息

```bash
# 方案1：修改历史（仅在本地分支时）
git filter-branch --tree-filter 'rm -f <file>' HEAD

# 方案2：清除 cache 并重新提交
git rm --cached <file>
git add .
git commit --amend
```

### 问题2：合并冲突

```bash
# 查看冲突
git status

# 手动编辑冲突文件，然后
git add <resolved-file>
git commit -m "chore: resolve merge conflict"
```

### 问题3：撤销已推送的提交

```bash
# 方案1：使用 revert（推荐，保留历史）
git revert <commit-hash>
git push

# 方案2：强制重置（谨慎使用）
git reset --hard <previous-commit>
git push --force
```

---

## 📊 Git 配置总结

| 文件 | 用途 |
|------|------|
| `.gitignore` | 排除不需要版本控制的文件 |
| `.gitattributes` | 统一行尾符和文本/二进制标记 |
| `.editorconfig` | 统一编辑器设置 |
| `.prettierrc` | 代码格式化规则 |
| `.eslintignore` | ESLint 检查排除列表 |

## ✅ 当前状态

```
项目名称: Echo2
仓库位置: d:\Development\Projects\Echo2
分支: master
提交数: 2

历史：
* 4d16967 (HEAD -> master) feat: initial project structure with frontend and backend
* e197972 chore: add git and editor configuration files
```

---

## 🎯 后续步骤

1. **创建 develop 分支** - 为开发做准备
   ```bash
   git checkout -b develop
   git push -u origin develop
   ```

2. **配置 CI/CD**（可选）- GitHub Actions、GitLab CI 等

3. **设置 PR 模板**（可选）- 标准化 Pull Request 格式

4. **配置分支保护规则**（可选）- 要求代码审查、通过测试才能合并

