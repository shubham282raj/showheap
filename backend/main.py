import logger  # logger config
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import bot
import bot.bothandles as bothandles  # register
import env
import tmdb
import logging
from stream import router as stream_router


@asynccontextmanager
async def lifespan(app: FastAPI):

    logging.info("Starting Telethon bot")

    await bot.startbot()

    yield

    logging.info("Stopping Telethon bot")
    await bot.client.disconnect()


app = FastAPI(lifespan=lifespan)
app.include_router(stream_router)

origins = [env.getenv("FRONTEND_URL")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "running"}


@app.api_route("/tmdb/{full_path:path}", methods=["GET"])
async def tmdb_proxy(full_path: str, request: Request):
    params = dict(request.query_params)
    return await tmdb.queryv3(full_path, params)
