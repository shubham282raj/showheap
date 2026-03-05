import env
from telethon import events, TelegramClient, Button
from . import client
from utils import pretty_format
import utils

STREAM_BASE_URL = env.getenv("STREAM_BASE_URL")
HASH_LENGTH = int(env.getenv("HASH_LENGTH"))
WF_LOG_CHANNEL_ID = int(env.getenv("WF_LOG_CHANNEL_ID"))


class TGLogger:

    def __init__(self, data, chatID: int = WF_LOG_CHANNEL_ID, parse_mode=None):
        self.chatID = chatID
        self.msgID = None
        self.parse_mode = parse_mode
        self.update(data, markdown=True)

    def update(self, data, markdown: bool = True):
        print(data)
        self.text = pretty_format(data, markdown=markdown)

    def append(self, data, delimiter: str = "\n\n", markdown: bool = True):
        print(data)
        if not self.text:
            self.text = pretty_format(data, markdown=markdown)
        else:
            self.text += delimiter + pretty_format(data, markdown=markdown)

    async def commit(self):
        if not self.text:
            return
        try:
            if self.msgID:
                msg = await client.edit_message(
                    self.chatID, self.msgID, self.text, parse_mode=self.parse_mode
                )
            else:
                msg = await client.send_message(
                    self.chatID, self.text, parse_mode=self.parse_mode
                )

                self.msgID = msg.id
            return msg
        except Exception as e:
            print("Error Committing Log Message")


async def message_exists(chat_id: int, message_id: int) -> bool:
    try:
        msg = await client.get_messages(chat_id, ids=message_id)
        return bool(msg)
    except Exception as e:
        print(e)
        raise Exception(
            "TG Error: Failed to check message existence via 'message_exists' function"
        )


def getStreamingLink(metadata: dict):
    return f"{STREAM_BASE_URL}/stream/{metadata.get('message_id')}/?hash={metadata.get('file_hash', '*'*20)[:HASH_LENGTH]}"


async def replySuccessFileWF(event, content, metadata):

    caption = f"""
🎬 <b>{content.get('title') or content.get('name')}</b>
🎭 <b>Type:</b> {metadata['media_type'].title()}

📂 <b>File:</b> {metadata['file_name']}
💾 <b>Size:</b> {utils.format_size(metadata['file_size'])}
"""

    poster_url = f"https://image.tmdb.org/t/p/w500{content['poster_path']}"
    streaming_link = getStreamingLink(metadata)

    await event.reply(
        caption,
        file=poster_url,
        parse_mode="html",
        buttons=[
            [Button.url("▶ Stream / Download", streaming_link)],
            [
                Button.url(
                    "TMDB",
                    f"https://www.themoviedb.org/{metadata.get("media_type")}/{metadata.get("tmdb_id")}",
                ),
                Button.url(
                    "ShowHeap",
                    f"https://www.themoviedb.org/content/{metadata.get("media_type")}/{metadata.get("tmdb_id")}",
                ),
            ],
        ],
    )
