# Changelog

All notable changes to Echo2 project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Note version history and restoration
- Export notes as PDF and Markdown
- Hierarchical tag system
- Advanced search with filters (date, tags, users)
- Spaced repetition review reminders

### In Progress
- User authentication system
- Note sharing and permissions

## [0.1.0] - 2026-04-27

### Added
- Initial project structure with frontend and backend separation
- Basic note management (Create, Read, Update, Delete)
- Image upload functionality
- AI-powered note summarization using DeepSeek API
- Automatic tag generation and classification
- Knowledge graph visualization
- Smart search with AI relevance ranking
- User authentication with JWT tokens
- Personal profile management
- Git configuration and workflow documentation

### Features
- React 18 + TypeScript frontend with Vite
- Node.js + Express backend with TypeScript
- SQLite database with better-sqlite3
- TailwindCSS for styling
- RESTful API design

### Documentation
- Comprehensive project specification (SPEC.md)
- Git workflow guide (GIT_WORKFLOW.md)
- GitHub setup guide (GITHUB_SETUP.md)
- Contributing guidelines (CONTRIBUTING.md)

---

## Version History

### What's Changed
- Created initial project repository structure
- Set up frontend with React and Vite
- Set up backend with Express and SQLite
- Integrated DeepSeek AI for content analysis
- Configured development environment and tooling

### Known Issues
- Large file uploads may timeout
- SQLite performance limitations under high concurrency
- Need to implement proper error handling in API

### Security
- Implemented JWT-based authentication
- Added password hashing with scrypt
- Need to add rate limiting
- Need to add request validation middleware

---

## Future Releases

### v0.2.0 (Planned Q2 2026)
- Note version history
- Export functionality
- Advanced search filters
- Review reminders system

### v0.3.0 (Planned Q3 2026)
- Voice note support
- Collaborative editing
- Offline mode
- Team workspaces

### v1.0.0 (Planned Q4 2026)
- Mobile application
- Advanced analytics
- API v2 with webhooks
- Enterprise features

---

**Last Updated**: 2026-04-27
