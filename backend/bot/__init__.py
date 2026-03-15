from telethon import TelegramClient
import env
from .queue import ForwardFileQueue
import logging


API_ID = int(env.getenv("API_ID"))
API_HASH = env.getenv("API_HASH")
BOT_TOKEN = env.getenv("BOT_TOKEN")


client: TelegramClient = TelegramClient("bot_session", API_ID, API_HASH)


async def startbot():
    ForwardFileQueue.start_worker(client)
    await client.start(bot_token=BOT_TOKEN)
    bot = await client.get_me()
    logging.info(f"Bot @{bot.username} started")
    return client
