"""Tests for FieldProxy functionality."""

import pytest
from chatfield import chatfield
from chatfield.interview import FieldProxy


class TestFieldProxyBasics:
    """Test FieldProxy basic functionality."""
    
    def test_field_proxy_as_string(self):
        """Test that FieldProxy behaves as a string."""
        interview = (chatfield()
            .type("TestInterview")
            .field("name").desc("Your name")
            .build())
        interview._chatfield['fields']['name']['value'] = {
            'value': 'John Doe',
            'context': 'User provided their name',
            'as_quote': 'John Doe'
        }
        
        name = interview.name
        
        assert isinstance(name, str)
        assert isinstance(name, FieldProxy)
        assert name == 'John Doe'
        assert name.upper() == 'JOHN DOE'
        assert name.lower() == 'john doe'
        assert len(name) == 8
    
    def test_field_proxy_string_methods(self):
        """Test that FieldProxy supports all string methods."""
        interview = (chatfield()
            .type("TestInterview")
            .field("text").desc("Some text")
            .build())
        interview._chatfield['fields']['text']['value'] = {
            'value': '  Hello World  ',
            'context': 'User input',
            'as_quote': 'Hello World'
        }
        
        text = interview.text
        
        # Test various string methods
        assert text.strip() == 'Hello World'
        assert text.startswith('  Hello')
        assert text.endswith('World  ')
        assert text.replace('Hello', 'Hi') == '  Hi World  '
        assert 'World' in text
        assert text.find('World') == 8
        assert text.split() == ['Hello', 'World']
    
    def test_field_proxy_transformations(self):
        """Test accessing transformations via FieldProxy."""
        interview = (chatfield()
            .type("TestInterview")
            .field("number")
                .desc("A number")
                .as_int()
                .as_lang('fr')
                .as_bool('even', "True if even")
            .build())
        interview._chatfield['fields']['number']['value'] = {
            'value': '42',
            'context': 'User said forty-two',
            'as_quote': 'forty-two',
            'as_int': 42,
            'as_lang_fr': 'quarante-deux',
            'as_bool_even': True
        }
        
        number = interview.number
        
        assert number == '42'
        assert number.as_int == 42
        assert number.as_lang_fr == 'quarante-deux'
        assert number.as_bool_even is True
        assert number.context == 'User said forty-two'
        assert number.as_quote == 'forty-two'
    
    def test_field_proxy_missing_transformation(self):
        """Test accessing non-existent transformation returns None for missing keys."""
        interview = (chatfield()
            .type("TestInterview")
            .field("name").desc("Your name")
            .build())
        interview._chatfield['fields']['name']['value'] = {
            'value': 'test',
            'context': 'N/A',
            'as_quote': 'test'
        }
        
        name = interview.name

        # FieldProxy.__getattr__ rasises AttributeError for missing keys.
        # assert name.as_int is None
        # assert name.as_float is None
        # assert name.non_existent_transformation is None
        with pytest.raises(AttributeError):
            _ = name.as_int
        with pytest.raises(AttributeError):
            _ = name.as_float
        with pytest.raises(AttributeError):   
            _ = name.non_existent_transformation


