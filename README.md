# Chatfield: Conversational Data Collection

Transform data collection from rigid forms into natural conversations powered by LLMs.

Chatfield provides implementations in both Python and TypeScript/JavaScript, allowing you to create conversational interfaces for gathering structured data in any application.

## Features

- **Natural Conversations**: Replace traditional forms with engaging dialogues
- **LLM-Powered Validation**: Smart validation and guidance through conversation
- **Type Safety**: Full type support in both Python and TypeScript
- **Framework Integration**: React components, CopilotKit support, and more
- **Flexible APIs**: Multiple API styles to suit different preferences

## Quick Start

### Python Implementation

```python
from chatfield import chatfield, Interviewer

# Build your interview using the fluent builder API
bug_report = (chatfield()
    .type("Bug Report")
    .desc("Collecting bug report details")
    
    .field("steps")
        .desc("Steps to reproduce")
    
    .field("expected")
        .desc("What should happen")
    
    .field("actual")
        .desc("What actually happens")
    
    .build())

# Conduct the interview
interviewer = Interviewer(bug_report)

user_input = None
while not bug_report._done:
    message = interviewer.go(user_input)
    print(message)
    user_input = input("Your input > ")

# Access collected data
print("Steps:", bug_report.steps)
print("Expected:", bug_report.expected)
print("Actual:", bug_report.actual)
```

### TypeScript/JavaScript Implementation

```typescript
import { chatfield } from '@chatfield/core'

const BugReport = chatfield()
  .field('steps', 'Steps to reproduce')
  .must('be detailed')
  .field('expected', 'What should happen')
  .field('actual', 'What actually happens')
  .build()

const result = await BugReport.gather()
console.log(result.steps, result.expected, result.actual)
```

## Project Structure

This repository contains two parallel implementations:

### `/chatfield` - Python Implementation
- Decorator-based API with LangGraph orchestration
- OpenAI integration with extensible LLM support
- Rich validation and transformation system
- Full async support and type hints

### `/chatfield-js` - TypeScript/JavaScript Implementation  
- NPM package `@chatfield/core`
- React hooks and components
- CopilotKit integration
- Multiple API styles (builder, decorator, schema)

## Installation

### Python
```bash
cd chatfield
pip install .
```

### TypeScript/JavaScript
```bash
cd chatfield-js
npm install
```

## Documentation

- [Python Documentation](./chatfield/README.md)
- [TypeScript/JavaScript Documentation](./chatfield-js/README.md)
- [Python Examples](./chatfield/examples/)
- [TypeScript Examples](./chatfield-js/examples/)

## Development

Both implementations share the same core concepts but are tailored to their respective ecosystems:

- **Python**: Uses decorators, LangGraph for orchestration, and async/await patterns
- **TypeScript**: Provides React integration, builder patterns, and full type safety

### Contributing

We welcome contributions to either implementation! Please see the individual project directories for specific development setup instructions.

### Testing

```bash
# Python tests
cd chatfield && python -m pytest

# JavaScript tests  
cd chatfield-js && npm test
```

## License

Apache License 2.0 - See [LICENSE](./LICENSE) for details.

## API Keys

Both implementations require an OpenAI API key:

```bash
export OPENAI_API_KEY=your-api-key
```

## Learn More

- **Python Details**: See [chatfield/CLAUDE.md](./chatfield/CLAUDE.md) for implementation details
- **TypeScript Details**: See [chatfield-js/CLAUDE.md](./chatfield-js/CLAUDE.md) for implementation details

## Status

Both implementations are in active development with feature parity as a goal. The Python implementation currently has more complete decorator support, while the TypeScript implementation offers better framework integrations.