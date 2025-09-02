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
    def test_multiple_custom_transformations(self):
        """Test multiple custom transformations on the same field."""
        
        # Using builder API with multiple custom transformations
        form = (chatfield()
            .field('value')
                .desc('Enter a value')
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


if __name__ == "__main__":
    pytest.main([__file__, "-v"])