"""Unit tests for Chatfield builder pattern API.

This file focuses on builder-specific behavior like method chaining,
builder API surface, and builder-unique features. Tests for the
resulting Interview instances are in test_interview.py.
"""

import pytest
from chatfield import chatfield


class TestBuilderAPI:
    """Test builder pattern API and method chaining."""
    
    def test_builder_method_chaining(self):
        """Test that builder methods return appropriate builders for chaining."""
        builder = chatfield()
        
        # Main builder methods return the builder
        assert builder.type("Test") is builder
        assert builder.desc("Description") is builder
        
        # Field returns a FieldBuilder (different context)
        field_builder = builder.field("test")
        from chatfield.builder import FieldBuilder
        assert isinstance(field_builder, FieldBuilder)
        
        # Role builders return RoleBuilder
        alice_builder = builder.alice()
        bob_builder = builder.bob()
        from chatfield.builder import RoleBuilder
        assert isinstance(alice_builder, RoleBuilder)
        assert isinstance(bob_builder, RoleBuilder)
    
    def test_builder_field_context_switching(self):
        """Test switching between field contexts in builder."""
        instance = (chatfield()
            .type("ContextTest")
            .field("field1")
                .desc("First field")
                .must("rule1")
            .field("field2")  # Switch to new field
                .desc("Second field")
                .must("rule2")
            .field("field3")
                .desc("Third field")
            .build())
        
        meta = instance._chatfield
        assert "rule1" in meta['fields']['field1']['specs']['must']
        assert "rule2" in meta['fields']['field2']['specs']['must']
        assert len(meta['fields']) == 3
    
    def test_builder_role_context_switching(self):
        """Test switching between role and field contexts."""
        instance = (chatfield()
            .type("RoleFieldTest")
            .alice()
                .type("Interviewer")
                .trait("patient")
            .field("question")  # Switch from role to field
                .desc("Your question")
            .bob()  # Switch to different role
                .type("Candidate")
            .field("answer")  # Back to fields
                .desc("Your answer")
            .build())
        
        meta = instance._chatfield
        assert meta['roles']['alice']['type'] == "Interviewer"
        assert meta['roles']['bob']['type'] == "Candidate"
        assert 'question' in meta['fields']
        assert 'answer' in meta['fields']
    
    def test_builder_sub_attribute_syntax(self):
        """Test builder's sub-attribute syntax for transformations."""
        instance = (chatfield()
            .type("SubAttrTest")
            .field("data")
                .desc("Data field")
                .as_lang.fr()  # Sub-attribute syntax
                .as_lang.es()
                .as_bool.even("True if even")
                .as_str.uppercase("In uppercase")
            .build())
        
        field_casts = instance._chatfield['fields']['data']['casts']
        assert 'as_lang_fr' in field_casts
        assert 'as_lang_es' in field_casts
        assert 'as_bool_even' in field_casts
        assert 'as_str_uppercase' in field_casts
    
    def test_builder_choice_syntax(self):
        """Test builder's choice cardinality syntax."""
        instance = (chatfield()
            .type("ChoiceTest")
            .field("single")
                .as_one.selection("a", "b", "c")
            .field("optional")
                .as_maybe.selection("x", "y", "z")
            .field("multiple")
                .as_multi.selection("1", "2", "3")
            .field("any_number")
                .as_any.selection("red", "green", "blue")
            .build())
        
        # Check that choice configurations are stored
        single = instance._chatfield['fields']['single']['casts'].get('as_one_selection')
        optional = instance._chatfield['fields']['optional']['casts'].get('as_maybe_selection')
        multiple = instance._chatfield['fields']['multiple']['casts'].get('as_multi_selection')
        any_num = instance._chatfield['fields']['any_number']['casts'].get('as_any_selection')
        
        if single:
            assert single['choices'] == ['a', 'b', 'c']
            assert single['null'] is False
            assert single['multi'] is False
        
        if optional:
            assert optional['null'] is True
            assert optional['multi'] is False
        
        if multiple:
            assert multiple['null'] is False
            assert multiple['multi'] is True
        
        if any_num:
            assert any_num['null'] is True
            assert any_num['multi'] is True
    
    def test_builder_special_field_methods(self):
        """Test builder's special field methods (confidential, conclude)."""
        instance = (chatfield()
            .type("SpecialFields")
            .field("secret")
                .desc("Secret data")
                .confidential()
            .field("final")
                .desc("Final rating")
                .conclude()
            .build())
        
        secret = instance._chatfield['fields']['secret']
        final = instance._chatfield['fields']['final']
        
        assert secret['specs']['confidential'] is True
        assert final['specs']['conclude'] is True
        assert final['specs']['confidential'] is True  # Conclude implies confidential
    
    def test_builder_accumulation_behavior(self):
        """Test that builder accumulates rules properly."""
        instance = (chatfield()
            .type("AccumulationTest")
            .alice()
                .trait("trait1")
                .trait("trait2")
                .trait("trait3")
            .field("field")
                .must("rule1")
                .must("rule2")
                .hint("hint1")
                .hint("hint2")
                .reject("reject1")
            .build())
        
        alice_traits = instance._chatfield['roles']['alice']['traits']
        field_specs = instance._chatfield['fields']['field']['specs']
        
        # Should accumulate all traits and rules
        assert alice_traits == ["trait1", "trait2", "trait3"]
        assert field_specs['must'] == ["rule1", "rule2"]
        assert field_specs['hint'] == ["hint1", "hint2"]
        assert field_specs['reject'] == ["reject1"]
    
    def test_builder_without_build(self):
        """Test that builder requires build() to create instance."""
        builder = chatfield().type("Test").field("field").desc("Description")
        
        # Builder itself is not an Interview
        from chatfield import Interview
        assert not isinstance(builder, Interview)
        
        # After build(), it returns an Interview
        instance = builder.build()
        assert isinstance(instance, Interview)
    
    def test_builder_reuse(self):
        """Test that builder can be reused to create multiple instances."""
        builder = (chatfield()
            .type("Template")
            .field("name").desc("Name"))
        
        # Create multiple instances from same builder
        instance1 = builder.build()
        instance2 = builder.build()
        
        # Should be different instances
        assert instance1 is not instance2
        
        # But with same structure
        assert instance1._chatfield['type'] == instance2._chatfield['type']
        assert instance1._chatfield['fields'].keys() == instance2._chatfield['fields'].keys()
        
        # Modifications to one don't affect the other
        instance1._chatfield['fields']['name']['value'] = {'value': 'test'}
        assert instance2._chatfield['fields']['name']['value'] is None