/**
 * Tests for the Interviewer class equivalent functionality.
 * Mirrors Python's test_interviewer.py
 */

import * as path from 'path'
import * as dotenv from 'dotenv'
import { chatfield } from '../src/builder'
import { Interviewer } from '../src/interviewer'

// Load environment variables from project root .env file
const projectRoot = path.join(__dirname, '..', '..')
const envFile = path.join(projectRoot, '.env')
dotenv.config({ path: envFile })

describe('TestConversationFlow', () => {
  // test('test_go_method_basic', async () => {
  test.skip('test_go_method_basic', async () => {
    // Skip test that requires real API key
    const interview = chatfield()
      .type('SimpleInterview')
      .field('name').desc('Your name')
      .build()
    const interviewer = new Interviewer(interview)
    
    // Start conversation
    const aiMessage = await interviewer.go(null)
    
    console.log(`---------------\nAI Message:\n${JSON.stringify(aiMessage, null, 2)}\n---------------`)
    expect(aiMessage).toBeDefined()
    expect(typeof aiMessage).toBe('string')
    expect(aiMessage!.length).toBeGreaterThan(0)
  })
})