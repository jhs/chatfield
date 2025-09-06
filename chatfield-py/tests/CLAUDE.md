# CLAUDE.md

This file provides guidance to Claude Code when working with the Python test suite in this directory.

## Overview

This directory contains the comprehensive test suite for the Chatfield Python library, covering unit tests, integration tests, and conversation flow tests. The tests validate decorator functionality, field discovery, interview orchestration, and transformation capabilities.

## Project Structure

```
chatfield-py/tests/
├── __init__.py                      # Test package initialization
├── test_interview.py                # Core Interview class tests
├── test_interviewer.py              # Interviewer orchestration tests
├── test_interviewer_conversation.py # Conversation flow and state tests
├── test_builder.py                  # Builder API and chaining tests
├── test_field_proxy.py              # FieldProxy string subclass tests
├── test_custom_transformations.py   # Transformation decorator tests
├── test_conversations.py            # Full conversation integration tests
└── CLAUDE.md                        # This documentation file
```

## Key Files

### test_interview.py
- **Purpose**: Tests the core Interview class functionality
- **Coverage**: Field discovery, property access, state management
- **Key Classes**: `TestInterviewBasics`, `TestFieldDiscovery`, `TestInterviewState`
- **Focus**: Base class behavior without LLM interaction

### test_interviewer.py
- **Purpose**: Tests the Interviewer class that orchestrates conversations
- **Coverage**: LangGraph integration, tool binding, state transitions
- **Key Classes**: `TestInterviewerBasics`, `TestInterviewerTools`
- **Mock Strategy**: Uses mock LLM backends for fast, deterministic tests

### test_interviewer_conversation.py
- **Purpose**: Tests conversation flow and message handling
- **Coverage**: State management, field collection, validation flow
- **Key Classes**: `TestConversationFlow`, `TestValidation`
- **Focus**: Multi-turn conversation dynamics

### test_builder.py
- **Purpose**: Tests the fluent builder API
- **Coverage**: Method chaining, field configuration, decorator application
- **Key Classes**: `TestBuilderAPI`, `TestFieldConfiguration`
- **Validation**: Ensures builder creates correct Interview instances

### test_field_proxy.py
- **Purpose**: Tests the FieldProxy string subclass
- **Coverage**: String behavior, transformation properties, attribute access
- **Key Classes**: `TestFieldProxy`, `TestTransformations`
- **Special**: Tests dynamic property generation (`.as_int`, `.as_lang_fr`, etc.)

### test_custom_transformations.py
- **Purpose**: Tests transformation decorators
- **Coverage**: `@as_int`, `@as_float`, `@as_bool`, `@as_lang.*`, cardinality
- **Key Classes**: `TestTransformationDecorators`, `TestCardinality`
- **Validation**: Ensures transformations are properly registered

### test_conversations.py
- **Purpose**: Integration tests with real conversation scenarios
- **Coverage**: End-to-end conversation flows, complex validations
- **Key Classes**: `TestFullConversations`, `TestEdgeCases`
- **Note**: May use `@pytest.mark.requires_api_key` for live API tests

## Development Commands

### Running Tests

```bash
# Run all tests
python -m pytest

# Run specific test file
python -m pytest tests/test_interview.py

# Run specific test class
python -m pytest tests/test_interview.py::TestInterviewBasics

# Run specific test method
python -m pytest tests/test_interview.py::TestInterviewBasics::test_field_access_before_collection

# Run tests matching pattern
python -m pytest -k "test_field"

# Run with verbose output
python -m pytest -v

# Run with coverage report
python -m pytest --cov=chatfield --cov-report=html

# Run excluding slow/API tests
python -m pytest -m "not slow and not requires_api_key"
```

### Test Markers

```bash
# Skip tests requiring API key
python -m pytest -m "not requires_api_key"

# Run only fast unit tests
python -m pytest -m "not slow"

# Run integration tests only
python -m pytest -m "integration"
```

## Architecture Notes

### Test Organization

1. **Unit Tests**: Test individual components in isolation
   - Use mocks for external dependencies
   - Focus on single responsibility
   - Fast execution (< 1 second per test)

