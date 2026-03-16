import logger  # logger config
import env
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import bot
import bot.bothandles as bothandles  # register
import tmdb
import logging
from datetime import datetime, timezone
from stream import router as stream_router


@asynccontextmanager
async def lifespan(app: FastAPI):

    logging.info("Starting Telethon bot")

    await bot.startbot()

    yield

    logging.info("Stopping Telethon bot")
    await bot.client.disconnect()


start_time = datetime.now(timezone.utc)
app = FastAPI(lifespan=lifespan)

origins = [o.strip() for o in env.FRONTEND_URL.split(",")]
logging.info(f"CORS origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stream_router)


@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    now = datetime.now(timezone.utc)
    uptime = now - start_time

    return {
        "status": "running",
        "uptime": str(uptime).split(".")[0],  # removes microseconds
        "uptime_seconds": int(uptime.total_seconds()),
    }


@app.api_route("/tmdb/{full_path:path}")
async def tmdb_proxy(full_path: str, request: Request):
    params = dict(request.query_params)
    return await tmdb.queryv3(full_path, params)
