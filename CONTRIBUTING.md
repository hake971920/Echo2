# Contributing to Echo2

Thank you for your interest in contributing to Echo2! This document provides guidelines and instructions for contributing.

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and adhere to our Code of Conduct.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots if possible**
* **Include your environment (OS, Node version, etc.)**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and explain the expected behavior**
* **Explain why this enhancement would be useful**

### Pull Requests

* Follow the TypeScript / React styleguides
* Include appropriate test cases
* Update documentation as needed
* End all files with a newline

## Development Setup

### Prerequisites
- Node.js 18+
- Git

### Local Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/Echo2.git
cd Echo2

# 2. Create a development branch
git checkout -b feature/your-feature-name

# 3. Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env and add your DeepSeek API key

# 5. Start development servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

## Styleguides

### Git Commit Messages

* Use the present tense ("add feature" not "added feature")
* Use the imperative mood ("move cursor to..." not "moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* Follow [Conventional Commits](https://www.conventionalcommits.org/)

Format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Example:
```
feat(notes): add version history support

- Save all note edits to version_history table
- Add restore functionality with timeline UI

Closes #42
```

### TypeScript/JavaScript Styleguide

* Use 2 spaces for indentation
* Use semicolons
* Use single quotes for strings
* Use `const` by default, only use `let` if needed, never use `var`
* Prefer arrow functions

### React Styleguide

* Use functional components with hooks
* Keep components focused and single-responsibility
* Use meaningful component names
* Add JSDoc comments for complex components
* Keep component files under 300 lines if possible

## PR Review Process

1. **Code Review**: At least one maintainer must review the code
2. **Testing**: All tests must pass
3. **Documentation**: Update relevant documentation
4. **Merge**: PR will be merged after approval

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a release tag
4. Build and publish

## Questions?

Feel free to open an issue with the question tag or start a discussion.

Thank you for contributing to Echo2! 🎉
