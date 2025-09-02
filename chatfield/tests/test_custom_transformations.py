"""
Test custom transformations demonstrating feature parity.
This test file shows how Python supports dynamic custom transformations.
"""

import pytest
from chatfield import Interview, chatfield
from chatfield.decorators import as_int, as_bool, as_lang, as_str
from chatfield.interview import FieldProxy


class TestCustomTransformations:
    """Test suite demonstrating custom transformation capabilities."""

    def test_basic_as_int_transformation(self):
        """Test basic .as_int() transformation."""
        
        # Using builder API
        form = (chatfield()
            .field('favorite').desc('Your favorite number')
            .as_int()
            .build())
        
        # Check the field metadata
        assert 'favorite' in form._chatfield['fields']
        field_meta = form._chatfield['fields']['favorite']
        assert 'as_int' in field_meta.get('casts', {})
        
        # Simulate LLM having provided the value with transformations
        form._chatfield['fields']['favorite']['value'] = {
            'value': 'forty-two',
            'as_int': 42,
            'context': 'User said forty-two',
            'as_quote': 'forty-two'
        }
        
        # Access the transformed values through FieldProxy
        assert form.favorite == 'forty-two'
        assert form.favorite.as_int == 42

    def test_custom_as_int_neg1_transformation(self):
        """Test custom .as_int.neg1('This is always -1') transformation."""
        
        # Using builder API with custom transformation
        form = (chatfield()
            .field('number').desc('Enter a number')
            .as_int()
            .as_int.neg1('This is always -1')
            .build())
        
        # Check that the decorator created the custom transformation
        field_meta = form._chatfield['fields']['number']
        assert 'as_int' in field_meta.get('casts', {})
        assert 'as_int_neg1' in field_meta.get('casts', {})
        
        # Simulate LLM having provided the value with transformations
        form._chatfield['fields']['number']['value'] = {
            'value': 'five',
            'as_int': 5,
            'as_int_neg1': -1,
            'context': 'User said five',
            'as_quote': 'five'
        }
        
        # Access both standard and custom transformations
        assert form.number == 'five'
        assert form.number.as_int == 5
        assert form.number.as_int_neg1 == -1

    def test_multiple_custom_transformations(self):
        """Test multiple custom transformations on the same field."""
        
        # Using builder API with multiple custom transformations
        form = (chatfield()
            .field('value').desc('Enter a value')
            .as_int()
            .as_int.neg1('This is always -1')
            .as_int.doubled('Double the integer value')
            .as_int.squared('Square the integer value')
            .as_bool.even('True if the integer is even')
            .as_lang.fr('French translation')
            .as_str.uppercase('Convert to uppercase')
            .build())
        
        # Check that all custom transformations were created
        field_meta = form._chatfield['fields']['value']
        casts = field_meta.get('casts', {})
        assert 'as_int' in casts
        assert 'as_int_neg1' in casts
        assert 'as_int_doubled' in casts
        assert 'as_int_squared' in casts
        assert 'as_bool_even' in casts
        assert 'as_lang_fr' in casts
        assert 'as_str_uppercase' in casts
        
        # Simulate LLM having provided all transformations
        form._chatfield['fields']['value']['value'] = {
            'value': 'six',
            'as_int': 6,
            'as_int_neg1': -1,
            'as_int_doubled': 12,
            'as_int_squared': 36,
            'as_bool_even': True,
            'as_lang_fr': 'six',
            'as_str_uppercase': 'SIX',
            'context': 'User said six',
            'as_quote': 'six'
        }
        
        # Verify all transformations are accessible
        assert form.value == 'six'
        assert form.value.as_int == 6
        assert form.value.as_int_neg1 == -1
        assert form.value.as_int_doubled == 12
        assert form.value.as_int_squared == 36
        assert form.value.as_bool_even == True
        assert form.value.as_lang_fr == 'six'
        assert form.value.as_str_uppercase == 'SIX'

    def test_dynamic_transformation_names(self):
        """Test that transformation names follow the pattern: as_{type}_{name}."""
        
        # Using builder API with custom transformation names
        form = (chatfield()
            .field('test').desc('Test field')
            .as_int.custom_name('Custom transformation')
            .as_bool.is_positive('Check if positive')
            .as_lang.esperanto('Translate to Esperanto')
            .build())
        
        field_meta = form._chatfield['fields']['test']
        
        # Check the transformation names follow the expected pattern
        casts = field_meta.get('casts', {})
        
        assert 'as_int_custom_name' in casts
        assert 'as_bool_is_positive' in casts
        assert 'as_lang_esperanto' in casts

    def test_transformation_with_custom_prompt(self):
        """Test custom transformations with specific prompts."""
        
        # Using builder API with custom prompts
        form = (chatfield()
            .field('rating').desc('Rate from 1-10')
            .as_int()
            .as_int.percentage('Convert to percentage (multiply by 10)')
            .as_bool.high('True if rating is 7 or higher')
            .build())
        
        # Check the prompts were stored
        field_meta = form._chatfield['fields']['rating']
        casts = field_meta.get('casts', {})
        assert casts['as_int_percentage']['prompt'] == 'Convert to percentage (multiply by 10)'
        assert casts['as_bool_high']['prompt'] == 'True if rating is 7 or higher'
        
        # Simulate LLM having provided transformations
        form._chatfield['fields']['rating']['value'] = {
            'value': 'eight',
            'as_int': 8,
            'as_int_percentage': 80,
            'as_bool_high': True,
            'context': 'User said eight',
            'as_quote': 'eight'
        }
        
        assert form.rating == 'eight'
        assert form.rating.as_int == 8
        assert form.rating.as_int_percentage == 80
        assert form.rating.as_bool_high == True

    def test_hasattr_for_transformations(self):
        """Test that hasattr works correctly for checking transformation existence."""
        
        # Using builder API
        form = (chatfield()
            .field('data').desc('Enter data')
            .as_int()
            .as_int.special('Special transformation')
            .build())
        
        # Simulate LLM having provided transformations
        form._chatfield['fields']['data']['value'] = {
            'value': 'test',
            'as_int': 123,
            'as_int_special': -999,
            'context': 'User said test',
            'as_quote': 'test'
        }
        
        # Test hasattr for existing transformations
        assert hasattr(form.data, 'as_int')
        assert hasattr(form.data, 'as_int_special')
        
        # Test hasattr for non-existing transformations
        assert not hasattr(form.data, 'as_int_nonexistent')
        assert not hasattr(form.data, 'as_float')  # Not defined


if __name__ == "__main__":
    pytest.main([__file__, "-v"])