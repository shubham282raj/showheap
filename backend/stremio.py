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
        firebase.db.collection("shows")
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
                "name": d["title"],
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
        season = int(season)
        episode = int(episode)
        fb_query = await firebase.queryCollection(
            "files",
            [
                ("imdb_id", "==", imdb_id),
                ("season", "==", season),
                ("episodes", "array_contains", episode),
            ],
        )
    elif type == "movie":
        imdb_id = id
        fb_query = await firebase.queryCollection("files", [("imdb_id", "==", imdb_id)])
    else:
        return res

    fb_query = sorted(fb_query, key=lambda x: x.get("file_size", 0))

    for file in fb_query:
        url = stream.create_stream_url(STREMIO_UID_BYPASS, file["message_id"])
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
