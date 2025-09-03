# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chatfield is a dual-implementation project that transforms data collection from rigid forms into natural conversations powered by LLMs. It provides both Python and TypeScript/JavaScript implementations with feature parity as a goal.

## Project Structure

```
Chatfield/
├── chatfield/           # Python implementation (v0.2.0)
│   ├── chatfield/       # Core Python package
│   ├── examples/        # Python usage examples
│   └── tests/           # Python test suite
└── chatfield-js/        # TypeScript/JavaScript implementation (v0.1.0)
    ├── src/             # TypeScript source code
    ├── examples/        # JavaScript/TypeScript examples
    └── tests/           # JavaScript test suite
```

## Development Commands

### Python Implementation (chatfield/)

```bash
# Testing
cd chatfield && python -m pytest                    # Run all tests
python -m pytest tests/test_interview.py            # Run specific test file
python -m pytest -k "test_name"                     # Run specific test
python -m pytest -m "not slow"                      # Skip slow tests

# Code Quality
black chatfield tests                               # Format code
isort chatfield tests                               # Sort imports
flake8 chatfield tests                              # Lint code
mypy chatfield                                      # Type checking

# Build & Install
pip install -e .                                     # Development install
pip install -e ".[dev]"                             # Install with dev dependencies
python -m build                                     # Build distribution
```

### TypeScript/JavaScript Implementation (chatfield-js/)

```bash
# Development
cd chatfield-js && npm install                      # Install dependencies
npm run build                                        # Compile TypeScript to dist/
npm run dev                                          # Watch mode compilation
npm run clean                                        # Clean dist/ directory

# Testing
npm test                                             # Run Jest test suite
npm run test:watch                                   # Watch mode testing

# Code Quality
npm run lint                                        # ESLint checks

# Running Examples
npm run min                                          # Run minimal.ts example
npx tsx examples/basic-usage.ts                     # Run any example directly
```

## Architecture Overview

### Core Concepts (Both Implementations)

1. **Interview/Gatherer**: Main class that defines fields to collect
2. **Field Definitions**: Methods/properties that define what data to gather
3. **Decorators/Builders**: API for configuring validation and transformations
4. **Interviewer**: Orchestrates the conversation flow using LLMs
5. **LLM Backend**: Handles communication with AI models (OpenAI)

### Python Implementation Details

- **Decorator-based API**: Primary interface using `@alice`, `@bob`, `@must`, `@reject`, `@hint`, `@as_int`, etc.
- **LangGraph Orchestration**: Uses LangGraph for conversation state management
- **FieldProxy**: String subclass providing transformation access (e.g., `field.as_int`)
- **Dependencies**: langchain, langgraph, openai, pydantic
- **State Management**: Custom reducers for merging Interview states

### TypeScript Implementation Details

- **Builder API**: Primary interface using fluent chainable methods
- **Multiple API Styles**: Builder, decorator, and schema-based approaches
- **React Integration**: Hooks and components for UI integration
- **CopilotKit Support**: Sidebar component for conversational interfaces
- **Dependencies**: @langchain/core, openai, reflect-metadata, zod

## Key Files to Understand

### Python
- `chatfield/interview.py`: Base Interview class with field discovery
- `chatfield/interviewer.py`: LangGraph-based conversation orchestration
- `chatfield/decorators.py`: All decorator implementations
- `chatfield/field_proxy.py`: FieldProxy string subclass for transformations

### TypeScript
- `chatfield-js/src/core/types.ts`: Core type definitions
- `chatfield-js/src/builders/gatherer-builder.ts`: Main builder API
- `chatfield-js/src/backends/llm-backend.ts`: LLM provider abstraction
- `chatfield-js/src/integrations/react.ts`: React hooks and components

## Testing Approach

### Python Tests
- Unit tests for individual components (decorators, field discovery)
- Integration tests with mock LLM backends
- Live API tests marked with `@pytest.mark.requires_api_key`
- Test files: `test_interview.py`, `test_interviewer.py`, `test_builder.py`, etc.

### JavaScript Tests
- Jest test suite with TypeScript support
- Mock LLM backend for fast testing
- Integration tests in `tests/integration/`
- Test files follow `*.test.ts` naming convention

## API Key Configuration

Both implementations require OpenAI API key:
```bash
export OPENAI_API_KEY=your-api-key
```

## Common Development Tasks

### Adding a New Decorator (Python)
1. Add decorator class to `chatfield/decorators.py`
2. Update field discovery in `interview.py` if needed
3. Add transformation handling in `interviewer.py`
4. Write tests in `tests/test_decorators.py`

### Adding a New Builder Method (TypeScript)
1. Add method to `GathererBuilder` in `src/builders/gatherer-builder.ts`
2. Update type definitions in `src/core/types.ts`
3. Handle in LLM backend implementation
4. Add tests to `tests/test_builder.test.ts`

### Running Examples
- Python: `cd chatfield/examples && python bug_report.py`
- TypeScript: `cd chatfield-js && npx tsx examples/basic-usage.ts`

## Important Patterns

### Field Value Access (Python)
```python
# After collection:
interview.field_name          # Base string value
interview.field_name.as_int   # Integer transformation
interview.field_name.as_lang_fr # French translation
```

### Builder Pattern (TypeScript)
```typescript
const Form = chatfield()
  .field('name', 'Your name')
  .must('include first and last')
  .field('email', 'Email address')
  .build()
```

## Validation and Transformation

Both implementations use LLM-powered validation rather than code-based rules:
- `@must` / `.must()`: Requirements the response must meet
- `@reject` / `.reject()`: Patterns to avoid in responses
- `@hint` / `.hint()`: Guidance for the user
- Transformations (`as_int`, `as_bool`, etc.) are computed by the LLM during collection

## Known Considerations

- Python implementation uses LangGraph for orchestration (more complex but powerful)
- TypeScript implementation focuses on React/UI integration
- Both require careful prompt engineering for validation
- API rate limits should be considered for production use
- Thread safety handled via separate Interviewer instances
- Always use `python` to run Python commands, not python3, etc. because the .venv is always active and is used via python, pip, etc.
- We do not run any test suite stuff right now because it is broken for unrelated reasons