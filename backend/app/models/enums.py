# This file defines all enums for the models package.
from enum import Enum

class UserRole(str, Enum):
    TANDEM_JUMPER = "tandem_jumper"
    AFF_STUDENT = "aff_student"
    SPORT_PAID = "sport_paid"
    SPORT_FREE = "sport_free"
    TANDEM_INSTRUCTOR = "tandem_instructor"
    AFF_INSTRUCTOR = "aff_instructor"
    ADMINISTRATOR = "administrator"
    
class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"
