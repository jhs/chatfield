/**
 * Test file demonstrating the two transformation modes:
 * - Mandatory sub-name (as_lang) - throws without parameters
 * - Optional sub-name (as_bool) - works without parameters
 */

import { chatfield } from '../src/builder'

describe('Transformation Modes', () => {
  test('mandatory sub-name mode: as_lang requires parameters', () => {
    // This should throw an error
    expect(() => {
      const instance = chatfield()
        .type('MandatoryTest')
        .field('greeting')
          .desc('A greeting')
          .as_lang()  // ERROR: No parameters provided
        .build()
    }).toThrow('as_lang requires a sub-name parameter')
  })

  test('optional sub-name mode: as_bool works without parameters', () => {
    // This should NOT throw an error
    expect(() => {
      const instance = chatfield()
        .type('OptionalTest')
        .field('is_active')
          .desc('Active status')
          .as_bool()  // OK: No parameters needed
        .build()
      
      // Verify the cast was created with default name
      const casts = instance._chatfield.fields.is_active?.casts
      expect(casts && 'as_bool' in casts).toBe(true)
      expect(casts?.as_bool.prompt).toBe('parse as boolean')
    }).not.toThrow()
  })

  test('both modes work with parameters', () => {
    const instance = chatfield()
      .type('BothModesTest')
      .field('message')
        .desc('A message')
        .as_lang('fr', 'French with a happy tone')  // Mandatory mode with sub-name + custom prompt
        .as_bool('is_important', 'Check if important')  // Optional mode with sub-name + custom prompt
      .build()
    
    // Check as_lang with mandatory sub-name
    const messageCasts = instance._chatfield.fields.message?.casts
    expect(messageCasts && 'as_lang_fr' in messageCasts).toBe(true)
    expect(messageCasts?.as_lang_fr.prompt).toBe('French with a happy tone')
    
    // Check as_bool with optional sub-name
    expect(messageCasts && 'as_bool_is_important' in messageCasts).toBe(true)
    expect(messageCasts?.as_bool_is_important.prompt).toBe('Check if important')
  })
})