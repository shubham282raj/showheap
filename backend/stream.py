import env
import jwt
import datetime
import firebase
import httpx
import utils
import asyncio
from fastapi import HTTPException, Request, Depends, APIRouter
from fastapi.responses import StreamingResponse, Response

PORT = int(env.PORT)
BASE_URL = env.BASE_URL
TGFS_PROXY_URL = env.TGFS_PROXY_URL
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


def create_stream_url(metadata):
    stream_url = f"{BASE_URL}/stream/{metadata.get("message_id")}?hash={str(metadata.get("file_hash"))[:6]}"
    return stream_url


router = APIRouter()
httpxclient = httpx.AsyncClient(
    timeout=httpx.Timeout(connect=30.0, read=None, write=300.0, pool=30.0)
)


@router.get("/ping-tgfs")
async def ping_go():
    url = f"{TGFS_PROXY_URL}/"

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
    imdb_id = utils.FPE.decode_string(encoded_metadata_id)
    user_uid = request.state.user.get("uid")

    is_allowed, metadata = await asyncio.gather(
        firebase.isShowHeapAllowedUser(user_uid), firebase.showDB.getMetadata(imdb_id)
    )

    if not is_allowed:
        raise HTTPException(status_code=401, detail="permission-denied")

    if not metadata:
        raise HTTPException(status_code=404, detail="File not found")

    stream_url = create_stream_url(metadata)

    data = {
        "media_type": metadata.get("media_type"),
        "imdb_id": metadata.get("imdb_id"),
        "episode_code": metadata.get("episode_code"),
        "episodes": metadata.get("episodes"),
        "season": metadata.get("season"),
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
    url = f"{TGFS_PROXY_URL}/stream/{message_id}"

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
            value = resp.headers[h]

            if h == "content-disposition":
                value = utils.fix_content_disposition(
                    value, force_download=bool(download)
                )
            else:
                value = utils.sanitize_header(value)

            response_headers[h] = value

    if download and "content-disposition" not in response_headers:
        response_headers["content-disposition"] = "attachment"

    return StreamingResponse(
        resp.aiter_bytes(),
        status_code=resp.status_code,
        headers=response_headers,
    )
