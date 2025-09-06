# CLAUDE.md

This file provides guidance to Claude Code when working with the TypeScript/JavaScript test suite in this directory.

## Overview

This directory contains the comprehensive test suite for the Chatfield TypeScript/JavaScript library, mirroring the Python implementation's test structure for feature parity. Tests cover the builder API, Interview class, Interviewer orchestration, transformations, and conversation flows using Jest as the testing framework.

## Project Structure

```
chatfield-js/tests/
├── interview.test.ts                # Core Interview class tests
├── interviewer.test.ts              # Interviewer orchestration tests  
├── interviewer_conversation.test.ts # Conversation flow and state tests
├── builder.test.ts                  # Builder API and method chaining tests
├── custom_transformations.test.ts   # Transformation system tests
├── conversations.test.ts            # Full conversation integration tests
├── integration/
│   └── react.ts                     # React hooks integration tests
└── CLAUDE.md                        # This documentation file
```

## Key Files

### interview.test.ts
- **Purpose**: Tests the core Interview class functionality
- **Coverage**: Field access, state management, completion detection
- **Test Suites**: `TestInterviewBasics`, `TestFieldAccess`, `TestDoneProperty`
- **Focus**: Interview instance behavior without LLM interaction

### interviewer.test.ts
- **Purpose**: Tests the Interviewer class orchestration
- **Coverage**: Initialization, LLM binding, tool configuration
- **Mock Strategy**: Uses `MockLLMBackend` for deterministic testing
- **Key Tests**: State transitions, field collection, validation flow

### interviewer_conversation.test.ts
- **Purpose**: Tests multi-turn conversation dynamics
- **Coverage**: Message handling, state management, field progression
- **Test Suites**: `TestConversationFlow`, `TestFieldProgression`
- **Focus**: Conversation state machine and transitions

### builder.test.ts
- **Purpose**: Tests the fluent builder API
- **Coverage**: Method chaining, field configuration, validation rules
- **Test Suites**: `TestBuilderChaining`, `TestFieldConfiguration`
- **Validation**: Ensures builder creates correct Interview instances

### custom_transformations.test.ts
- **Purpose**: Tests transformation system
- **Coverage**: Type transformations, language transformations, cardinality
- **Key Tests**: `.asInt()`, `.asFloat()`, `.asBool()`, `.asLang()`
- **Focus**: Transformation registration and application

### conversations.test.ts
- **Purpose**: Integration tests with complete conversation flows
- **Coverage**: End-to-end scenarios, complex validations
- **Test Suites**: `TestFullConversations`, `TestEdgeCases`
- **Note**: May include tests with real API calls (properly marked)

### integration/react.ts
- **Purpose**: Tests React hooks and components
- **Coverage**: `useConversation` hook, state management, UI updates
- **Requirements**: React Testing Library, DOM environment
- **Focus**: React integration and component behavior

## Development Commands

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test interview.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="field validation"

# Run with coverage
npm test -- --coverage

# Run integration tests only
npm test -- integration/

# Debug tests
node --inspect-brk node_modules/.bin/jest --runInBand

# Run tests with verbose output
npm test -- --verbose
```

### Jest Configuration

The test suite uses Jest with the following configuration:

```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "testMatch": ["**/*.test.ts"],
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts"
  ]
}
```

## Architecture Notes

### Test Organization

1. **Unit Tests**: Test individual components
   - Mock all external dependencies
   - Fast execution (< 100ms per test)
   - Focus on single responsibility

2. **Integration Tests**: Test component interactions
   - May use real Interview/Interviewer instances
   - Mock only external services (LLM APIs)
   - Medium execution time

3. **End-to-End Tests**: Complete workflow tests
   - Full conversation flows
   - May use real API (marked appropriately)
   - Slower execution

### Mocking Strategy

```typescript
// Mock LLM Backend
class MockLLMBackend {
  temperature = 0.0
  modelName = 'openai:gpt-4o'
  
  async invoke(messages: any[]) {
    return { content: 'Mock response' }
  }
  
  bind_tools(tools: any[]) {
    this.tools = tools
    return this
  }
}

// Mock module imports
jest.mock('../src/interviewer', () => {
  const actual = jest.requireActual('../src/interviewer')
  return {
    ...actual,
    init_chat_model: jest.fn(() => new MockLLMBackend())
  }
})

