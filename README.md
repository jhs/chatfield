# Chatfield: Conversational Data Collection

🎥 **Watch me develop this live!** Follow along as I build Chatfield in real-time: [YouTube Development Streams](https://www.youtube.com/@JasonSmithBuild/streams)

Transform data collection from rigid forms into natural conversations powered by LLMs.

Chatfield provides implementations in both Python and TypeScript/JavaScript, allowing you to create conversational interfaces for gathering structured data in any application.

## Features

- **Natural Conversations**: Replace traditional forms with engaging dialogues
- **LLM-Powered Validation**: Smart validation and guidance through conversation
- **Type Safety**: Full type support in both Python and TypeScript
- **Rich Transformations**: Convert responses into any data type with casts
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

## Type Transformations (Casts)

Transform conversational responses into any data type you need:

### Basic Transformations

```python
from chatfield import chatfield

project_estimate = (chatfield()
    .type("Project Estimate")
    .desc("Project estimation")
    
    .field("team_size")
        .desc("Number of developers")
        .as_int()  # Parse to integer
        .must("between 1 and 50")
    
    .field("confidence")
        .desc("Confidence in timeline")
        .as_percent()  # Parse to 0.0-1.0
    
    .field("technologies")
        .desc("Tech stack you'll use")
        .as_list()  # Parse to list
    
    .field("needs_design")
        .desc("Need design resources?")
        .as_bool()  # Parse to boolean
    
    .build())

# After collection:
project_estimate.team_size.as_int      # 5 (int)
project_estimate.confidence.as_percent # 0.75 (float)
project_estimate.technologies.as_list  # ["Python", "React", "PostgreSQL"]
project_estimate.needs_design.as_bool  # True (bool)
```

### Advanced Transformations

Casts can have multiple transformations with custom parameters:

```python
feature_request = (chatfield()
    .type("Feature Request")
    
    .field("affected_users")
        .desc("Number of users impacted")
        .as_int()  # Base integer cast
        .as_lang('fr')  # Translate to French
        .as_lang('es')  # Translate to Spanish
        .as_bool('even', 'True if even number')  # Custom boolean
        .as_bool('critical', 'True if > 100 users')  # Another boolean
        .as_str('uppercase', 'In all caps')  # String format
        .as_set('factors', 'Prime factors')  # Set operation
    
    .build())

# After collection, if user said "two hundred":
feature_request.affected_users                  # "200" (base string)
feature_request.affected_users.as_int           # 200
feature_request.affected_users.as_lang_fr       # "deux cents"
feature_request.affected_users.as_lang_es       # "doscientos"
feature_request.affected_users.as_bool_even     # True
feature_request.affected_users.as_bool_critical # True
feature_request.affected_users.as_str_uppercase # "TWO HUNDRED"
feature_request.affected_users.as_set_factors   # {2, 5}
```

### Choice Cardinality

Control how many options can be selected:

```python
task_assignment = (chatfield()
    .type("Task Assignment")
    
    .field("task_type")
        .desc("Type of task")
        .as_one('selection', 'bug', 'feature', 'enhancement')
    
    .field("priority")
        .desc("Priority level (if known)")
        .as_maybe('level', 'low', 'medium', 'high', 'critical')
    
    .field("components")
        .desc("Affected components")
        .as_multi('systems', 'frontend', 'backend', 'database')
    
    .field("reviewers")
        .desc("Optional reviewers")
        .as_any('people', 'Alice', 'Bob', 'Charlie', 'Diana')
    
    .build())

# After collection:
task_assignment.task_type.as_one_selection    # "bug"
task_assignment.priority.as_maybe_level       # "high" or None
task_assignment.components.as_multi_systems   # {"frontend", "backend"}
task_assignment.reviewers.as_any_people       # {"Alice", "Diana"} or set()
```

## Project Structure

This repository contains two parallel implementations:

### `/chatfield-py` - Python Implementation
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
cd chatfield-py
pip install .
```

### TypeScript/JavaScript
```bash
cd chatfield-js
npm install
```

## Documentation

- [Python Documentation](./chatfield-py/README.md) - Full API reference and advanced features
- [TypeScript/JavaScript Documentation](./chatfield-js/README.md) - React integration and builder patterns
- [Python Examples](./chatfield-py/examples/) - Working examples with all features
- [TypeScript Examples](./chatfield-js/examples/) - Framework integration examples

## Development

Both implementations share the same core concepts but are tailored to their respective ecosystems:

- **Python**: Uses decorators, LangGraph for orchestration, and async/await patterns
- **TypeScript**: Provides React integration, builder patterns, and full type safety

### Contributing

We welcome contributions to either implementation! Please see the individual project directories for specific development setup instructions.

### Testing

```bash
# Python tests
cd chatfield-py && python -m pytest

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

- **Python Details**: See [chatfield-py/CLAUDE.md](./chatfield-py/CLAUDE.md) for implementation details
- **TypeScript Details**: See [chatfield-js/CLAUDE.md](./chatfield-js/CLAUDE.md) for implementation details

## Status

Both implementations are in active development with feature parity as a goal. The Python implementation currently has more complete decorator support, while the TypeScript implementation offers better framework integrations.