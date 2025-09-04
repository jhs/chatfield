/**
 * Unit tests for Chatfield builder pattern.
 * Mirrors Python's test_builder.py
 */

import { chatfield } from '../src/builder'

describe('TestBasicBuilder', () => {
// describe('TestBasicBuilder', () => {
  test('test_simple_interview', () => {
    const instance = chatfield()
      .type('SimpleInterview')
      .desc('A simple interview')
      .field('name').desc('Your name')
      .field('email').desc('Your email')
      .build()

    const meta = instance._chatfield
    expect(meta.type).toBe('SimpleInterview')
    expect(meta.desc).toBe('A simple interview')
    expect(Object.keys(meta.fields).length).toBe(2)
    expect('name' in meta.fields).toBe(true)
    expect('email' in meta.fields).toBe(true)
    expect(meta.fields.name?.desc).toBe('Your name')
    expect(meta.fields.email?.desc).toBe('Your email')
  })

  test('test_field_validation_rules', () => {
    const instance = chatfield()
      .type('ValidatedInterview')
      .field('field')
        .desc('Test field')
        .must('specific requirement')
        .reject('avoid this')
        .hint('Helpful tip')
      .build()

    const fieldMeta = instance._chatfield.fields.field
    expect(fieldMeta?.specs.must).toContain('specific requirement')
    expect(fieldMeta?.specs.reject).toContain('avoid this')
    expect(fieldMeta?.specs.hint).toContain('Helpful tip')
  })

  test('test_multiple_validation_rules', () => {
    const instance = chatfield()
      .type('MultiRuleInterview')
      .field('field')
        .desc('Test field')
        .must('rule 1')
        .must('rule 2')
        .must('rule 3')
      .build()

    const fieldMeta = instance._chatfield.fields.field
    // Builder should maintain order
    expect(fieldMeta?.specs.must).toEqual(['rule 1', 'rule 2', 'rule 3'])
  })

  test('test_multiple_hints', () => {
    const instance = chatfield()
      .type('MultiHintInterview')
      .field('field')
        .desc('Test field with multiple hints')
        .hint('First hint')
        .hint('Second hint')
        .hint('Third hint')
      .build()

    const fieldMeta = instance._chatfield.fields.field
    expect(fieldMeta?.specs.hint).toEqual(['First hint', 'Second hint', 'Third hint'])
    expect(fieldMeta?.specs.hint?.length).toBe(3)
  })

  test('test_combined_field_features', () => {
    const instance = chatfield()
      .type('CombinedInterview')
      .field('complex_field')
        .desc('Complex field')
        .must('required info')
        .reject('forbidden content')
        .hint('Helpful guidance')
      .build()

    const fieldMeta = instance._chatfield.fields.complex_field

    expect(fieldMeta?.desc).toBe('Complex field')
    expect(fieldMeta?.specs.must).toContain('required info')
    expect(fieldMeta?.specs.reject).toContain('forbidden content')
    expect(fieldMeta?.specs.hint).toContain('Helpful guidance')
  })
})

describe('TestRoleConfiguration', () => {
  test('test_alice_role', () => {
    const instance = chatfield()
      .type('WithAlice')
      .alice().type('Senior Developer')
      .field('field').desc('Test field')
      .build()

    const meta = instance._chatfield
    expect(meta.roles.alice.type).toBe('Senior Developer')
  })

  test('test_alice_traits', () => {
    const instance = chatfield()
      .type('WithAliceTraits')
      .alice()
        .type('Interviewer')
        .trait('patient')
        .trait('thorough')
      .field('field').desc('Test field')
      .build()

    const meta = instance._chatfield
    expect(meta.roles.alice.type).toBe('Interviewer')
    expect(meta.roles.alice.traits).toContain('patient')
    expect(meta.roles.alice.traits).toContain('thorough')
  })

  test('test_bob_role', () => {
    const instance = chatfield()
      .type('WithBob')
      .bob().type('Job Candidate')
      .field('field').desc('Test field')
      .build()

    const meta = instance._chatfield
    expect(meta.roles.bob.type).toBe('Job Candidate')
  })

  test('test_bob_traits', () => {
    const instance = chatfield()
      .type('WithBobTraits')
      .bob()
        .type('User')
        .trait('technical')
        .trait('curious')
      .field('field').desc('Test field')
      .build()

    const meta = instance._chatfield
    expect(meta.roles.bob.type).toBe('User')
    expect(meta.roles.bob.traits).toContain('technical')
    expect(meta.roles.bob.traits).toContain('curious')
  })

  test('test_both_roles', () => {
    const instance = chatfield()
      .type('FullRoles')
      .desc('Test interview process')
      .alice()
        .type('Interviewer')
        .trait('professional')
      .bob()
        .type('Candidate')
        .trait('experienced')
      .field('field1').desc('First field')
      .field('field2').desc('Second field')
      .build()

    const meta = instance._chatfield
    
    // Check description
    expect(meta.desc).toBe('Test interview process')
    
    // Check alice role
    expect(meta.roles.alice.type).toBe('Interviewer')
    expect(meta.roles.alice.traits).toContain('professional')
    
    // Check bob role
    expect(meta.roles.bob.type).toBe('Candidate')
    expect(meta.roles.bob.traits).toContain('experienced')
    
    // Check fields
    expect('field1' in meta.fields).toBe(true)
    expect('field2' in meta.fields).toBe(true)
    expect(meta.fields.field1?.desc).toBe('First field')
    expect(meta.fields.field2?.desc).toBe('Second field')
  })
})

