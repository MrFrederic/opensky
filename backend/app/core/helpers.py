import requests
from typing import Optional


def get_bot_username_from_token(bot_token: str) -> Optional[str]:
    """
    Extract the Telegram bot username from its token.
    
    Args:
        bot_token (str): The Telegram bot token (e.g., '123456789:ABCdefGhIJKlmnOPQRstUVwxyZ')
    
    Returns:
        Optional[str]: Bot username with @ prefix (e.g., '@my_bot_name') or None if the token is invalid
    
    Example:
        >>> get_bot_username_from_token('123456789:ABCdefGhIJKlmnOPQRstUVwxyZ')
        '@my_bot_name'
    """
    try:
        # Make a request to the Telegram Bot API to get bot info
        response = requests.get(f"https://api.telegram.org/bot{bot_token}/getMe")
        response_data = response.json()
        
        if response.status_code == 200 and response_data.get("ok"):
            username = response_data.get("result", {}).get("username")
            if username:
                return f"@{username}"
        return None
    except Exception:
        # Return None if any exception occurs (network error, invalid token format, etc.)
        return None