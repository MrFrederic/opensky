# CRUD module
from .base import CRUDBase
from .users import user
from .dictionaries import dictionary, dictionary_value

__all__ = [
    "CRUDBase",
    "user",
    "dictionary",
    "dictionary_value"
]
