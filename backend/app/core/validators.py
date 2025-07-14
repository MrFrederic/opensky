"""
Universal validators for Pydantic models to handle common data transformations.
"""
from typing import Any, Optional, get_origin, get_args
from pydantic import field_validator
from datetime import date
import inspect


class EmptyStrToNoneMixin:
    """
    Mixin class that provides automatic empty string to None conversion
    for all optional string and date fields.
    """
    
    @field_validator('*', mode='before')
    @classmethod
    def convert_empty_strings_to_none(cls, v: Any, info) -> Any:
        """
        Universal validator that converts empty strings to None for optional fields.
        This works for any field that is Optional in the model.
        """
        if isinstance(v, str) and v.strip() == '':
            # Check if the field is optional by looking at the model fields
            field_name = info.field_name
            if field_name and hasattr(cls, 'model_fields'):
                field_info = cls.model_fields.get(field_name)
                if field_info and hasattr(field_info, 'annotation'):
                    annotation = field_info.annotation
                    # Check if it's Optional (Union with NoneType)
                    origin = get_origin(annotation)
                    if origin is not None:
                        args = get_args(annotation)
                        # Check if None is in the union args (meaning it's Optional)
                        if type(None) in args:
                            return None
        return v
