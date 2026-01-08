# Contributing to PixelVault

Thank you for your interest in contributing to PixelVault! This document provides guidelines and instructions for contributing.

## Code Style

### TypeScript

- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable and function names
- Add type annotations where helpful

### React/Next.js

- Use functional components with hooks
- Add `'use client'` directive for client components
- Use Next.js App Router patterns
- Follow component structure: props, state, effects, handlers, render

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Constants: `UPPER_SNAKE_CASE.ts`

## Git Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Commit with descriptive messages
5. Push to your fork
6. Create a Pull Request

### Commit Messages

Use clear, descriptive commit messages:

```
feat: Add image upload functionality
fix: Resolve database connection timeout
docs: Update API documentation
refactor: Improve error handling
```

## Development Setup

```bash
# Clone repository
git clone https://github.com/your-username/pixelvault.git
cd pixelvault

# Install dependencies
npm run setup

# Create .env.local file
cp .env.example .env.local
# Edit .env.local with your database credentials

# Run development server
npm run dev
```

## Testing

Before submitting a PR:

- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] Tested in development environment
- [ ] Follows existing code style
- [ ] Added/updated documentation if needed

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Request review from maintainers
4. Address review feedback
5. Wait for approval before merging

## Code Review Guidelines

- Be respectful and constructive
- Focus on code quality and functionality
- Ask questions if something is unclear
- Suggest improvements when appropriate

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase
- Documentation improvements

Thank you for contributing! 🎉
