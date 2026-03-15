from dotenv import load_dotenv
import os

load_dotenv()


def getenv(key: str, default: str = None):
    return os.getenv(key, default)


FRONTEND_URL = os.getenv("FRONTEND_URL", "")
