# Test Harmonization Guide

This document maps the test structure between Python and TypeScript implementations to achieve identical nomenclature and organization.

## File Mapping

| Python File | TypeScript File | Status |
|------------|-----------------|--------|
| test_builder.py | builder.test.ts | ✅ HARMONIZED |
| test_interview.py | interview.test.ts | ✅ HARMONIZED |
| test_field_proxy.py | field_proxy.test.ts | ✅ HARMONIZED |
| test_interviewer.py | interviewer.test.ts | ✅ HARMONIZED |
| test_custom_transformations.py | custom_transformations.test.ts | ✅ HARMONIZED |
| test_interviewer_conversation.py | interviewer_conversation.test.ts | ✅ HARMONIZED |
| test_conversations.py | conversations.test.ts | ✅ HARMONIZED |
| ❌ N/A | integration/react.test.tsx | ⚠️ TS-specific |

## Common Nomenclature Structure

All tests will follow this hierarchy:
```
describe('ComponentName')
  describe('feature or method group')
    it('specific behavior description')
```

## Test Structure Mapping

### builder tests

**Current Python (class-based):**
```python
class TestBasicBuilder:
    def test_simple_interview(self):
    def test_field_validation_rules(self):
    def test_multiple_validation_rules(self):
```

**Current TypeScript (describe-based):**
```typescript
describe('TestBasicBuilder', () => {
  test('test_simple_interview', () => {
  test('test_field_validation_rules', () => {
  test('test_multiple_validation_rules', () => {
```

**Harmonized Structure:**
```
describe('Builder')
  describe('basic usage')
    it('creates simple interview')
    it('adds field validation rules')
    it('supports multiple validation rules')
  describe('field configuration')
    it('sets field descriptions')
    it('chains must requirements')
    it('chains reject patterns')
  describe('transformations')
    it('applies integer transformation')
    it('applies float transformation')
    it('applies language transformation')
```

### interview tests

**Harmonized Structure:**
```
describe('Interview')
  describe('field discovery')
    it('discovers fields from methods')
    it('ignores private methods')
    it('preserves method docstrings as descriptions')
  describe('field access')
    it('returns field proxy for collected fields')
    it('returns none for uncollected fields')
    it('provides transformation properties')
  describe('completion state')
    it('starts with done as false')
    it('becomes done when all fields collected')
    it('ignores optional fields for completion')
```

### interviewer tests

**Harmonized Structure:**
```
describe('Interviewer')
  describe('initialization')
    it('creates with interview instance')
    it('generates unique thread id')
    it('configures llm model')
  describe('tool generation')
    it('creates tool for each field')
    it('includes validation in tool schema')
    it('includes transformations in tool schema')
  describe('conversation flow')
    it('starts with greeting')
    it('collects fields sequentially')
    it('validates field requirements')
    it('handles invalid responses')
```

### field_proxy tests (needs creation in TypeScript)

**Harmonized Structure:**
```
describe('FieldProxy')
  describe('string behavior')
    it('acts as normal string')
    it('supports string methods')
    it('has correct string value')
  describe('transformation access')
    it('provides as_int property')
    it('provides as_float property')
    it('provides as_bool property')
    it('provides as_lang_X properties')
    it('provides as_quote property')
  describe('edge cases')
    it('handles missing transformations')
    it('handles null values')
    it('preserves original value')
```

## Progress Summary

### ✅ 100% COMPLETE - All 7 Test Files Harmonized!

#### Harmonized Test Files:
1. **Builder** - `describe('Builder')` with identical nested structure for field configuration
2. **Interview** - `describe('Interview')` with matching field access and state tests  
3. **FieldProxy** - `describe('FieldProxy')` created for both languages with string behavior tests
4. **Interviewer** - `describe('Interviewer')` with harmonized initialization and orchestration tests
5. **CustomTransformations** - `describe('CustomTransformations')` with matching transformation tests
6. **InterviewerConversation** - `describe('InterviewerConversation')` with go method tests
7. **Conversations** - `describe('Conversations')` with full conversation flow tests

#### Key Achievements:
- **pytest-describe installed** - Python now uses describe/it syntax just like Jest
- **100% structural alignment** - Every test file has identical describe/it hierarchy
- **Word-for-word test descriptions** - Finding equivalent tests is trivial
- **Created missing tests** - Added field_proxy tests to ensure complete coverage
- **Consistent naming patterns** - No more test_ prefixes, verb-first descriptions

### 🎯 Impact
The test suites now feel like a single unified codebase written in two languages. Developers can:
- Instantly find the corresponding test in the other language
- Verify feature parity at a glance
- Maintain both test suites with the same mental model
- Easily identify missing tests or features

## Example Conversion

### Before (Python):
```python
class TestBasicBuilder:
    def test_simple_interview(self):
        """Test basic Interview creation with builder."""
        instance = (chatfield()
            .type("SimpleInterview")
            .desc("A simple interview")
            .field("name").desc("Your name")
            .build())
        assert instance._chatfield['type'] == "SimpleInterview"
```

### After (Python with pytest-describe):
```python
def describe_builder():
    def describe_basic_usage():
        def it_creates_simple_interview():
            instance = (chatfield()
                .type("SimpleInterview")
                .desc("A simple interview")
                .field("name").desc("Your name")
                .build())
            assert instance._chatfield['type'] == "SimpleInterview"
```

### TypeScript (already describe-based, just needs renaming):
```typescript
describe('Builder', () => {
  describe('basic usage', () => {
    it('creates simple interview', () => {
      const instance = chatfield()
        .type('SimpleInterview')
        .desc('A simple interview')
        .field('name').desc('Your name')
        .build()
      expect(instance._chatfield.type).toBe('SimpleInterview')
    })
  })
})
```

## Naming Conventions

1. **Top-level describe**: Use the component name without "Test" prefix
   - ✅ `describe('Builder')`
   - ❌ `describe('TestBuilder')`

2. **Nested describe**: Use lowercase, descriptive phrases
   - ✅ `describe('field validation')`
   - ❌ `describe('FieldValidation')`

3. **It blocks**: Start with verb, be specific
   - ✅ `it('validates email format')`
   - ❌ `it('test_email_validation')`

4. **No test_ prefix in descriptions**
   - ✅ `it('creates simple interview')`
   - ❌ `it('test_simple_interview')`

## Benefits

1. **Easy Cross-Reference**: Find equivalent tests instantly
2. **Shared Mental Model**: Same structure in both languages
3. **Maintenance**: Changes in one language guide changes in the other
4. **Onboarding**: New contributors understand both test suites
5. **Coverage Verification**: Easy to spot missing tests