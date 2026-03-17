import env
from telethon import events
from . import client
from .workflow import ToShowDBWF
from . import botutils


@client.on(events.NewMessage(pattern="/start"))
async def start_handler(event):
    await event.respond("Bot is running 🚀")


@client.on(events.NewMessage)
async def attachment_handler(event: events.NewMessage):
    if not event.document:
        return

    if not await botutils.isUserAllowed(event):
        try:
            logger = botutils.TGLogger(parse_mode="md")
            logger.append(
                {"File recieved from an unauthorized user": str(event.sender_id)}
            )
            await logger.commit()
            await event.reply(
                f"You're not allowed to do this action.\n\n"
                f"Create an account on ShowHeap and request Telegram access with `{event.sender_id or "undefined"}`"
            )
        except Exception:
            pass

        return

    await ToShowDBWF(event).start()
