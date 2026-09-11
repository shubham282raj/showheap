from fastapi import APIRouter
from fastapi.responses import JSONResponse, RedirectResponse
import firebase
import utils
import stream

router = APIRouter()

STREMIO_UID_BYPASS = "stremiobp"


@router.get("/manifest.json")
def get_manifest():
    manifest = {
        "id": "org.showheap",
        "version": "1.0.0",
        "name": "ShowHeap",
        "types": ["movie", "series"],
        "resources": ["catalog", "stream"],
        "catalogs": [
            {"type": "movie", "id": "movie", "name": "ShowHeap"},
            {"type": "series", "id": "series", "name": "ShowHeap"},
        ],
        "idPrefixes": ["tt"],
    }
    return JSONResponse(content=manifest)


@router.get("/catalog/{type}/{id}.json")
async def get_catalog(type: str, id: str, skip: int = 0):
    PAGE_SIZE = 100

    query = (
        firebase.db.collection(firebase.CONTENT_COLLECTION_NAME)
        .where(filter=firebase.FieldFilter("media_type", "==", type))
        .order_by("updated_at", direction="DESCENDING")
        .limit(skip + PAGE_SIZE)
    )

    docs = [doc async for doc in query.stream()]
    docs = docs[skip : skip + PAGE_SIZE]

    metas = []
    for doc in docs:
        d = doc.to_dict()
        metas.append(
            {
                "id": d["imdb_id"],
                "type": type,
                "name": d["name"],
                "poster": d["poster"],
            }
        )

    return {"metas": metas}


@router.get("/stream/{type}/{id}.json")
async def get_stream(type: str, id: str):
    res = {"streams": []}

    if type == "series":
        imdb_id, season, episode = id.split(":")
        season = int(season)
        episode = int(episode)
        fb_query = await firebase.queryCollection(
            firebase.METADATA_COLLECTION_NAME,
            [
                ("imdb_id", "==", imdb_id),
                ("season", "==", season),
                ("episodes", "array_contains", episode),
            ],
        )
    elif type == "movie":
        imdb_id = id
        fb_query = await firebase.queryCollection(
            firebase.METADATA_COLLECTION_NAME, [("imdb_id", "==", imdb_id)]
        )
    else:
        return res

    fb_query = sorted(fb_query, key=lambda x: x.get("file_size", 0))

    for file in fb_query:
        url = stream.create_stream_url(file)
        ep_code = (
            utils.build_episode_code(
                file.get("season", -1),
                file.get("episode_start", -1),
                file.get("episode_end", -1),
            )
            if type == "series"
            else ""
        )
        res["streams"].append(
            {
                "name": f"ShowHeap {ep_code}".strip(),
                "description": "\n".join(
                    x
                    for x in [
                        utils.wrap_str(
                            file["file_name"].replace("_", " ").replace(".", " "),
                            30,
                        ),
                        utils.format_size(file["file_size"]),
                    ]
                    if x is not None
                ),
                "url": url,
            }
        )

    return res


@router.get("/share/{media_type}/{imdb_id}")
async def share_redirect(media_type: str, imdb_id: str):
    stremio_url = f"stremio:///detail/{media_type}/{imdb_id}"
    return RedirectResponse(url=stremio_url)
