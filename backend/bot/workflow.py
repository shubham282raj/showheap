from telethon import events, Button
from . import botutils
import firebase
from .queue import ForwardFileQueue
import workflow
import utils


class ToShowDBWF:
    def __init__(self, event: events.NewMessage):
        self.tglogger = botutils.TGLogger(parse_mode="md")
        self.event = event
        self.metadata = {}
        self.content = {}
        self.init_reply = None

        self.tglogger.append({"File Recieved from": f"{self.event.sender_id}"})

    async def start(self):
        try:
            # get file metadata
            metadata = self.getFileMetadata()

            # check if the file exists is database and telegram both
            duplicate = await self.checkDuplicate(metadata["file_id"])
            if duplicate:
                self.tglogger.append(
                    "File already exists! Sent user the file successfully",
                    markdown=False,
                )
                return

            # forward to channel
            (message_id, channel_id) = await ForwardFileQueue.push(self.event)
            metadata["message_id"] = message_id
            metadata["channel_id"] = channel_id

            # send initial reply
            stream_url = botutils.getStreamingLink(metadata)
            stream_button = [Button.url("▶ Stream", stream_url)]
            self.init_reply = await self.event.reply(
                f"Fetching Show Details...",
                buttons=[stream_button],
                parse_mode="md",
            )

            # fetch media details via workflow
            metadata["description"] = self.event.message.text
            content, metadata = await workflow.fetchMediaDetails(
                metadata, self.tglogger
            )
            metadata.pop("description", None)

            # save on firebase
            await firebase.showDB.save_content(content, metadata)
            self.tglogger.append("Saved to Firebase Successfully", markdown=False)

            await self.replySuccessFileWF(content, metadata)

        except Exception as e:
            shorterror = utils.shortenError(e)
            self.tglogger.append(shorterror, markdown=False)
            await self.event.reply(
                f"Workflow Failed\n\n{shorterror}\n\nYou can still use the streaming link",
                buttons=[Button.url("▶ Stream", botutils.getStreamingLink(metadata))],
            )
        finally:
            if self.init_reply:
                await self.init_reply.delete()
            await self.tglogger.commit()

    def getFileMetadata(self):
        doc = self.event.document

        if not doc:
            raise Exception("No document found")

        file_name = ""
        for attr in doc.attributes:
            if hasattr(attr, "file_name"):
                file_name = attr.file_name

        file_size = doc.size
        mime_type = doc.mime_type
        file_id = doc.id
        file_hash = botutils.pack_file(file_name, file_size, mime_type, file_id)

        return {
            "file_name": file_name,
            "file_size": file_size,
            "mime_type": mime_type,
            "file_id": file_id,
            "file_hash": file_hash,
        }

    async def checkDuplicate(self, file_id: int):
        metadata = await firebase.showDB.getMetadata(fileID=file_id)
        if metadata:
            channel_id = metadata["channel_id"]
            message_id = metadata["message_id"]

            if await botutils.message_exists(channel_id, message_id):
                content = await firebase.showDB.getContent(
                    metadata["media_type"], metadata["tmdb_id"]
                )
                await self.replySuccessFileWF(content, metadata)
                return True

        return False

    async def replySuccessFileWF(self, content, metadata):
        caption = f"""
🎬 <b>{content.get('title') or content.get('name')}</b>
🎭 <b>Type:</b> {metadata['media_type'].title()}

📂 <b>File:</b> {metadata['file_name']}
💾 <b>Size:</b> {utils.format_size(metadata['file_size'])}
        """

        poster_url = f"https://image.tmdb.org/t/p/w500{content['poster_path']}"
        streaming_link = botutils.getStreamingLink(metadata)

        await self.event.reply(
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
