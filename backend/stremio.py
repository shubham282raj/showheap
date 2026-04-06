from fastapi import APIRouter
from fastapi.responses import JSONResponse
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
        "resources": ["stream"],
        "catalogs": [
            {"type": "movie", "id": "movie", "name": "ShowHeap"},
            {"type": "series", "id": "tv", "name": "ShowHeap"},
        ],
        "idPrefixes": ["tt"],
    }
    return JSONResponse(content=manifest)


@router.get("/catalog/{type}/{id}.json")
async def get_catalog(type: str, id: str, skip: int = 0):

    PAGE_SIZE = 100

    query = (
        firebase.db.collection("content")
        .where(filter=firebase.FieldFilter("media_type", "==", id))
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
                "id": d.get("imdb_id", "tmdb_" + str(d["tmdb_id"])),
                "type": type,
                "name": d["name"],
                "poster": f"https://image.tmdb.org/t/p/w500{d.get('poster_path')}",
            }
        )

    return {"metas": metas}


# TODO

# @router.get("/meta/{type}/{id}.json")
# async def get_meta(type: str, id: str):
#     # lets only handle tmdb meta
#     if not id.startswith("tmdb_") or type not in ["series", "movie"]:
#         return {"meta": None}

#     type = "tv" if type == "series" else "movie"

#     tmdb_id = int(id.replace("tmdb_", ""))

#     doc = await firebase.getDoc("content", f"{type}_{tmdb_id}")

#     if not doc:
#         return {"meta": None}

#     d = doc[0].to_dict()


@router.get("/stream/{type}/{id}.json")
async def get_stream(type: str, id: str):
    res = {"streams": []}

    if type == "series":
        imdb_id, season, episode = id.split(":")
    elif type == "movie":
        imdb_id = id
    else:
        return res

    fb_query = await firebase.queryCollection("metadata", {"imdb_id": imdb_id})
    for metadata in fb_query:
        url = stream.create_stream_url(STREMIO_UID_BYPASS, metadata["message_id"])
        res["streams"].append(
            {
                "name": f"ShowHeap {metadata.get("episode_code", "")}".strip(),
                "description": "\n".join(
                    x
                    for x in [
                        utils.wrap_str(
                            metadata["file_name"].replace("_", " ").replace(".", " "),
                            30,
                        ),
                        utils.format_size(metadata["file_size"]),
                    ]
                    if x is not None
                ),
                "url": url,
            }
        )

    return res
