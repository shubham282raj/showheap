from telethon import TelegramClient
from telethon.errors import FloodWaitError
import env
from .queue import ForwardFileQueue
import logging
import asyncio


API_ID = int(env.API_ID)
API_HASH = env.API_HASH
BOT_TOKEN = env.BOT_TOKEN


client: TelegramClient = TelegramClient("bot_session", API_ID, API_HASH)
bot_started = False


async def startbot():
    global bot_started

    if bot_started:
        return client

    for i in range(5):
        try:
            await client.start(bot_token=BOT_TOKEN)
            bot_started = True
            break

        except FloodWaitError as e:
            logging.warning(
                "FloodWait while starting bot (attempt %d). Waiting %d seconds",
                i + 1,
                e.seconds,
            )
            await asyncio.sleep(e.seconds)
        except Exception as e:
            logging.error(e)
            break

    if not bot_started:
        raise RuntimeError("Failed to start Telegram bot after retries")

    ForwardFileQueue.start_worker(client, num_workers=1)

    bot = await client.get_me()
    logging.info(f"Bot @{bot.username} started")

    return client
