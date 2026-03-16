import env
import jwt
import datetime
import firebase
import httpx
import utils
from fastapi import HTTPException, Request, Depends, APIRouter
from fastapi.responses import StreamingResponse, Response


PORT = int(env.PORT)
BASE_URL = env.BASE_URL
JWT_ALGORITHM = env.JWT_ALGORITHM
JWT_SECRET_KEY = env.JWT_SECRET_KEY


def create_stream_token(uid: str, message_id: str):
    if not JWT_SECRET_KEY:
        return None

    payload = {
        "uid": uid,
        "message_id": message_id,
        "exp": datetime.datetime.now(datetime.timezone.utc)
        + datetime.timedelta(days=1),
    }

    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    return token


def verify_stream_token(token: str):
    if not JWT_SECRET_KEY:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


router = APIRouter()
httpxclient = httpx.AsyncClient(
    timeout=httpx.Timeout(connect=30.0, read=None, write=300.0, pool=30.0)
)


@router.get("/ping-tgfs")
async def ping_go():
    url = f"{env.TGFS_PROXY_URL}/"

    try:
        resp = await httpxclient.get(url)
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Go server unreachable")
    except httpx.ReadTimeout:
        raise HTTPException(status_code=504, detail="Go server timeout")

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=dict(resp.headers),
    )


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

    stream_url = f"{BASE_URL}/stream/{message_id}{f"?token={token}" if token else ""}"

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

    if JWT_SECRET_KEY:
        if not payload:
            raise HTTPException(status_code=403, detail="Invalid or expired token")

        if payload["message_id"] != message_id:
            raise HTTPException(status_code=403, detail="Token mismatch")

    headers = {}

    if "range" in request.headers:
        headers["range"] = request.headers["range"]

    # url for internal fsb
    url = f"{env.TGFS_PROXY_URL}/stream/{message_id}"

    req = httpxclient.build_request("GET", url, headers=headers)

    try:
        resp = await httpxclient.send(req, stream=True)
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Upstream server unreachable")
    except httpx.ReadTimeout:
        raise HTTPException(status_code=504, detail="Upstream server timeout")

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
