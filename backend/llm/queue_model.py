import asyncio
import time


class Model:
    def __init__(self, name, rpm, func):
        self.name = name
        self.rpm = rpm
        self.func = func

        self.tokens = rpm
        self.last = time.monotonic()

    def refill(self):
        now = time.monotonic()
        gained = (now - self.last) * (self.rpm / 60)

        if gained >= 1:
            self.tokens = min(self.rpm, self.tokens + int(gained))
            self.last = now

    def available(self):
        self.refill()
        return self.tokens > 0

    def take(self):
        self.tokens -= 1

    def wait_time(self):
        self.refill()
        if self.tokens > 0:
            return 0
        return 60 / self.rpm


class Dispatcher:

    def __init__(self, models):
        self.models = models
        self.queue = asyncio.Queue()

    async def submit(self, prompt):
        loop = asyncio.get_running_loop()
        fut = loop.create_future()
        await self.queue.put((prompt, fut))
        return await fut

    async def worker(self):
        while True:

            prompt, fut = await self.queue.get()

            while True:

                for m in self.models:

                    if m.available():
                        m.take()

                        try:
                            result = await m.func(m.name, prompt)
                            fut.set_result(result)
                            break
                        except Exception as e:
                            print(e)
                            continue

                else:
                    wait = min(m.wait_time() for m in self.models)
                    await asyncio.sleep(wait)
                    continue

                break