class TestFieldProxyWithComplexTransformations:
    """Test FieldProxy with complex transformation scenarios."""
    
    def test_multiple_custom_transformations(self):
        """Test field with multiple custom transformations."""
        interview = (chatfield()
            .type("ComplexInterview")
            .field("data")
                .desc("Complex data")
                .as_int()
                .as_int('doubled', 'Double the value')
                .as_int('squared', 'Square the value')
                .as_str('reversed', 'Reverse the string')
                .as_bool('valid', 'Is valid')
            .build())
        
        interview._chatfield['fields']['data']['value'] = {
            'value': '5',
            'context': 'User entered five',
            'as_quote': 'five',
            'as_int': 5,
            'as_int_doubled': 10,
            'as_int_squared': 25,
            'as_str_reversed': '5',
            'as_bool_valid': True
        }
        
        data = interview.data
        
        # Base value is string
        assert data == '5'
        assert isinstance(data, str)
        
        # All transformations accessible
        assert data.as_int == 5
        assert data.as_int_doubled == 10
        assert data.as_int_squared == 25
        assert data.as_str_reversed == '5'
        assert data.as_bool_valid is True
    
    def test_field_proxy_with_choices(self):
        """Test FieldProxy with choice cardinality transformations."""
        interview = (chatfield()
            .type("ChoiceInterview")
            .field("colors")
                .desc("Favorite colors")
                .as_multi('selection', "red", "green", "blue")
            .build())
        
        interview._chatfield['fields']['colors']['value'] = {
            'value': 'red and blue',
            'context': 'User selected multiple colors',
            'as_quote': 'I like red and blue',
            'as_multi_selection': ['red', 'blue']
        }
        
        colors = interview.colors
        
        assert colors == 'red and blue'
        assert colors.as_multi_selection == ['red', 'blue']
        assert isinstance(colors.as_multi_selection, list)
    
    def test_field_proxy_none_value(self):
        """Test FieldProxy when field value is None."""
        interview = (chatfield()
            .type("TestInterview")
            .field("optional").desc("Optional field")
            .build())
        
        # Field not yet collected
        optional = interview.optional
        assert optional is None
        
        # Bob-defined "N/A" answer
        interview._chatfield['fields']['optional']['value'] = {
            'value': 'Skip please',
            'context': 'User skipped',
            'as_quote': ''
        }
        
        optional = interview.optional
        assert optional is not None


class TestFieldProxyEdgeCases:
    """Test FieldProxy edge cases and special behaviors."""
    
    def test_field_proxy_equality(self):
        """Test FieldProxy equality comparisons."""
        interview = (chatfield()
            .type("TestInterview")
            .field("field1").desc("Field 1")
            .field("field2").desc("Field 2")
            .build())
        
        interview._chatfield['fields']['field1']['value'] = {
            'value': 'test',
            'context': 'N/A',
            'as_quote': 'test'
        }
        interview._chatfield['fields']['field2']['value'] = {
            'value': 'test',
            'context': 'N/A',
            'as_quote': 'test'
        }
        
        field1 = interview.field1
        field2 = interview.field2
        
        # Both are equal as strings
        assert field1 == field2
        assert field1 == 'test'
        assert field2 == 'test'
        
        # But they are different FieldProxy instances
        assert field1 is not field2
    
    def test_field_proxy_concatenation(self):
        """Test FieldProxy string concatenation."""
        interview = (chatfield()
            .type("TestInterview")
            .field("first").desc("First name")
            .field("last").desc("Last name")
            .build())
        
        interview._chatfield['fields']['first']['value'] = {
            'value': 'John',
            'context': 'N/A',
            'as_quote': 'John'
        }
        interview._chatfield['fields']['last']['value'] = {
            'value': 'Doe',
            'context': 'N/A',
            'as_quote': 'Doe'
        }
        
        first = interview.first
        last = interview.last
        
        # String concatenation should work
        full_name = first + ' ' + last
        assert full_name == 'John Doe'
        assert isinstance(full_name, str)
        assert not isinstance(full_name, FieldProxy)  # Result is plain string
    
    def test_field_proxy_format(self):
        """Test FieldProxy in format strings."""
        interview = (chatfield()
            .type("TestInterview")
            .field("name").desc("Name")
            .field("age")
                .desc("Age")
                .as_int()
            .build())
        
        interview._chatfield['fields']['name']['value'] = {
            'value': 'Alice',
            'context': 'N/A',
            'as_quote': 'Alice'
        }
        interview._chatfield['fields']['age']['value'] = {
            'value': '30',
            'context': 'N/A',
            'as_quote': 'thirty',
            'as_int': 30
        }
        
        name = interview.name
        age = interview.age
        
        # Should work in format strings
        result = f"{name} is {age} years old"
        assert result == "Alice is 30 years old"
        
        # Should work with .format()
        result = "{} is {} years old".format(name, age)
        assert result == "Alice is 30 years old"
        
        # Transformation access in f-strings
        result = f"{name} is {age.as_int} years old"
        assert result == "Alice is 30 years old"