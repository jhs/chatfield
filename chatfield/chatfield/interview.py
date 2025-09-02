"""Base Interview class for Chatfield - a simple data container."""

import copy
from typing import Dict, Any, Optional


class FieldProxy(str):
    """A string subclass that provides access to field transformations."""
    
    def __new__(cls, value: str, field_data: Dict[str, Any]):
        instance = str.__new__(cls, value)
        instance._field_data = field_data
        return instance
    
    def __getattr__(self, name: str):
        """Access transformation values like as_int, as_lang_fr, etc."""
        if name.startswith('_'):
            raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")
        
        # Look for the transformation in the field's value dict
        value_dict = self._field_data.get('value', {})
        if name in value_dict:
            return value_dict[name]
        
        # If not found, raise AttributeError
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")


class Interview:
    """Simple data container for interview data with field access via properties.
    
    The Interview class is just a wrapper around the _chatfield dict structure.
    All field access is handled through __getattr__ which returns FieldProxy instances.
    """
    
    def __init__(self, chatfield: Optional[Dict[str, Any]] = None):
        """Initialize with a chatfield data structure.
        
        Args:
            chatfield: The complete chatfield dict with type, desc, roles, and fields.
                      If None, creates an empty structure.
        """
        if chatfield is None:
            chatfield = {
                'type': '',
                'desc': '',
                'roles': {
                    'alice': {'type': None, 'traits': []},
                    'bob': {'type': None, 'traits': []}
                },
                'fields': {}
            }
        self._chatfield = chatfield
    
    def __getattr__(self, name: str):
        """Access fields as attributes, returning FieldProxy instances."""
        # Don't intercept private attributes or methods
        if name.startswith('_'):
            raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")
        
        # Check if it's a field
        if name in self._chatfield['fields']:
            field_data = self._chatfield['fields'][name]
            value_data = field_data.get('value')
            
            if value_data is None:
                return None
            
            # Return a FieldProxy with the value and full field data
            return FieldProxy(value_data.get('value', ''), field_data)
        
        # Not a field - raise AttributeError
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")
    
    @property
    def _done(self) -> bool:
        """Check if all fields have been collected."""
        for field in self._chatfield['fields'].values():
            if field.get('value') is None:
                return False
        return True
    
    def _name(self) -> str:
        """Return the interview type name."""
        return self._chatfield.get('type', '')
    
    def _fields(self) -> list:
        """Return the list of field names."""
        return list(self._chatfield['fields'].keys())
    
    def _alice_role_name(self) -> str:
        """Return alice's role name."""
        return self._chatfield['roles']['alice'].get('type') or 'Alice'
    
    def _bob_role_name(self) -> str:
        """Return bob's role name."""
        return self._chatfield['roles']['bob'].get('type') or 'Bob'
    
    def _alice_role(self) -> Dict[str, Any]:
        """Return alice's role configuration."""
        return self._chatfield['roles']['alice']
    
    def _bob_role(self) -> Dict[str, Any]:
        """Return bob's role configuration."""
        return self._chatfield['roles']['bob']
    
    def _get_chat_field(self, name: str) -> Dict[str, Any]:
        """Get a field's chatfield data."""
        return self._chatfield['fields'].get(name, {'value': None})
    
    def _copy_from(self, other: 'Interview'):
        """Copy data from another Interview instance."""
        self._chatfield = copy.deepcopy(other._chatfield)
    
    def _pretty(self) -> str:
        """Return a pretty string representation of the collected data."""
        lines = [f"{self._name()}:"]
        
        for name, field in self._chatfield['fields'].items():
            value_data = field.get('value')
            if value_data:
                value = value_data.get('value', 'None')
                lines.append(f"  {name}: {value}")
                
                # Show transformations if present
                for key, val in value_data.items():
                    if key not in ('value', 'context', 'as_quote'):
                        lines.append(f"    {key}: {val}")
        
        return '\n'.join(lines)
    
    def model_dump(self, **kwargs) -> Dict[str, Any]:
        """Return a deep copy of the chatfield data (for LangGraph compatibility)."""
        return copy.deepcopy(self._chatfield)