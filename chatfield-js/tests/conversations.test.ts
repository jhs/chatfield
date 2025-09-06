/**
 * Tests for complete conversation flows with prefab user messages.
 * Mirrors Python's test_conversations.py with identical test descriptions.
 * 
 * NOTE: Tests are currently skipped as TypeScript implementation is not yet complete.
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
  });
});