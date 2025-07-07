from pydantic import BaseModel


class BotUsername(BaseModel):
    username: str