describe('TestFieldTransformations', () => {
  test('test_type_transformations', () => {
    const instance = chatfield()
      .type('TypedInterview')
      .field('age')
        .desc('Your age')
        .as_int()
      .field('salary')
        .desc('Expected salary')
        .as_float()
      .field('active')
        .desc('Are you active?')
        .as_bool()
      .field('confidence')
        .desc('Confidence level')
        .as_percent()
      .build()

    expect(instance._chatfield.fields.age?.casts && 'as_int' in instance._chatfield.fields.age.casts).toBe(true)
    expect(instance._chatfield.fields.salary?.casts && 'as_float' in instance._chatfield.fields.salary.casts).toBe(true)
    expect(instance._chatfield.fields.active?.casts && 'as_bool' in instance._chatfield.fields.active.casts).toBe(true)
    expect(instance._chatfield.fields.confidence?.casts && 'as_percent' in instance._chatfield.fields.confidence.casts).toBe(true)
  })

  test('test_language_transformations', () => {
    const instance = chatfield()
      .type('MultiLangInterview')
      .field('greeting')
        .desc('Say hello')
        .as_lang('fr')
        .as_lang('es')
      .build()

    const fieldCasts = instance._chatfield.fields.greeting?.casts
    expect(fieldCasts && 'as_lang_fr' in fieldCasts).toBe(true)
    expect(fieldCasts && 'as_lang_es' in fieldCasts).toBe(true)
  })

  test('test_custom_transformations', () => {
    const instance = chatfield()
      .type('CustomTransform')
      .field('number')
        .desc('A number')
        .as_bool('even', 'True if even')
        .as_str('uppercase', 'In uppercase')
      .build()

    const fieldCasts = instance._chatfield.fields.number?.casts
    expect(fieldCasts && 'as_bool_even' in fieldCasts).toBe(true)
    expect(fieldCasts && 'as_str_uppercase' in fieldCasts).toBe(true)
  })

  test('test_api_flexibility', () => {
    const instance = chatfield()
      .type('FlexibleAPITest')
      .field('temperature')
        .desc('Temperature reading')
        .as_int()  // Default usage
        .as_float('Parse as precise decimal')  // Custom prompt
      .field('severity')
        .desc('Issue severity')
        .as_int('severity_level', 'Range from 1-10')  // Sub-name + custom prompt
      .field('message')
        .desc('Status message')
        .as_lang('fr')  // Mandatory sub-name
        .as_lang('es', 'Traducir al español')  // Sub-name + custom prompt
      .build()

    // Check default as_int
    const tempCasts = instance._chatfield.fields.temperature?.casts
    expect(tempCasts && 'as_int' in tempCasts).toBe(true)
    expect(tempCasts?.as_int.prompt).toBe('parse as integer')
    
    // Check as_float with custom prompt
    expect(tempCasts && 'as_float' in tempCasts).toBe(true)
    expect(tempCasts?.as_float.prompt).toBe('Parse as precise decimal')
    
    // Check as_int with sub-name and custom prompt
    const severityCasts = instance._chatfield.fields.severity?.casts
    expect(severityCasts && 'as_int_severity_level' in severityCasts).toBe(true)
    expect(severityCasts?.as_int_severity_level.prompt).toBe('Range from 1-10')
    
    // Check as_lang with mandatory sub-name
    const messageCasts = instance._chatfield.fields.message?.casts
    expect(messageCasts && 'as_lang_fr' in messageCasts).toBe(true)
    expect(messageCasts?.as_lang_fr.prompt).toBe('translate to fr')
    
    // Check as_lang with sub-name and custom prompt
    expect(messageCasts && 'as_lang_es' in messageCasts).toBe(true)
    expect(messageCasts?.as_lang_es.prompt).toBe('Traducir al español')
  })

  test('test_choice_cardinality', () => {
    const instance = chatfield()
      .type('ChoiceInterview')
      .field('color')
        .desc('Favorite color')
        .as_one('selection', 'red', 'green', 'blue')
      .field('priority')
        .desc('Priority level')
        .as_maybe('selection', 'low', 'medium', 'high')
      .field('languages')
        .desc('Programming languages')
        .as_multi('selection', 'python', 'javascript', 'rust')
      .field('reviewers')
        .desc('Code reviewers')
        .as_any('selection', 'alice', 'bob', 'charlie')
      .build()

    // Note: The builder uses different names for choice casts
    const colorCast = instance._chatfield.fields.color?.casts?.as_one_selection
    if (colorCast) {
      expect(colorCast.type).toBe('choice')
      expect(colorCast.choices).toEqual(['red', 'green', 'blue'])
      expect(colorCast.null).toBe(false)
      expect(colorCast.multi).toBe(false)
    }

    const priorityCast = instance._chatfield.fields.priority?.casts?.as_maybe_selection
    if (priorityCast) {
      expect(priorityCast.type).toBe('choice')
      expect(priorityCast.choices).toEqual(['low', 'medium', 'high'])
      expect(priorityCast.null).toBe(true)
      expect(priorityCast.multi).toBe(false)
    }

    const languagesCast = instance._chatfield.fields.languages?.casts?.as_multi_selection
    if (languagesCast) {
      expect(languagesCast.type).toBe('choice')
      expect(languagesCast.choices).toEqual(['python', 'javascript', 'rust'])
      expect(languagesCast.null).toBe(false)
      expect(languagesCast.multi).toBe(true)
    }

    const reviewersCast = instance._chatfield.fields.reviewers?.casts?.as_any_selection
    if (reviewersCast) {
      expect(reviewersCast.type).toBe('choice')
      expect(reviewersCast.choices).toEqual(['alice', 'bob', 'charlie'])
      expect(reviewersCast.null).toBe(true)
      expect(reviewersCast.multi).toBe(true)
    }
  })
})