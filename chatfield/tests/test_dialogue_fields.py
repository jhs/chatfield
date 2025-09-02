"""Test field-specific edge cases and unique behaviors.

This file focuses on field-specific scenarios not covered in test_interview.py.
Basic field functionality is tested in test_interview.py.
"""

import pytest
from chatfield import chatfield


class TestFieldEdgeCases:
    """Test edge cases and special scenarios for fields."""
    
    def test_field_with_empty_description(self):
        """Test field that uses default name as description."""
        instance = (chatfield()
            .type("TestInterview")
            .field("field_without_desc")  # No .desc() call
            .field("with_desc").desc("Has description")
            .build())
        
        # Field without desc should use field name
        assert instance._chatfield['fields']['field_without_desc']['desc'] == 'field_without_desc'
        assert instance._chatfield['fields']['with_desc']['desc'] == 'Has description'
    
    def test_field_with_very_long_description(self):
        """Test field with unusually long description."""
        long_desc = "This is a very long description " * 50  # 1500+ chars
        instance = (chatfield()
            .type("LongDescInterview")
            .field("verbose").desc(long_desc)
            .build())
        
        assert instance._chatfield['fields']['verbose']['desc'] == long_desc
        assert len(instance._chatfield['fields']['verbose']['desc']) > 1500
    
    def test_field_with_special_characters_in_name(self):
        """Test fields with underscores and numbers in names."""
        instance = (chatfield()
            .type("SpecialNameInterview")
            .field("field_1").desc("First")
            .field("field_2_a").desc("Second A")
            .field("field_2_b").desc("Second B")
            .field("field_with_many_underscores").desc("Many underscores")
            .build())
        
        fields = instance._chatfield['fields']
        assert 'field_1' in fields
        assert 'field_2_a' in fields
        assert 'field_2_b' in fields
        assert 'field_with_many_underscores' in fields
    
    def test_field_with_empty_validation_lists(self):
        """Test that fields initialize with empty validation lists."""
        instance = (chatfield()
            .type("EmptyValidation")
            .field("unvalidated").desc("No validation rules")
            .build())
        
        field = instance._chatfield['fields']['unvalidated']
        assert field['specs']['must'] == []
        assert field['specs']['reject'] == []
        assert field['specs']['hint'] == []
        assert field['specs'].get('confidential', False) is False
        assert field['specs'].get('conclude', False) is False
    
    def test_field_with_duplicate_validation_rules(self):
        """Test fields with duplicate validation rules (should keep all)."""
        instance = (chatfield()
            .type("DuplicateRules")
            .field("field")
                .desc("Test field")
                .must("be specific")
                .must("be specific")  # Duplicate
                .hint("think carefully")
                .hint("think carefully")  # Duplicate
            .build())
        
        field_specs = instance._chatfield['fields']['field']['specs']
        # Builder maintains all rules, even duplicates
        assert field_specs['must'].count("be specific") == 2
        assert field_specs['hint'].count("think carefully") == 2
    
    def test_field_with_mixed_transformation_types(self):
        """Test field with many different transformation types."""
        instance = (chatfield()
            .type("MixedTransforms")
            .field("complex")
                .desc("Complex field")
                .as_int()
                .as_float()
                .as_bool()
                .as_percent()
                .as_lang.fr()
                .as_lang.de()
                .as_str.uppercase("UPPERCASE")
                .as_bool.positive("True if positive")
                .as_one.priority("low", "medium", "high")
            .build())
        
        casts = instance._chatfield['fields']['complex']['casts']
        # Should have all transformations
        assert 'as_int' in casts
        assert 'as_float' in casts
        assert 'as_bool' in casts
        assert 'as_percent' in casts
        assert 'as_lang_fr' in casts
        assert 'as_lang_de' in casts
        assert 'as_str_uppercase' in casts
        assert 'as_bool_positive' in casts
        assert 'as_one_priority' in casts
    
    def test_field_value_initialization(self):
        """Test that field values are properly initialized to None."""
        instance = (chatfield()
            .type("InitTest")
            .field("field1").desc("First")
            .field("field2").desc("Second")
            .field("field3").desc("Third")
            .build())
        
        for field_name in ['field1', 'field2', 'field3']:
            assert instance._chatfield['fields'][field_name]['value'] is None
            # Accessing via attribute should also return None
            assert getattr(instance, field_name) is None
    
    def test_field_collection_state_tracking(self):
        """Test tracking which fields have been collected."""
        instance = (chatfield()
            .type("StateTest")
            .field("collected").desc("Will be collected")
            .field("uncollected").desc("Won't be collected")
            .build())
        
        # Initially not done
        assert instance._done is False
        
        # Collect one field
        instance._chatfield['fields']['collected']['value'] = {
            'value': 'test data',
            'context': 'User provided this',
            'as_quote': 'test data'
        }
        
        # Still not done (one field uncollected)
        assert instance._done is False
        assert instance.collected == 'test data'
        assert instance.uncollected is None
        
        # Collect second field
        instance._chatfield['fields']['uncollected']['value'] = {
            'value': 'more data',
            'context': 'User provided this too',
            'as_quote': 'more data'
        }
        
        # Now done
        assert instance._done is True
        assert instance.uncollected == 'more data'
    
    def test_field_with_multiline_descriptions(self):
        """Test fields with multiline descriptions."""
        multiline = """This is a multiline description.
        It has multiple lines.
        And some indentation.
        And continues here."""
        
        instance = (chatfield()
            .type("MultilineDesc")
            .field("field").desc(multiline)
            .build())
        
        assert instance._chatfield['fields']['field']['desc'] == multiline
        assert '\n' in instance._chatfield['fields']['field']['desc']
    
    def test_field_specs_structure(self):
        """Test the complete structure of field specs."""
        instance = (chatfield()
            .type("SpecsTest")
            .field("complete")
                .desc("Complete field")
                .must("requirement 1")
                .must("requirement 2")
                .reject("avoid this")
                .hint("helpful tip")
                .confidential()
            .build())
        
        specs = instance._chatfield['fields']['complete']['specs']
        
        # Check all spec categories exist
        assert 'must' in specs
        assert 'reject' in specs
        assert 'hint' in specs
        assert 'confidential' in specs
        
        # Check spec values
        assert isinstance(specs['must'], list)
        assert isinstance(specs['reject'], list)
        assert isinstance(specs['hint'], list)
        assert isinstance(specs['confidential'], bool)
        
        assert len(specs['must']) == 2
        assert len(specs['reject']) == 1
        assert len(specs['hint']) == 1
        assert specs['confidential'] is True