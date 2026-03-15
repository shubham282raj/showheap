from telethon import TelegramClient
import env
from .queue import ForwardFileQueue
import logging


API_ID = int(env.API_ID)
API_HASH = env.API_HASH
BOT_TOKEN = env.BOT_TOKEN


client: TelegramClient = TelegramClient("bot_session", API_ID, API_HASH)


async def startbot():
    ForwardFileQueue.start_worker(client, num_workers=1)
    await client.start(bot_token=BOT_TOKEN)
    bot = await client.get_me()
    logging.info(f"Bot @{bot.username} started")
    return client
