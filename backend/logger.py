import logging
import colorlog


logging.basicConfig(
    format="[%(levelname)s %(asctime)s] %(name)s: %(message)s", level=logging.INFO
)

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


handler = colorlog.StreamHandler()
formatter = colorlog.ColoredFormatter(
    "%(log_color)s%(levelname)s%(reset)s | %(asctime)s | %(message)s",
    log_colors={
        "DEBUG": "cyan",
        "INFO": "green",
        "WARNING": "yellow",
        "ERROR": "red",
        "CRITICAL": "bold_red",
    },
)
handler.setFormatter(formatter)
logger = colorlog.getLogger()
logger.addHandler(handler)
