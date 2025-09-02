/**
 * Test custom transformations demonstrating feature parity.
 * This test file shows how TypeScript supports dynamic custom transformations.
 */

import { chatfield } from '../src/builders/gatherer-builder'
import { MockLLMBackend } from '../src/backends/llm-backend'
import { Interviewer } from '../src/core/interviewer'

describe('Custom Transformations', () => {

  test('basic .as_int() transformation', () => {
    // Test basic .as_int() transformation
    const NumberForm = chatfield()
      .field('favorite', 'Your favorite number')
      .as_int()
      .build()

    // Check that the transformation was created in metadata
    const fields = NumberForm._chatfield.fields
    expect(fields['favorite']).toBeDefined()
    
    const casts = fields['favorite'].casts
    expect(casts['as_int']).toBeDefined()
    expect(casts['as_int'].type).toBe('int')
  })

  test('custom .as_int.neg1() transformation', () => {
    // Test custom .as_int.neg1('This is always -1') transformation
    const CustomForm = chatfield()
      .field('number', 'Enter a number')
      .as_int()
      .as_int.neg1('This is always -1')
      .build()

    // Check that the custom transformation was created
    const fields = CustomForm._chatfield.fields
    expect(fields['number']).toBeDefined()
    
    const casts = fields['number'].casts
    expect(casts['as_int']).toBeDefined()
    expect(casts['as_int_neg1']).toBeDefined()
    expect(casts['as_int_neg1'].prompt).toBe('This is always -1')
  })

  test('multiple custom transformations on same field', () => {
    // Test multiple custom transformations on the same field
    const MultiTransformForm = chatfield()
      .field('value', 'Enter a value')
      .as_int()
      .as_int.neg1('This is always -1')
      .as_int.doubled('Double the integer value')
      .as_int.squared('Square the integer value')
      .as_bool.even('True if the integer is even')
      .as_lang.fr('French translation')
      .as_str.uppercase('Convert to uppercase')
      .build()

    // Check that all custom transformations were created
    const fields = MultiTransformForm._chatfield.fields
    expect(fields['value']).toBeDefined()
    
    const casts = fields['value'].casts
    expect(casts['as_int']).toBeDefined()
    expect(casts['as_int_neg1']).toBeDefined()
    expect(casts['as_int_doubled']).toBeDefined()
    expect(casts['as_int_squared']).toBeDefined()
    expect(casts['as_bool_even']).toBeDefined()
    expect(casts['as_lang_fr']).toBeDefined()
    expect(casts['as_str_uppercase']).toBeDefined()
  })

  test('dynamic transformation names follow pattern', () => {
    // Test that transformation names follow the pattern: as_{type}_{name}
    const NamingForm = chatfield()
      .field('test', 'Test field')
      .as_int.custom_name('Custom transformation')
      .as_bool.is_positive('Check if positive')
      .as_lang.esperanto('Translate to Esperanto')
      .build()

    const fields = NamingForm._chatfield.fields
    const casts = fields['test'].casts
    const castNames = Object.keys(casts)

    // Check the transformation names follow the expected pattern
    expect(castNames).toContain('as_int_custom_name')
    expect(castNames).toContain('as_bool_is_positive')
    expect(castNames).toContain('as_lang_esperanto')
  })

  test('transformation with custom prompt', () => {
    // Test custom transformations with specific prompts
    const PromptForm = chatfield()
      .field('rating', 'Rate from 1-10')
      .as_int()
      .as_int.percentage('Convert to percentage (multiply by 10)')
      .as_bool.high('True if rating is 7 or higher')
      .build()

    // Check that custom prompts were stored
    const fields = PromptForm._chatfield.fields
    const casts = fields['rating'].casts
    
    expect(casts['as_int_percentage'].prompt).toBe('Convert to percentage (multiply by 10)')
    expect(casts['as_bool_high'].prompt).toBe('True if rating is 7 or higher')
  })

  test('property existence checks for transformations', () => {
    // Test that property existence checks work correctly
    const CheckForm = chatfield()
      .field('data', 'Enter data')
      .as_int()
      .as_int.special('Special transformation')
      .build()

    const fields = CheckForm._chatfield.fields
    const casts = fields['data'].casts
    
    // Test that the expected transformations exist in metadata
    expect('as_int' in casts).toBe(true)
    expect('as_int_special' in casts).toBe(true)

    // Test that non-defined transformations don't exist
    expect('as_int_nonexistent' in casts).toBe(false)
    expect('as_float' in casts).toBe(false) // Not defined
  })

  test('identical nomenclature with Python', () => {
    // Demonstrate identical API with Python implementation
    const Form = chatfield()
      .field('number')
      .desc('Your favorite number')
      .as_int()
      .as_int.neg1('This is always -1')
      .as_int.doubled('Double the value')
      .as_bool.even('True if even')
      .build()

    // This is identical to Python:
    // class Form(Interview):
    //     number = "Your favorite number"
    //     @as_int
    //     @as_int.neg1("This is always -1")
    //     @as_int.doubled("Double the value")
    //     @as_bool.even("True if even")
    //     def number(self): pass

    // Verify the transformations are stored with identical naming to Python
    const fields = Form._chatfield.fields
    const casts = fields['number'].casts
    
    // These transformation names match Python exactly:
    expect(casts['as_int']).toBeDefined()
    expect(casts['as_int_neg1']).toBeDefined()
    expect(casts['as_int_doubled']).toBeDefined()
    expect(casts['as_bool_even']).toBeDefined()
    
    // The prompts are also stored correctly
    expect(casts['as_int_neg1'].prompt).toBe('This is always -1')
    expect(casts['as_int_doubled'].prompt).toBe('Double the value')
    expect(casts['as_bool_even'].prompt).toBe('True if even')
  })

  test('arbitrary custom transformation names', () => {
    // Test that any arbitrary transformation name works
    const ArbitraryForm = chatfield()
      .field('data')
      .as_int.foo('Foo transformation')
      .as_int.bar('Bar transformation')
      .as_int.baz('Baz transformation')
      .as_bool.qux('Qux transformation')
      .as_str.quux('Quux transformation')
      .as_lang.klingon('Translate to Klingon')
      .build()

    const fields = ArbitraryForm._chatfield.fields
    const casts = fields['data'].casts
    const castNames = Object.keys(casts)

    // All arbitrary names should work
    expect(castNames).toContain('as_int_foo')
    expect(castNames).toContain('as_int_bar')
    expect(castNames).toContain('as_int_baz')
    expect(castNames).toContain('as_bool_qux')
    expect(castNames).toContain('as_str_quux')
    expect(castNames).toContain('as_lang_klingon')
  })
})