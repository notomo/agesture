# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

agesture is a browser extension for mouse gestures built with:
- **WXT Framework**: Modern web extension framework with TypeScript support
- **React**: UI components with React 19 and shadow DOM isolation
- **Valibot**: Runtime schema validation and type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Vitest**: Testing framework
- **Biome**: Code formatting and linting

## Architecture

### Core Components

- **Background Script** (`src/entrypoints/background/`): Message handler for gesture actions
- **Content Script** (`src/entrypoints/content/`): Gesture detection, canvas rendering, and piemenu UI
- **Feature Modules** (`src/feature/`): Core business logic
  - `action.ts`: Action definitions and execution (bookmark, navigation, search, etc.)
  - `direction.ts`: Mouse gesture direction detection from point sequences
  - `message.ts`: Message routing between content and background scripts
  - `setting.ts`: Configuration management

### Message Flow

1. Content script detects gestures and renders UI
2. Messages sent to background script via `handleMessage()`
3. Background script executes actions using browser APIs
4. Results returned to content script for UI updates

### Action System

Actions are defined in `src/feature/action.ts` with:
- Schema validation using Valibot
- Type-safe execution with `ActionContext`
- Support for piemenu hierarchical actions
- Browser API integration (tabs, bookmarks, search, etc.)

## Development Commands

```bash
# Start development server
npm run dev

# Build extension
npm run build

# Format, lint, typecheck, and test (run before commits)
npm run check_all

# Individual commands
npm run format     # Format code with Biome
npm run check      # Lint with Biome
npm run typecheck  # TypeScript type checking
npm run test       # Run tests with Vitest
```

## Testing

- Test files are co-located with implementation: `{name}.spec.(ts|tsx)`
- Use Vitest for testing
- Avoid mocks when possible
- Test both individual functions and integration scenarios