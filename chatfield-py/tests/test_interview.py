"""Tests for Interview-specific functionality."""

import pytest
from chatfield import chatfield


class TestInterviewBasics:
    """Test basic Interview functionality."""
    
    def test_field_with_default_description(self):
        """Test field with no description uses field name."""
        instance = (chatfield()
            .type("TestInterview")
            .field("test_field")  # No description
            .build())
        
        # Should use field name as description
        assert instance._chatfield['fields']['test_field']['desc'] == 'test_field'
    
    def test_field_access_before_collection(self):
        """Test accessing fields before data collection returns None."""
        instance = (chatfield()
            .type("TestInterview")
            .field("name").desc("Your name")
            .field("age").desc("Your age")
            .build())
        
        assert instance.name is None
        assert instance.age is None
    
    def test_done_property(self):
        """Test the _done property."""
        instance = (chatfield()
            .type("TestInterview")
            .field("field1").desc("Field 1")
            .field("field2").desc("Field 2")
            .build())
        
        # Initially not done
        assert instance._done is False
        
        # Set one field - still not done
        instance._chatfield['fields']['field1']['value'] = {
            'value': 'test1',
            'context': 'N/A',
            'as_quote': 'test1'
        }
        assert instance._done is False
        
        # Set both fields - now done
        instance._chatfield['fields']['field2']['value'] = {
            'value': 'test2',
            'context': 'N/A',
            'as_quote': 'test2'
        }
        assert instance._done is True
        
        # Empty interview is done by default
        empty = chatfield().build()
        assert empty._done is True
    
    def test_model_dump(self):
        """Test the model_dump method for serialization."""
        instance = (chatfield()
            .type("TestInterview")
            .field("name").desc("Your name")
            .build())
        dump = instance.model_dump()
        
        assert isinstance(dump, dict)
        assert dump['type'] == 'TestInterview'
        assert 'fields' in dump
        assert 'name' in dump['fields']
        
        # Modify original and ensure dump is independent
        instance._chatfield['fields']['name']['value'] = {'value': 'test'}
        assert dump['fields']['name']['value'] is None  # Should still be None
    
    def test_pretty_method(self):
        """Test the _pretty() method output."""
        instance = (chatfield()
            .type("TestInterview")
            .field("name").desc("Your name")
            .field("age").desc("Your age")
            .build())
        
        # Set one field
        instance._chatfield['fields']['name']['value'] = {
            'value': 'Alice',
            'context': 'User provided name',
            'as_quote': 'My name is Alice'
        }
        
        pretty = instance._pretty()
        
        assert 'TestInterview' in pretty
        # Should show field values in pretty format
        assert 'name' in pretty or 'Alice' in pretty