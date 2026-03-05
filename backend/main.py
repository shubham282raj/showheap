from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import bot
import bot.bothandles as bothandles  # register
import env
import httpx
import tmdb
import logging

# logging
logging.basicConfig(
    format="[%(levelname)s %(asctime)s] %(name)s: %(message)s", level=logging.WARNING
)


@asynccontextmanager
async def lifespan(app: FastAPI):

    print("🚀 Starting Telethon bot...")

    await bot.startbot()

    print("🤖 Telethon bot started")

    yield

    print("🛑 Stopping Telethon bot...")
    await bot.client.disconnect()


app = FastAPI(lifespan=lifespan)

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


@app.api_route("/redirect/{full_path:path}", methods=["GET"])
async def redirect_stream(full_path: str, request: Request):
    query_string = request.url.query

    target_url = f"https://tough-kipp-cloudzyy-cbe58645.koyeb.app/stream/{full_path}"

    if query_string:
        target_url += f"?{query_string}"

    return RedirectResponse(target_url, status_code=307)


@app.api_route("/tmdb/{full_path:path}", methods=["GET"])
async def tmdb_proxy(full_path: str, request: Request):
    # Copy query params and add API key
    params = dict(request.query_params)

    return await tmdb.queryv3(full_path, params)


@app.api_route("/stream/{messageId}", methods=["GET"])
async def proxy_stream(messageId: str, request: Request):
    fileHash = request.query_params.get("hash")

    if not fileHash:
        raise HTTPException(status_code=400, detail="hash missing")

    PROXY_BASE_URL = env.getenv("PROXY_BASE_URL")
    target_url = f"{PROXY_BASE_URL}/stream/{messageId}?hash={fileHash}"

    headers = {}
    if "range" in request.headers:
        headers["range"] = request.headers["range"]

    client = httpx.AsyncClient(timeout=None)
    req = client.build_request("GET", target_url, headers=headers)

    try:
        upstream_resp = await client.send(req, stream=True)
    except Exception as e:
        await client.aclose()
        raise HTTPException(
            status_code=502, detail="Error connecting to upstream server"
        )

    async def stream():
        try:
            async for chunk in upstream_resp.aiter_bytes():
                yield chunk
        finally:
            await upstream_resp.aclose()
            await client.aclose()

    # Extract crucial headers, but handle Content-Type manually
    response_headers = {}
    crucial_headers = ["content-range", "accept-ranges", "content-length"]

    for header in crucial_headers:
        if header in upstream_resp.headers:
            response_headers[header] = upstream_resp.headers[header]

    # --- ENFORCE VIDEO CONTENT TYPE ---
    upstream_content_type = upstream_resp.headers.get("content-type", "")

    # If the upstream already says it's a video (e.g., video/webm, video/mp4), keep it.
    # Otherwise, force it to video/mp4 (a highly compatible default).
    if upstream_content_type.startswith("video/"):
        final_media_type = upstream_content_type
    else:
        final_media_type = "video/mp4"

    # Explicitly set the forced content type in the response headers
    response_headers["content-type"] = final_media_type

    return StreamingResponse(
        stream(),
        status_code=upstream_resp.status_code,
        headers=response_headers,
        media_type=final_media_type,
    )
