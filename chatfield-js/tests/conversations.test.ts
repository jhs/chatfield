/**
 * Tests for complete conversation flows with prefab user messages.
 * Mirrors Python's test_conversations.py with identical test descriptions.
 * 
 * NOTE: Most tests are currently skipped as they require real API or complete TypeScript implementation.
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { chatfield } from '../src/builder';
import { Interviewer } from '../src/interviewer';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from project root .env file
const projectRoot = path.resolve(__dirname, '..', '..');
config({ path: path.join(projectRoot, '.env') });

const LLM_ID = process.env.LLM_ID || 'openai:gpt-4o';
const hasApiKey = !!process.env.OPENAI_API_KEY;

describe('Conversations', () => {
  describe('restaurant order', () => {
    const createRestaurantOrder = () => {
      return chatfield()
        .type('Restaurant Order')
        .desc('Taking your order for tonight')
        
        .alice()
          .type('Server')
          .trait('Friendly and attentive')
        
        .bob()
          .type('Diner')
          .trait('First-time visitor')
          .trait.possible('Vegan', 'needs vegan, plant-based, non animal product')
        
        .field('starter')
          .desc('starter or appetizer')
          .as_one.selection('Sir Digby Chicken Caesar', 'Shrimp cocktail', 'Garden salad')
        
        .field('main_course')
          .desc('Main course')
          .hint('Choose from: Grilled salmon, Veggie pasta, Beef tenderloin, Chicken parmesan')
          .as_one.selection('Grilled salmon', 'Veggie pasta', 'Beef tenderloin', 'Chicken parmesan')
        
        .field('dessert')
          .desc('Mandatory dessert; choices: Cheesecake, Chocolate mousse, Fruit sorbet')
          .as_one.selection('Cheesecake', 'Chocolate mousse', 'Fruit sorbet')
        
        .build();
    };
    
    test.skip('adapts to vegan preferences', async () => {
      const order = createRestaurantOrder();
      const interviewer = new Interviewer(order, { threadId: 'test-vegan-order', llmId: LLM_ID });
      
      // Prefab inputs for vegan customer
      const prefabInputs = [
        'I am vegan, so I need plant-based options only.',
        'Garden salad please',
        'Veggie pasta sounds perfect',
        'Fruit sorbet would be great'
      ];
      
      // Initial AI message
      let aiMessage = await interviewer.go(null);
      expect(aiMessage).toBeTruthy();
      
      // Process each input
      for (const userInput of prefabInputs) {
        if (order._done) break;
        aiMessage = await interviewer.go(userInput);
      }
      
      // Verify the order was completed correctly
      expect(order._done).toBe(true);
      expect(order.starter).toBe('Garden salad');
      expect(order.main_course).toBe('Veggie pasta');
      expect(order.dessert).toBe('Fruit sorbet');
      
      // Check that vegan trait was activated
      const traits = order._chatfield.roles.bob.possible_traits || {};
      expect('Vegan' in traits).toBe(true);
      
      // TODO: Activating traits is not implemented yet
      // expect(traits.Vegan?.active).toBe(true);
    });
    
    test.skip('handles regular order', async () => {
      const order = createRestaurantOrder();
      const interviewer = new Interviewer(order, { threadId: 'test-regular-order', llmId: LLM_ID });
      
      const prefabInputs = [
        'The Sir Digby Chicken Caesar sounds good',
        'I\'ll have the grilled salmon',
        'Chocolate mousse for dessert'
      ];
      
      // Initial message
      let aiMessage = await interviewer.go(null);
      expect(aiMessage).toBeTruthy();
      
      // Process inputs
      for (const userInput of prefabInputs) {
        if (order._done) break;
        aiMessage = await interviewer.go(userInput);
      }
      
      // Verify completion
      expect(order._done).toBe(true);
      expect(['Sir Digby Chicken Caesar', 'Garden salad']).toContain(order.starter);
      expect(order.main_course).toBe('Grilled salmon');
      expect(order.dessert).toBe('Chocolate mousse');
    });
  });

  describe('job interview', () => {
    const createJobInterview = () => {
      return chatfield()
        .type('JobInterview')
        .desc('Software Engineer position interview')
        
        .alice()
          .type('Hiring Manager')
        
        .bob()
          .type('Candidate')
          .trait.possible('career-changer', 'mentions different industry or transferable skills')
        
        .field('experience')
          .desc('Tell me about your relevant experience')
          .must('specific examples')
        
        .field('has_mentored')
          .desc('Gives specific evidence of professionally mentoring junior colleagues')
          .confidential()
          .as_bool()
        
        .build();
    };
    
    test.skip('detects career changer', async () => {
      const interview = createJobInterview();
      const interviewer = new Interviewer(interview, { threadId: 'test-career-change', llmId: LLM_ID });
      
      const prefabInputs = [
        "I spent 5 years in finance but taught myself programming. " +
        "I built a trading algorithm in Python that automated our daily reports, " +
        "saving the team 20 hours per week. I also created a dashboard using React.",
        
        "In my finance role, I regularly mentored junior analysts on Python programming " +
        "and helped them understand data structures and algorithms."
      ];
      
      // Start conversation
      let aiMessage = await interviewer.go(null);
      expect(aiMessage).toBeTruthy();
      
      // Process inputs
      for (const userInput of prefabInputs) {
        if (interview._done) break;
        aiMessage = await interviewer.go(userInput);
      }
      
      // Verify data collection
      expect(interview.experience).toBeTruthy();
      expect(interview.experience.toLowerCase()).toContain('finance');
      expect(interview.experience.toLowerCase()).toContain('python');
      
      // Check confidential field
      expect(interview.has_mentored).toBeTruthy();
      expect(interview.has_mentored.as_bool).toBe(true);
      
      // Check career-changer trait
      const traits = interview._chatfield.roles.bob.possible_traits || {};
      if ('career-changer' in traits) {
        expect(traits['career-changer'].active).toBe(true);
      }
    });
    
    test.skip('handles technical interview', async () => {
      const interview = createJobInterview();
      const interviewer = new Interviewer(interview, { threadId: 'test-technical', llmId: LLM_ID });
      
      const prefabInputs = [
        "I have 8 years of experience as a full-stack developer. " +
        "Most recently, I led the redesign of our e-commerce platform, " +
        "improving load times by 40% and increasing conversion rates.",
        
        "I've been a tech lead for 3 years, mentoring a team of 5 developers " +
        "through code reviews, pair programming, and weekly learning sessions."
      ];
      
      // Start conversation
      let aiMessage = await interviewer.go(null);
      expect(aiMessage).toBeTruthy();
      
      // Process inputs
      for (const userInput of prefabInputs) {
        if (interview._done) break;
        aiMessage = await interviewer.go(userInput);
      }
      
      // Verify experience was captured
      expect(interview.experience).toBeTruthy();
      expect(
        interview.experience.includes('e-commerce') || 
        interview.experience.includes('platform')
      ).toBe(true);
      
      // Check mentoring detection
      expect(interview.has_mentored).toBeTruthy();
      expect(interview.has_mentored.as_bool).toBe(true);
    });
  });

  describe('number conversation', () => {
    const createNumberInterview = () => {
      return chatfield()
        .type('FavoriteNumber')
        .desc("Let's talk about your favorite number")
        
        .alice()
          .type('Mathematician')
        
        .bob()
          .type('Number Enthusiast')
        
        .field('number')
          .desc('Your favorite number between 1 and 100')
          .must('a number between 1 and 100')
          .as_int()
          .as_bool('even', 'True if even, False if odd')
          .as_one('parity', 'even', 'odd')
        
        .build();
    };
    
    test.skip('collects number with transformations', async () => {
      const interview = createNumberInterview();
      const interviewer = new Interviewer(interview, { threadId: 'test-number', llmId: LLM_ID });
      
      const prefabInputs = ['My favorite number is 42'];
      
      // Start conversation
      let aiMessage = await interviewer.go(null);
      expect(aiMessage).toBeTruthy();
      
      // Process input
      for (const userInput of prefabInputs) {
        if (interview._done) break;
        aiMessage = await interviewer.go(userInput);
      }
      
      // Verify number was collected with transformations
      expect(interview._done).toBe(true);
      expect(interview.number).toBe('42');
      // TypeScript doesn't have FieldProxy like Python, so transformations are accessed differently
      // expect(interview.number.as_int).toBe(42);
      // expect(interview.number.as_bool_even).toBe(true);
      // expect(interview.number.as_one_parity).toBe('even');
    });
    
    test.skip('handles odd number transformations', async () => {
      const interview = createNumberInterview();
      const interviewer = new Interviewer(interview, { threadId: 'test-odd-number', llmId: LLM_ID });
      
      const prefabInputs = ['I like the number 17'];
      
      // Start conversation
      let aiMessage = await interviewer.go(null);
      expect(aiMessage).toBeTruthy();
      
      // Process input
      for (const userInput of prefabInputs) {
        if (interview._done) break;
        aiMessage = await interviewer.go(userInput);
      }
      
      // Verify odd number transformations
      expect(interview._done).toBe(true);
      expect(interview.number).toBe('17');
      // TypeScript doesn't have FieldProxy like Python, so transformations are accessed differently
      // expect(interview.number.as_int).toBe(17);
      // expect(interview.number.as_bool_even).toBe(false);
      // expect(interview.number.as_one_parity).toBe('odd');
    });
  });

  describe('simple conversations', () => {
    test.skip('collects name and email', async () => {
      const interview = chatfield()
        .type('ContactInfo')
        .desc('Collecting contact information')
        
        .field('name')
          .desc('Your full name')
        
        .field('email')
          .desc('Your email address')
          .must('valid email format')
        
        .build();
      
      const interviewer = new Interviewer(interview, { threadId: 'test-contact', llmId: LLM_ID });
      
      const prefabInputs = ['John Doe', 'john.doe@example.com'];
      
      // Initial message
      let aiMessage = await interviewer.go(null);
      expect(aiMessage).toBeTruthy();
      
      // Process inputs
      for (const userInput of prefabInputs) {
        if (interview._done) break;
        aiMessage = await interviewer.go(userInput);
      }
      
      // Verify completion
      expect(interview._done).toBe(true);
      expect(interview.name).toBe('John Doe');
      expect(interview.email).toBe('john.doe@example.com');
    });
    
    test.skip('collects boolean field', async () => {
      const interview = chatfield()
        .type('Preferences')
        .desc('Learning about your preferences')
        
        .field('likes_coffee')
          .desc('Do you like coffee?')
          .as_bool()
        
        .build();
      
      const interviewer = new Interviewer(interview, { threadId: 'test-bool', llmId: LLM_ID });
      
      const prefabInputs = ['Yes, I love coffee!'];
      
      // Start conversation
      let aiMessage = await interviewer.go(null);
      expect(aiMessage).toBeTruthy();
      
      // Process input
      for (const userInput of prefabInputs) {
        if (interview._done) break;
        aiMessage = await interviewer.go(userInput);
      }
      
      // Verify boolean was collected
      expect(interview._done).toBe(true);
      // TypeScript doesn't have FieldProxy like Python
      // expect(interview.likes_coffee.as_bool).toBe(true);
    });
  });
});