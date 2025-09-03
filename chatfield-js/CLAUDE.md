# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Primary Mission

**The TypeScript implementation MUST stay synchronized with the Python implementation.** This means:
- **Filenames**: Match Python's naming (e.g., `interview.py` → `interview.ts`, `test_builder.py` → `test_builder.ts`)
- **Class/Function Names**: Keep identical names (e.g., `Interview`, `Interviewer`, `FieldProxy`)
- **Method Names**: Preserve Python method names (e.g., `_name()`, `_pretty()`, `as_int`)
- **Code Logic**: Implement the same algorithms and flows as Python
- **Test Structure**: Mirror Python test files and test names
- **Only deviate when necessary** for language-specific requirements (e.g., TypeScript types, async/await patterns)

## Project Overview

Chatfield JS/TS is the TypeScript/JavaScript implementation of conversational data gathering powered by LLMs. Package name: `@chatfield/core` (v0.1.0). This implementation maintains feature parity with the Python version (chatfield-py).

## Project Structure

```
chatfield-js/
├── src/                 # TypeScript source code
│   ├── index.ts         # Main exports
│   ├── interview.ts     # Base Interview class with field discovery
│   ├── interviewer.ts   # LangGraph-based conversation orchestration  
│   ├── builder.ts       # Builder pattern API (primary interface)
│   ├── decorators.ts    # Decorator implementations
│   ├── field-proxy.ts   # FieldProxy string subclass for transformations
│   ├── types.ts         # Core type definitions
│   └── integrations/    # Framework integrations
│       ├── react.ts     # React hooks and components
│       ├── react-components.tsx # UI components  
│       └── copilotkit.tsx # CopilotKit integration
├── tests/               # Test suite (test_*.ts naming convention)
├── examples/            # Usage examples
├── dist/                # Compiled output (generated)
└── minimal.ts           # Minimal test script for OpenAI API
```

## Development Commands

```bash
# Build & Development
npm run build         # Compile TypeScript to dist/
npm run dev           # Watch mode compilation
npm run clean         # Remove dist/ directory

# Testing
npm test              # Run Jest test suite  
npm run test:watch    # Watch mode testing

# Code Quality  
npm run lint          # ESLint checks

# Running Examples
npm run min           # Run minimal.ts example (tests OpenAI API)
npx tsx examples/basic-usage.ts  # Run any example directly
```

## Architecture

### Core Concepts

1. **Interview Class**: Base class that defines fields to collect via methods
2. **Interviewer**: Orchestrates conversation flow using LangGraph and OpenAI
3. **Builder API**: Fluent interface for configuring gatherers (primary API)
4. **FieldProxy**: String subclass providing transformation access (e.g., `field.as_int`)
5. **Decorators**: Alternative API for field configuration

### Key Dependencies

- `@langchain/core`, `@langchain/langgraph`: Conversation orchestration
- `openai`: LLM provider integration
- `reflect-metadata`: Decorator support
- `uuid`: Thread ID generation

### Testing Configuration

- Jest with ts-jest preset for TypeScript support
- Test files use `test_*.ts` naming convention  
- Located in `tests/` directory
- Uses `tsconfig.test.json` for test compilation

### Build Configuration

- TypeScript compiles to `dist/` directory
- Target: ES2020, CommonJS modules
- Strict mode enabled with all checks
- Decorator support enabled
- React integrations excluded from main build

## Current Development Focus

Based on README.md short term plan:
1. Interrupt system to get user input (see minimal.ts readline implementation)
2. Tool calling functionality
3. Field decorators and transformations (alice/bob traits, casts)

When implementing new features, ALWAYS check the Python implementation first in `chatfield-py/` to ensure consistency in naming, structure, and behavior.

## API Key Configuration

Requires OpenAI API key:
```bash
export OPENAI_API_KEY=your-api-key
```
Or use `.env` file in parent directory.

## Testing Approach

- Unit tests for individual components
- Integration tests with mock LLM backends
- Test files follow `test_*.ts` naming pattern
- Run single test: `npm test -- test_interview.ts`

## Important Notes

- The project structure differs from the documentation - actual implementation is flat in `src/` not nested in `core/`
- Primary API is the builder pattern in `builder.ts`
- LangSmith trace URLs are generated for debugging (see minimal.ts:78)
- React/CopilotKit integrations are optional peer dependencies