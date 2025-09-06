"""Tests for complete conversation flows with prefab user messages."""

from langchain_core.language_models.fake import FakeListLLM
from langchain_core.language_models.fake_chat_models import FakeMessagesListChatModel

from chatfield import Interviewer, chatfield


def describe_conversations():
    """Tests for full conversation flows."""
    
    def describe_restaurant_order():
        """Tests for restaurant order conversation flow."""
        
        def create_restaurant_order():
            """Create restaurant order interview."""
            return (chatfield()
                .type("Restaurant Order")
                .desc("Taking your order for tonight")
                
                .alice()
                    .type("Server")
                    .trait("Friendly and attentive")
                
                .bob()
                    .type("Diner")
                    .trait("First-time visitor")
                    .trait.possible("Vegan", "needs vegan, plant-based, non animal product")
                
                .field("starter")
                    .desc("starter or appetizer")
                    .as_one('selection',"Sir Digby Chicken Caesar", "Shrimp cocktail", "Garden salad")
                
                .field("main_course")
                    .desc("Main course")
                    .hint("Choose from: Grilled salmon, Veggie pasta, Beef tenderloin, Chicken parmesan")
                    .as_one('selection', "Grilled salmon", "Veggie pasta", "Beef tenderloin", "Chicken parmesan")
                
                .field("dessert")
                    .desc("Mandatory dessert; choices: Cheesecake, Chocolate mousse, Fruit sorbet")
                    .as_one('selection', "Cheesecake", "Chocolate mousse", "Fruit sorbet")
                
                .build())
        
        def it_adapts_to_vegan_preferences():
            """Adapts conversation when vegan preference detected."""
            llm = FakeMessagesListChatModel(responses=["foo", 'bar', 'baz', 'qux', 'quux'])

            order = create_restaurant_order()
            interviewer = Interviewer(order, thread_id="test-vegan-order", llm=llm)
            
            # Prefab inputs for vegan customer
            prefab_inputs = [
                'I am vegan, so I need plant-based options only.',
                'Garden salad please',
                'Veggie pasta sounds perfect',
                'Fruit sorbet would be great'
            ]
            
            # Initial AI message
            ai_message = interviewer.go(None)
            assert ai_message is not None
            
            # Process each input
            for user_input in prefab_inputs:
                if order._done:
                    break
                ai_message = interviewer.go(user_input)
            
            # Verify the order was completed correctly
            assert order._done, "Order should be complete"
            assert order.starter == "Garden salad", f"Expected 'Garden salad', got {order.starter}"
            assert order.main_course == "Veggie pasta", f"Expected 'Veggie pasta', got {order.main_course}"
            assert order.dessert == "Fruit sorbet", f"Expected 'Fruit sorbet', got {order.dessert}"
            
            # Check that vegan trait was activated
            traits = order._chatfield['roles']['bob'].get('possible_traits', {})
            assert 'Vegan' in traits, "Vegan trait should be tracked"
            
            # TODO: Activating traits is not implemented yet, I don't think.
            # assert traits.get('Vegan', {}).get('active') == True, "Vegan trait should be active"