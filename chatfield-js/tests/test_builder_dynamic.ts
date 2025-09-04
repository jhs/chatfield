/**
 * Unit tests for Chatfield dynamic builder.
 */

import { chatfieldDynamic } from '../src/builder'

describe('Dynamic Builder Tests', () => {
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
})