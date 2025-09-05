"""Tests for the Interviewer class conversation functionality.
Mirrors TypeScript's test_interviewer_conversation.test.ts
"""

import os
import pytest
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from project root .env file
project_root = Path(__file__).parent.parent.parent
env_file = project_root / '.env'
load_dotenv(env_file)

from chatfield import Interview, Interviewer, chatfield


class TestConversationFlow:
    """Test conversation flow management."""
    
    @pytest.mark.skipif(not os.getenv("OPENAI_API_KEY"), reason="Requires OpenAI API key")
    def test_go_method_basic(self):
        """Test the go() method with real API."""
        interview = (chatfield()
            .type("SimpleInterview")
            .field("name").desc("Your name")
            .build())
        interviewer = Interviewer(interview)
        
        # Start conversation
        ai_message = interviewer.go(None)
        
        print(f"---------------\nAI Message:\n{ai_message}\n---------------")
        assert ai_message is not None
        assert isinstance(ai_message, str)
        assert len(ai_message) > 0