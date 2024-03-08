"""Flask configuration."""
from os import environ, makedirs

from typing import Optional

class Config():
    """Base configuration"""

    SECRET_KEY = environ.get('SECRET_KEY')

    # Non-configurable settings
    TESTING = False

    @staticmethod
    def env_get(name: str, default: Optional[str] = None) -> str:
        """Get enviromental variable by name. If not found, return
        default if set, otherwise raise ValueError."""
        value = environ.get(name)
        if value is not None:
            return value
        if default is None:
            raise ValueError(f"Enviromental variable {name} must be set")
        return default

    def __init__(self):
        """Set database uri and external urls for backend and client."""
        port = self.env_get('FLASK_RUN_PORT', str(5001))


class ProductionConfig(Config):
    pass


class DevelopmentConfig(Config):
    """Enables debug mode, reload on change."""
    FLASK_ENV = 'development'


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True

    def __init__(self):
        """Override defailt init."""
        pass
