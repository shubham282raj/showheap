import env
import jwt
import datetime
import firebase
import httpx
import utils
from fastapi import HTTPException, Request, Depends, APIRouter
from fastapi.responses import StreamingResponse


PORT = int(env.getenv("PORT", "8000"))
BASE_URL = env.getenv("BASE_URL", f"http://127.0.0.1:{PORT}")
JWT_ALGORITHM = env.getenv("JWT_ALGORITHM", "HS256")
JWT_SECRET_KEY = env.getenv(
    "JWT_SECRET_KEY", "3e4f7f9c7d89c6c7d7e84b20c6a8a0e2e9b9d7e4f92d6b4f7a6b1e7f5c2a3b4c"
)


def create_stream_token(uid: str, message_id: str):
    payload = {
        "uid": uid,
        "message_id": message_id,
        "exp": datetime.datetime.now(datetime.timezone.utc)
        + datetime.timedelta(days=1),
    }

    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    return token


def verify_stream_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


router = APIRouter()
httpxclient = httpx.AsyncClient()


@router.get("/getStreamURL/{encoded_metadata_id}")
async def getStreamURL(
    encoded_metadata_id: str, request: Request, user=Depends(firebase.verify_user)
):
    metadata_id = utils.FPE.decode_string(encoded_metadata_id)
    metadata = await firebase.showDB.getMetadata(metadata_id)

    if not metadata:
        raise HTTPException(status_code=404, detail="File not found")

    message_id = metadata["message_id"]

    token = create_stream_token(uid=user["uid"], message_id=str(message_id))

    stream_url = f"{BASE_URL}/stream/{message_id}?token={token}"

    data = {
        "media_type": metadata.get("media_type"),
        "tmdb_id": metadata.get("tmdb_id"),
        "episode_code": metadata.get("episode_code"),
        "file_name": metadata.get("file_name"),
        "file_size": metadata.get("file_size"),
        "updated_at": (
            metadata.get("updated_at").isoformat()
            if metadata.get("updated_at")
            else None
        ),
    }

    return {"metadata": data, "stream_url": stream_url, "expires_in": "1 day"}


@router.get("/stream/{message_id}")
async def stream_proxy_fsb(
    message_id: str, token: str, request: Request, download: str | None = None
):
    if not token:
        raise HTTPException(status_code=403, detail="Invalid or expired token")

    payload = verify_stream_token(token)

    if not payload:
        raise HTTPException(status_code=403, detail="Invalid or expired token")

    if payload["message_id"] != message_id:
        raise HTTPException(status_code=403, detail="Token mismatch")

    headers = {}

    if "range" in request.headers:
        headers["range"] = request.headers["range"]

    # url for internal fsb
    url = f"http://127.0.0.1:{8080}/stream/{message_id}"

    req = httpxclient.build_request("GET", url, headers=headers)

    resp = await httpxclient.send(req, stream=True)

    response_headers = {"content-type": "video/mp4"}

    for h in [
        "content-length",
        "content-range",
        "accept-ranges",
        "content-disposition",
    ]:
        if h in resp.headers:
            response_headers[h] = resp.headers[h]

    if download:
        if "inline" in response_headers["content-disposition"]:
            response_headers["content-disposition"] = response_headers[
                "content-disposition"
            ].replace("inline", "attachment", 1)
        else:
            response_headers["content-disposition"] = "attachment"

    return StreamingResponse(
        resp.aiter_bytes(), status_code=resp.status_code, headers=response_headers
    )
