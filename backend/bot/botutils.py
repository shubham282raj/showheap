import env
from . import client
from utils import pretty_format
import hashlib
import logging


WF_LOG_CHANNEL_ID = int(env.getenv("WF_LOG_CHANNEL_ID", "0"))

if not WF_LOG_CHANNEL_ID:
    logging.warning("WF_LOG_CHANNEL_ID not provided")


class TGLogger:

    def __init__(self, data="", chatID: int = WF_LOG_CHANNEL_ID, parse_mode=None):
        self.chatID = chatID
        self.msgID = None
        self.parse_mode = parse_mode
        self.text = ""
        self.update(data, markdown=True)

    def update(self, data, markdown: bool = True):
        if data:
            logging.info(data)
            self.text = pretty_format(data, markdown=markdown)

    def append(self, data, delimiter: str = "\n\n", markdown: bool = True):
        logging.info(data)
        if not self.text:
            self.text = pretty_format(data, markdown=markdown)
        else:
            self.text += delimiter + pretty_format(data, markdown=markdown)

    async def commit(self):
        if not self.text or not self.chatID:
            return
        try:
            self.text.strip()
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
            logging.error("Error Committing Log Message")


async def message_exists(chat_id: int, message_id: int) -> bool:
    try:
        msg = await client.get_messages(chat_id, ids=message_id)
        return bool(msg)
    except Exception as e:
        logging.error(e)
        raise Exception(
            "TG Error: Failed to check message existence via 'message_exists' function"
        )


def pack_file(file_name: str, file_size: int, mime_type: str, file_id: str) -> str:
    data = file_name + str(file_size) + mime_type + str(file_id)
    return hashlib.md5(data.encode("utf-8")).hexdigest()
