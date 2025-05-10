# Claude Co-Author Guidelines

## Coding Rules

- Avoid using classes. Prefer pure functions whenever possible
- Implement Test-Driven Development (TDD)
- Write comments in English only, not in Japanese
- Place test files in the same directory as the implementation files: `{name}.spec.(ts|tsx)`
- Execute only one task per request
- Run `npm run for_agent` before committing and resolve any errors
- Always request human confirmation before completing a task
- Avoid using mocks in tests
- Avoid using `let` declarations whenever possible
- Never using try-catch blocks
- Never using `any` type
- Never ignore TypeScript type errors

## When making git commits, please follow these practices:

- Always add `Claude` as a Co-Author to your commits
- No summary is required after git commit
- Use semantic commit messages
- Prioritize Japanese conversation in chat only
- Do not use Japanese in files or commit messages

### How to add Claude as Co-Author

Add the following line to your commit message:

```
Co-authored-by: Claude <noreply@anthropic.com>
```

### Semantic Commit Message Format

Structure your commit messages following semantic conventions:

```
<type>(<scope>): <short summary>

Co-authored-by: Claude <claude@anthropic.com>
```

Where `<type>` is one of:
- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Changes that don't affect code functionality (formatting, etc.)
- refactor: Code change that neither fixes a bug nor adds a feature
- perf: Code change that improves performance
- test: Adding or modifying tests
- chore: Changes to the build process or auxiliary tools

Remember that no additional summary is needed after completing the commit.