2. **Integration Tests**: Test component interactions
   - May use real LangGraph but mock LLM
   - Test state transitions and data flow
   - Medium execution time

3. **End-to-End Tests**: Test complete workflows
   - May use real OpenAI API (marked appropriately)
   - Test full conversation flows
   - Slower execution, optional in CI

### Mocking Strategy

```python
# Common mock patterns used:

# 1. Mock LLM Backend
class MockLLM:
    def invoke(self, messages):
        return AIMessage(content="mocked response")

# 2. Mock Interviewer with predetermined responses
mock_responses = {
    'field_name': 'predetermined value'
}

# 3. Patch decorators for testing
@patch('chatfield.decorators.must')
def test_validation(mock_must):
    # Test validation logic
```

### State Management Testing

- Tests verify proper state initialization
- Validate state transitions during collection
- Ensure field values are properly stored
- Check completion detection logic

## Testing Approach

### Test Structure

Each test follows the Arrange-Act-Assert pattern:

```python
def test_example():
    # Arrange - Set up test data and mocks
    interview = create_test_interview()
    
    # Act - Perform the operation
    result = interview.some_method()
    
    # Assert - Verify the outcome
    assert result == expected_value
```

### Coverage Goals

- Unit test coverage > 80%
- Integration test coverage for all major workflows
- Edge cases and error conditions tested
- Performance regression tests for critical paths

### Mock vs Real Testing

1. **Always Mock**: External API calls, file I/O, network requests
2. **Sometimes Mock**: LangGraph components (for speed)
3. **Never Mock**: Core business logic, decorators, field discovery

## Important Patterns

### Fixture Usage

```python
@pytest.fixture
def basic_interview():
    """Standard interview fixture for testing."""
    return (chatfield()
        .type("TestInterview")
        .field("name").desc("Your name")
        .build())
```

### Parameterized Tests

```python
@pytest.mark.parametrize("input,expected", [
    ("42", 42),
    ("3.14", 3),
    ("-10", -10),
])
def test_as_int_transformation(input, expected):
    # Test transformation with multiple inputs
```

### Async Test Support

```python
@pytest.mark.asyncio
async def test_async_interview():
    # Test async interview operations
    result = await interviewer.arun()
```

## Known Considerations

1. **Test Isolation**: Each test should be independent and not affect others
2. **Mock Cleanup**: Ensure mocks are properly reset between tests
3. **API Key Tests**: Tests requiring real API keys are marked and skippable
4. **Performance**: Keep unit tests fast (< 10 seconds for entire suite)
5. **Determinism**: Tests should produce same results on every run
6. **Python Path**: Tests may need to add parent directory to sys.path
7. **State Leakage**: Be careful with class-level attributes in Interview
8. **LangGraph State**: Test state reducers and merging logic carefully

## Adding New Tests

When creating new tests:

1. Place in appropriate test file based on component being tested
2. Follow existing naming conventions (`test_*.py`, `Test*` classes)
3. Use descriptive test method names that explain what's being tested
4. Include docstrings for complex test scenarios
5. Add appropriate markers (`@pytest.mark.slow`, `@pytest.mark.requires_api_key`)
6. Use fixtures for common setup
7. Mock external dependencies
8. Test both success and failure cases
9. Update this CLAUDE.md file if adding new test files

## Common Issues and Solutions

- **ImportError**: Ensure chatfield package is installed: `pip install -e ..`
- **Missing API Key**: Set OPENAI_API_KEY or mark test with `@pytest.mark.requires_api_key`
- **Flaky Tests**: Use mocks instead of real API calls for determinism
- **Slow Tests**: Mark with `@pytest.mark.slow` and optimize or mock
- **State Pollution**: Use fixtures and proper test isolation

## Test Data

Common test data patterns:

```python
# Standard test interview
TEST_FIELDS = {
    'name': 'Your full name',
    'email': 'Your email address',
    'age': 'Your age'
}

# Mock responses for testing
MOCK_RESPONSES = {
    'name': 'John Doe',
    'email': 'john@example.com',
    'age': '30'
}

# Validation test cases
VALIDATION_CASES = [
    ('valid@email.com', True),
    ('invalid-email', False)
]
```