// Mock responses for testing
const mockResponses = {
  name: 'John Doe',
  email: 'john@example.com'
}
```

### Test Patterns

```typescript
// Standard test structure
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  })
  
  afterEach(() => {
    // Cleanup
  })
  
  test('should do something', () => {
    // Arrange
    const interview = createTestInterview()
    
    // Act
    const result = interview.someMethod()
    
    // Assert
    expect(result).toBe(expected)
  })
})
```

## Testing Approach

### Test Coverage Requirements

- Line coverage: > 80%
- Branch coverage: > 75%
- Function coverage: > 80%
- Statement coverage: > 80%

### Test Categories

1. **Smoke Tests**: Basic functionality
   ```typescript
   test('should create interview instance', () => {
     const interview = chatfield().build()
     expect(interview).toBeDefined()
   })
   ```

2. **Validation Tests**: Field validation logic
   ```typescript
   test('should validate required fields', () => {
     const interview = chatfield()
       .field('name').must('not be empty')
       .build()
     // Test validation
   })
   ```

3. **State Tests**: State management
   ```typescript
   test('should track completion state', () => {
     expect(interview._done).toBe(false)
     // Set fields
     expect(interview._done).toBe(true)
   })
   ```

### Async Testing

```typescript
// Async test pattern
test('should handle async operations', async () => {
  const interviewer = new Interviewer(interview)
  const result = await interviewer.run()
  expect(result).toBeDefined()
})

// With error handling
test('should handle errors', async () => {
  await expect(interviewer.run()).rejects.toThrow('Expected error')
})
```

## Important Patterns

### Test Fixtures

```typescript
// Common test data
const createTestInterview = () => {
  return chatfield()
    .type('TestInterview')
    .field('name').desc('Your name')
    .field('email').desc('Your email')
    .build()
}

// Mock data
const TEST_RESPONSES = {
  name: 'Test User',
  email: 'test@example.com'
}
```

### Snapshot Testing

```typescript
test('should match snapshot', () => {
  const interview = createTestInterview()
  expect(interview._chatfield).toMatchSnapshot()
})
```

### Testing React Hooks

```typescript
import { renderHook, act } from '@testing-library/react-hooks'

test('useConversation hook', () => {
  const { result } = renderHook(() => 
    useConversation(gatherer)
  )
  
  act(() => {
    result.current[1].sendMessage('Hello')
  })
  
  expect(result.current[0].messages).toHaveLength(1)
})
```

## Known Considerations

1. **Test Isolation**: Each test must be independent
2. **Mock Cleanup**: Jest automatically clears mocks between tests
3. **TypeScript Types**: Ensure proper typing for mocks
4. **Async Handling**: Use async/await properly in tests
5. **Timer Mocks**: Use `jest.useFakeTimers()` for time-dependent tests
6. **Module Mocks**: Place in `__mocks__` directory or use `jest.mock()`
7. **Coverage Gaps**: Focus on critical paths first
8. **Flaky Tests**: Use deterministic mocks instead of real APIs

## Adding New Tests

When creating new tests:

1. Follow naming convention (`*.test.ts`)
2. Place in appropriate file based on component
3. Use descriptive test names
4. Group related tests in `describe` blocks
5. Add setup/teardown in `beforeEach`/`afterEach`
6. Mock external dependencies
7. Test both success and failure cases
8. Add comments for complex test logic
9. Update this CLAUDE.md file if adding new test files

## Common Issues and Solutions

- **Module not found**: Ensure correct import paths and build
- **Type errors**: Check TypeScript configuration and types
- **Async timeout**: Increase timeout with `jest.setTimeout(10000)`
- **Mock not working**: Verify mock is before import
- **Coverage gaps**: Add tests for uncovered branches
- **Snapshot failures**: Update with `npm test -- -u`

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Run tests
  run: |
    npm install
    npm run build
    npm test -- --coverage --ci
```

## Performance Testing

For performance-sensitive code:

```typescript
test('should complete within time limit', () => {
  const start = performance.now()
  // Operation to test
  const end = performance.now()
  expect(end - start).toBeLessThan(100) // ms
})
```

## Debugging Tests

```bash
# Debug with VS Code
# Add breakpoint and use "Debug Jest Tests" launch config

# Debug with Chrome DevTools
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug specific test
npm test -- --runInBand interview.test.ts
```