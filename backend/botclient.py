from telethon import TelegramClient
import env


API_ID = int(env.getenv("API_ID"))
API_HASH = env.getenv("API_HASH")
BOT_TOKEN = env.getenv("BOT_TOKEN")


client = TelegramClient("bot_session", API_ID, API_HASH)


async def startbot():
    return await client.start(bot_token=BOT_TOKEN)
