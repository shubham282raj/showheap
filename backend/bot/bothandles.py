import env
from telethon import events
from . import client
from .workflow import ToShowDBWF


@client.on(events.NewMessage(pattern="/start"))
async def start_handler(event):
    await event.respond("Bot is running 🚀")


@client.on(events.NewMessage)
async def attachment_handler(event: events.NewMessage):
    if not event.document:
        return

    await ToShowDBWF(event).start()
