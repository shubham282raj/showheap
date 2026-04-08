import firebase_admin
from firebase_admin import credentials, firestore_async, auth
from firebase_admin.firestore import SERVER_TIMESTAMP
from google.cloud.firestore_v1.base_query import FieldFilter
import logging
from fastapi import Request, HTTPException
import json
import env

cred = credentials.Certificate(env.FIREBASE_SERVICE_JSON)
firebase_admin.initialize_app(cred)

db = firestore_async.client()


class showDB:
    @staticmethod
    async def save_content(show: dict, metadata: dict):

        batch = db.batch()

        content_doc_id = f"{metadata['media_type']}_{show['id']}"
        content_ref = db.collection("shows").document(content_doc_id)
        metadata_ref = db.collection("files").document(str(metadata["file_id"]))

        show["title"] = show.get("title") or show.get("name") or ""
        show["lower_name"] = show["title"].lower()
        show.pop("name", None)
        show["original_title"] = show.get("original_title") or show.get("original_name")
        show.pop("original_name", None)

        show["tmdb_id"] = show["id"]
        show["media_type"] = metadata["media_type"]

        # new content   : create content document
        # content exists: update update_at filed (or any changed field)
        show["updated_at"] = SERVER_TIMESTAMP
        batch.set(content_ref, show, merge=True)

        # add/update metadata
        metadata["updated_at"] = SERVER_TIMESTAMP
        batch.set(metadata_ref, metadata, merge=True)

        await batch.commit()

    @staticmethod
    async def getMetadata(fileID: str | int):
        try:
            doc = await db.collection("files").document(str(fileID)).get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            logging.error(e)
            raise Exception(
                "Firebase Error: Failed to get metadata from 'fileID' via 'getMetadata' function"
            )

    @staticmethod
    async def getContent(media_type: str, tmdb_id: str | int):
        try:
            doc = await db.collection("shows").document(f"{media_type}_{tmdb_id}").get()
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


async def isTGAllowedUser(sender_id):
    doc = await db.collection("allowedusers").document(str(sender_id)).get()
    return doc.exists and doc.to_dict().get("type") == "tgalloweduser"


async def isShowHeapAllowedUser(uid):
    doc = await db.collection("allowedusers").document(str(uid)).get()
    return doc.exists


async def getDoc(collection, doc):
    try:
        doc_ref = db.collection(collection).document(doc)
        snapshot = await doc_ref.get()

        if snapshot.exists:
            return snapshot.to_dict()
        else:
            return None

    except Exception as e:
        print(f"Error fetching document: {e}")
        return None


async def queryCollection(collection, filters: list):
    ref = db.collection(collection)

    for field, comp, value in filters:
        ref = ref.where(filter=FieldFilter(field, comp, value))

    docs = await ref.get()

    return [{**doc.to_dict(), "id": doc.id} for doc in docs]
