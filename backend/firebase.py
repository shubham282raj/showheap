import firebase_admin
from firebase_admin import credentials, firestore_async, auth
from firebase_admin.firestore import SERVER_TIMESTAMP
import logging
from fastapi import Request, HTTPException
import utils
import json

cred = credentials.Certificate("showheap-service.json")
firebase_admin.initialize_app(cred)

db = firestore_async.client()


class showDB:
    @staticmethod
    async def save_content(show_details: dict, metadata: dict):

        batch = db.batch()

        content_doc_id = f"{metadata['media_type']}_{show_details['id']}"
        content_ref = db.collection("content").document(content_doc_id)
        metadata_ref = db.collection("metadata").document(str(metadata["file_id"]))

        content_data = {
            "tmdb_id": show_details["id"],
            "name": show_details.get("title") or show_details.get("name"),
            "lower_name": f"{show_details.get("title") or show_details.get("name")}".lower(),
            "media_type": metadata["media_type"],
            "poster_path": show_details.get("poster_path"),
            "backdrop_path": show_details.get("backdrop_path"),
            "updated_at": SERVER_TIMESTAMP,
        }

        # new content   : create content document
        # content exists: update update_at filed (or any changed field)
        batch.set(content_ref, content_data, merge=True)

        # add/update metadata
        metadata["updated_at"] = SERVER_TIMESTAMP
        batch.set(metadata_ref, metadata, merge=True)

        encoded_file_id = utils.FPE.encode_string(str(metadata["file_id"]))

        # MOVIE
        if metadata["media_type"] == "movie":
            batch.update(
                content_ref,
                {
                    f"files.{encoded_file_id}": metadata["file_name"],
                },
            )
        # TV
        elif metadata["media_type"] == "tv":
            batch.update(
                content_ref,
                {
                    f"files.{metadata['episode_code']}.{encoded_file_id}": metadata[
                        "file_name"
                    ],
                },
            )

        await batch.commit()

    @staticmethod
    async def getMetadata(fileID: str | int):
        try:
            doc = await db.collection("metadata").document(str(fileID)).get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            logging.error(e)
            raise Exception(
                "Firebase Error: Failed to get metadata from 'fileID' via 'getMetadata' function"
            )

    @staticmethod
    async def getContent(media_type: str, tmdb_id: str | int):
        try:
            doc = (
                await db.collection("content").document(f"{media_type}_{tmdb_id}").get()
            )
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            logging.error(e)
            raise Exception(
                "Firebase Error: Failed to get content from 'media_type' and 'tmdb_id' via 'getContent' function"
            )

    @staticmethod
    async def getAllDocs(collection: str, save_json: bool = False):
        docs = db.collection(collection).stream()
        data = {}

        async for doc in docs:
            data[doc.id] = doc.to_dict()

        if save_json:
            with open(f"{collection}.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, default=str)

        return data


async def verify_user(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    try:
        id_token = auth_header.split("Bearer ")[1]
        decoded_token = auth.verify_id_token(id_token)

        request.state.user = decoded_token
        return decoded_token

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
