from dotenv import load_dotenv
import os

load_dotenv()


def getenv(key: str, default: str = None, required: bool = False):
    if not key and required:
        raise Exception(f"{key} env variables required")
    return os.getenv(key, default)


# required
API_ID = getenv("API_ID", required=True)
API_HASH = getenv("API_HASH", required=True)
BOT_TOKEN = getenv("BOT_TOKEN", required=True)
FILE_LOG_CHANNEL_ID = getenv("FILE_LOG_CHANNEL_ID", required=True)
TMDB_ACCESS_TOKEN = getenv("TMDB_ACCESS_TOKEN", required=True)
GEMINI_API_KEY = getenv("GEMINI_API_KEY", required=True)

# optional
FRONTEND_URL = getenv("FRONTEND_URL", default=None)
WF_LOG_CHANNEL_ID = getenv("WF_LOG_CHANNEL_ID", default="0")
PORT = getenv("PORT", default="8000")
BASE_URL = getenv("BASE_URL", default=f"http://127.0.0.1:{PORT}")
JWT_ALGORITHM = getenv("JWT_ALGORITHM", default="HS256")
JWT_SECRET_KEY = getenv(
    "JWT_SECRET_KEY",
    default="3e4f7f9c7d89c6c7d7e84b20c6a8a0e2e9b9d7e4f92d6b4f7a6b1e7f5c2a3b4c",
)
FPE_SECRET = getenv("FPE_SECRET", default="abcd")
