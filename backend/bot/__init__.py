from telethon import TelegramClient
import env
from .queue import ForwardFileQueue


API_ID = int(env.getenv("API_ID"))
API_HASH = env.getenv("API_HASH")
BOT_TOKEN = env.getenv("BOT_TOKEN")


client: TelegramClient = TelegramClient("bot_session", API_ID, API_HASH)


async def startbot():
    ForwardFileQueue.start_worker(client)
    return await client.start(bot_token=BOT_TOKEN)
