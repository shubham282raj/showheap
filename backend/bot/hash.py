import hashlib


def pack_file(file_name: str, file_size: int, mime_type: str, file_id: str) -> str:
    data = file_name + str(file_size) + mime_type + str(file_id)
    return hashlib.md5(data.encode("utf-8")).hexdigest()
