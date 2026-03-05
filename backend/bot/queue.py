import asyncio
from telethon import events, TelegramClient
from telethon.errors import FloodWaitError
import env
import logging

FILE_LOG_CHANNEL_ID = int(env.getenv("FILE_LOG_CHANNEL_ID"))


class ForwardFileQueue:
    queue = asyncio.Queue()

    @classmethod
    async def push(cls, event: events.NewMessage):
        loop = asyncio.get_running_loop()
        future = loop.create_future()

        await cls.queue.put((event.message, future))
        return await future

    @classmethod
    async def forward_worker(cls, client: TelegramClient):
        while True:
            msg, future = await cls.queue.get()

            try:
                forwarded = await client.forward_messages(FILE_LOG_CHANNEL_ID, msg)

                message_id = (
                    forwarded if not isinstance(forwarded, list) else forwarded[0]
                ).id

                if not future.done():
                    future.set_result((message_id, FILE_LOG_CHANNEL_ID))

            except FloodWaitError as e:
                logging.warning(f"Flood wait: {e.seconds}")

                await asyncio.sleep(e.seconds)
                await cls.queue.put((msg, future))

            except Exception as e:
                logging.error(f"Forwarding Failed: {e}")

                if not future.done():
                    future.set_exception(e)

            finally:
                cls.queue.task_done()

    @classmethod
    def start_worker(cls, client: TelegramClient):
        asyncio.create_task(cls.forward_worker(client))
