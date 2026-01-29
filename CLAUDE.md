# CLAUDE.md

This file provides guidance for AI assistants (like Claude) working with this repository.

## Project Overview

**Repository**: Test
**Type**: Development/Test Repository
**Status**: Initial setup phase

This repository is currently in its early stages. As the project evolves, this documentation should be updated to reflect the current state.

## Repository Structure

```
/
├── README.md          # Project readme
├── CLAUDE.md          # AI assistant guidance (this file)
└── (project files)    # To be added
```

## Development Guidelines

### Git Workflow

- **Branch Naming**: Use descriptive branch names with prefixes:
  - `feature/` - New features
  - `fix/` - Bug fixes
  - `docs/` - Documentation changes
  - `refactor/` - Code refactoring
  - `claude/` - AI-assisted changes

- **Commit Messages**: Follow conventional commit format:
  - `feat: add new feature`
  - `fix: resolve bug in X`
  - `docs: update documentation`
  - `refactor: restructure module Y`
  - `test: add tests for Z`
  - `chore: maintenance task`

- **Pull Requests**: Create PRs for all changes, include clear descriptions

### Code Standards

When code is added to this repository, follow these principles:

1. **Readability**: Write clear, self-documenting code
2. **Simplicity**: Prefer simple solutions over complex ones
3. **Consistency**: Follow existing patterns in the codebase
4. **Testing**: Include tests for new functionality
5. **Documentation**: Document public APIs and complex logic

### File Organization

- Keep related files grouped together
- Use meaningful file and directory names
- Avoid deeply nested directory structures
- Place configuration files in the project root

## Commands Reference

> **Note**: Update this section as build tools and scripts are added.

### Common Tasks

| Task | Command |
|------|---------|
| Install dependencies | `(to be configured)` |
| Run tests | `(to be configured)` |
| Build project | `(to be configured)` |
| Lint code | `(to be configured)` |
| Format code | `(to be configured)` |

## AI Assistant Guidelines

### When Working on This Repository

1. **Explore First**: Always understand the existing code before making changes
2. **Minimal Changes**: Make targeted changes; avoid unnecessary modifications
3. **Test Impact**: Consider how changes affect existing functionality
4. **Security**: Never commit secrets, credentials, or sensitive data
5. **Documentation**: Update relevant documentation when making changes

### Do's

- Read existing code and understand context before editing
- Follow established patterns and conventions
- Write clear, descriptive commit messages
- Create focused, single-purpose commits
- Test changes when testing infrastructure exists

### Don'ts

- Don't overwrite files without reading them first
- Don't add unnecessary dependencies
- Don't make changes outside the scope of the task
- Don't commit generated files unless necessary
- Don't ignore linting or type errors

### Handling Common Scenarios

**Adding New Features**:
1. Understand where the feature fits in the architecture
2. Check for existing similar patterns
3. Implement following existing conventions
4. Add appropriate tests
5. Update documentation if needed

**Fixing Bugs**:
1. Reproduce and understand the issue
2. Identify the root cause
3. Make minimal targeted fixes
4. Verify the fix doesn't introduce regressions

**Refactoring**:
1. Ensure tests exist for affected code
2. Make incremental changes
3. Verify functionality after each change
4. Keep commits atomic and reversible

## Project-Specific Notes

> Add project-specific information here as the repository develops.

### Architecture Decisions

- (Document key architectural decisions as they are made)

### Known Issues

- (Track known issues or technical debt here)

### Future Considerations

- (Note planned features or improvements)

---

*Last updated: 2026-01-29*
