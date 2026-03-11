import logging
import colorlog

logging.getLogger().handlers.clear()

handler = colorlog.StreamHandler()

formatter = colorlog.ColoredFormatter(
    "%(log_color)s%(levelname)s%(reset)s | %(asctime)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    log_colors={
        "DEBUG": "cyan",
        "INFO": "green",
        "WARNING": "yellow",
        "ERROR": "red",
        "CRITICAL": "bold_red",
    },
)

handler.setFormatter(formatter)

logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(handler)


for lib in [
    "httpx",
    "urllib3",
    "google_genai",
    "telethon",
    "uvicorn",
    "uvicorn.error",
    "uvicorn.access",
]:
    logging.getLogger(lib).setLevel(logging.WARNING)
