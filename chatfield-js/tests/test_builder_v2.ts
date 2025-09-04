/**
 * Unit tests for Chatfield builder pattern with type-safe version.
 * Tests the new v2 builder with proper TypeScript support.
 */

import { chatfield, chatfieldDynamic } from '../src/builder-v2'

describe('TypeSafe Builder Tests', () => {
  test('test_type_safe_field_tracking', () => {
    // Type-safe version tracks field names
    const instance = chatfield()
      .type('TypedInterview')
      .field('name').desc('Your name')
      .field('email').desc('Your email')
      .build()
    
    // TypeScript knows these fields exist
    const meta = instance._chatfield
    expect(meta.fields.name?.desc).toBe('Your name')
    expect(meta.fields.email?.desc).toBe('Your email')
    
    // This would be a TypeScript error if uncommented:
    // instance.unknownField  // Error: Property 'unknownField' does not exist
  })
  
  test('test_dynamic_builder', () => {
    // Dynamic version allows any field names (Python-like)
    const instance = chatfieldDynamic()
      .type('DynamicInterview')
      .field('anything').desc('Any field')
      .field('random').desc('Random field')
      .build()
    
    expect(instance._chatfield.fields.anything?.desc).toBe('Any field')
    expect(instance._chatfield.fields.random?.desc).toBe('Random field')
  })
  
  test('test_callable_trait_builder', () => {
    const instance = chatfield()
      .type('WithTraits')
      .alice()
        .type('Interviewer')
        .trait('patient')  // Direct call works
        .trait('thorough')
      .field('test').desc('Test field')
      .build()
    
    const meta = instance._chatfield
    expect(meta.roles.alice.traits).toContain('patient')
    expect(meta.roles.alice.traits).toContain('thorough')
  })
  
  test('test_callable_cast_builders', () => {
    const instance = chatfield()
      .type('WithCasts')
      .field('age')
        .desc('Your age')
        .as_int()  // Direct call works
      .field('price')
        .desc('Price')
        .as_float('Parse as currency')  // With custom prompt
      .field('active')
        .desc('Active status')
        .as_bool()
      .build()
    
    const meta = instance._chatfield
    expect(meta.fields.age?.casts.as_int).toBeDefined()
    expect(meta.fields.price?.casts.as_float).toBeDefined()
    expect(meta.fields.active?.casts.as_bool).toBeDefined()
  })
  
  test('test_sub_attribute_casts', () => {
    const instance = chatfield()
      .type('WithSubCasts')
      .field('description')
        .desc('Description')
        .as_lang.fr('Translate to French')
        .as_lang.es('Translate to Spanish')
      .build()
    
    const meta = instance._chatfield
    expect(meta.fields.description?.casts.as_lang_fr).toBeDefined()
    expect(meta.fields.description?.casts.as_lang_es).toBeDefined()
  })
  
  test('test_choice_builders', () => {
    const instance = chatfield()
      .type('WithChoices')
      .field('priority')
        .desc('Priority level')
        .as_one('low', 'medium', 'high')
      .field('features')
        .desc('Selected features')
        .as_multi('feature1', 'feature2', 'feature3')
      .build()
    
    const meta = instance._chatfield
    expect(meta.fields.priority?.casts.as_one?.choices).toEqual(['low', 'medium', 'high'])
    expect(meta.fields.features?.casts.as_multi?.multi).toBe(true)
  })
  
  test('test_confidential_and_conclude', () => {
    const instance = chatfield()
      .type('WithSpecialFields')
      .field('ssn')
        .desc('SSN')
        .confidential()
      .field('summary')
        .desc('Summary')
        .conclude()
      .build()
    
    const meta = instance._chatfield
    expect(meta.fields.ssn?.specs.confidential).toBe(true)
    expect(meta.fields.summary?.specs.conclude).toBe(true)
    expect(meta.fields.summary?.specs.confidential).toBe(true) // Implied
  })
  
  test('test_chaining_everything', () => {
    const instance = chatfield()
      .type('CompleteExample')
      .desc('A complete example')
      .alice()
        .type('AI Assistant')
        .trait('helpful')
        .trait('knowledgeable')
      .bob()
        .type('User')
        .trait('curious')
      .field('name')
        .desc('Your name')
        .must('include first and last')
        .hint('Format: First Last')
      .field('age')
        .desc('Your age')
        .as_int()
        .must('be between 0 and 150')
      .field('bio')
        .desc('Short bio')
        .as_lang.fr('French translation')
        .reject('profanity')
        .confidential()
      .build()
    
    const meta = instance._chatfield
    
    // Check interview metadata
    expect(meta.type).toBe('CompleteExample')
    expect(meta.desc).toBe('A complete example')
    
    // Check roles
    expect(meta.roles.alice.type).toBe('AI Assistant')
    expect(meta.roles.alice.traits).toContain('helpful')
    expect(meta.roles.bob.type).toBe('User')
    
    // Check fields
    expect(meta.fields.name?.specs.must).toContain('include first and last')
    expect(meta.fields.age?.casts.as_int).toBeDefined()
    expect(meta.fields.bio?.specs.confidential).toBe(true)
  })
})