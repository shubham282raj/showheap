import env
from telethon import events, Button
import workflow
from .hash import pack_file
from . import client
import firebase
from . import botutils
import utils


FILE_LOG_CHANNEL_ID = int(env.getenv("FILE_LOG_CHANNEL_ID"))


@client.on(events.NewMessage(pattern="/start"))
async def start_handler(event):
    await event.respond("Bot is running 🚀")


@client.on(events.NewMessage)
async def attachment_handler(event: events.NewMessage):
    tglogger = None
    init_reply = None
    try:
        if not event.document:
            return

        doc = event.document

        # tg channel logger init
        tglogger = botutils.TGLogger(
            {"File Recieved from": f"{event.sender_id}"}, parse_mode="md"
        )

        # file details
        file_name = ""
        for attr in doc.attributes:
            if hasattr(attr, "file_name"):
                file_name = attr.file_name

        file_size = doc.size
        mime_type = doc.mime_type
        file_id = doc.id
        file_hash = pack_file(file_name, file_size, mime_type, file_id)

        # check if file is there in firebase
        metadata = await firebase.showDB.getMetadata(fileID=file_id)
        if metadata:
            channel_id = metadata["channel_id"]
            message_id = metadata["message_id"]

            if await botutils.message_exists(channel_id, message_id):
                content = await firebase.showDB.getContent(
                    metadata["media_type"], metadata["tmdb_id"]
                )
                return await botutils.replySuccessFileWF(event, content, metadata)

        # forward to channel
        forwarded = await client.forward_messages(
            entity=FILE_LOG_CHANNEL_ID, messages=event.message
        )

        fmsg = forwarded if not isinstance(forwarded, list) else forwarded[0]
        channel_message_id = fmsg.id

        # Build Metadata
        metadata = dict(
            file_id=file_id,
            file_name=file_name,
            file_size=file_size,
            mime_type=mime_type,
            file_hash=file_hash,
            message_id=channel_message_id,
            channel_id=FILE_LOG_CHANNEL_ID,
            description=event.message.text,
        )

        # send reply
        stream_url = botutils.getStreamingLink(metadata)
        stream_button = [Button.url("▶ Stream", stream_url)]
        init_reply = await event.reply(
            f"Fetching Show Details...",
            buttons=[stream_button],
            parse_mode="md",
        )

        # fetch media details
        content = await workflow.fetchMediaDetails(metadata, tglogger)

        # save to firebase
        metadata.pop("description", None)  # we need not store description in db
        await firebase.showDB.save_content(content, metadata)
        tglogger.append("Saved to Firebase Successfully", markdown=False)

        # reply again
        return await botutils.replySuccessFileWF(event, content, metadata)

    except Exception as e:
        shorterror = utils.shortenError(e)
        tglogger.append(shorterror, markdown=False)
        await event.reply(
            f"Fetch Failed\n\n{shorterror}\n\nYou can still use the streaming link",
            buttons=[Button.url("▶ Stream", botutils.getStreamingLink(metadata))],
        )
    finally:
        if init_reply:
            await init_reply.delete()
        if tglogger:
            await tglogger.commit()
