import asyncio
from telethon import events, TelegramClient
from telethon.errors import FloodWaitError
import env
import logging

FILE_LOG_CHANNEL_ID = int(env.FILE_LOG_CHANNEL_ID)


class ForwardFileQueue:
    queue = asyncio.Queue()

    @classmethod
    async def push(cls, event: events.NewMessage):
        loop = asyncio.get_running_loop()
        future = loop.create_future()

        await cls.queue.put((event.message, future))
        return await future

    @classmethod
    async def forward_worker(cls, client: TelegramClient, worker_id: int):
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
    def start_worker(cls, client: TelegramClient, num_workers: int = 1):
        for i in range(num_workers):
            asyncio.create_task(cls.forward_worker(client, worker_id=i))
        logging.info(
            "Telegram File Forwarding queue started with %d workers(s)", num_workers
        )
