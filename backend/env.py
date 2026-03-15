from dotenv import load_dotenv
import os
import sys
import logging
import json


load_dotenv()


def getenv(key: str, default: str = None, required: bool = False):
    value = os.getenv(key, default)

    if required and not value:
        logging.error(f"{key} env variable is required")
        sys.exit(1)

    return value or default


def load_firebase_service_json():
    # JSON stored directly in env variable
    firebase_json = os.getenv("FIREBASE_SERVICE_JSON")
    if firebase_json:
        return json.loads(firebase_json)

    # fallback for local dev
    if os.path.exists("showheap-service.json"):
        return "showheap-service.json"

    logging.error("Firebase credentials missing")
    logging.error("Either:")
    logging.error("  - Set FIREBASE_SERVICE_JSON env variable")
    logging.error("  - Add 'showheap-service.json' file for local dev")
    sys.exit(1)


# required
API_ID = getenv("API_ID", required=True)
API_HASH = getenv("API_HASH", required=True)
BOT_TOKEN = getenv("BOT_TOKEN", required=True)
TGFS_PROXY_URL = getenv("TGFS_PROXY_URL", required=True)
FILE_LOG_CHANNEL_ID = getenv("FILE_LOG_CHANNEL_ID", required=True)
TMDB_ACCESS_TOKEN = getenv("TMDB_ACCESS_TOKEN", required=True)
GEMINI_API_KEY = getenv("GEMINI_API_KEY", required=True)
FIREBASE_SERVICE_JSON = load_firebase_service_json()

# optional
FRONTEND_URL = getenv("FRONTEND_URL", default=None)
WF_LOG_CHANNEL_ID = getenv("WF_LOG_CHANNEL_ID", default="0")
PORT = getenv("PORT", default="8000")
BASE_URL = getenv("BASE_URL", default=f"http://127.0.0.1:{PORT}")
JWT_ALGORITHM = getenv("JWT_ALGORITHM", default="HS256")
JWT_SECRET_KEY = getenv("JWT_SECRET_KEY")
FPE_SECRET = getenv("FPE_SECRET")
