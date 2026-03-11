import asyncio
import time


class Model:
    def __init__(self, name, rpm, func):
        self.name = name
        self.rpm = rpm
        self.func = func

        self.tokens = rpm
        self.last = time.monotonic()
        self._lock = asyncio.Lock()  # Fix: per-model lock prevents race conditions

    def _refill(self):
        now = time.monotonic()
        elapsed = now - self.last
        gained = elapsed * (self.rpm / 60)

        if gained >= 1:
            add = int(gained)
            self.tokens = min(self.rpm, self.tokens + add)
            self.last += add * (
                60 / self.rpm
            )  # advance by exact token intervals, not wall time

    async def try_take(self) -> bool:
        async with self._lock:
            self._refill()
            if self.tokens > 0:
                self.tokens -= 1
                return True
            return False

    async def wait_time(self) -> float:
        async with self._lock:
            self._refill()
            if self.tokens > 0:
                return 0.0
            elapsed = time.monotonic() - self.last
            return max(0.0, (60 / self.rpm) - elapsed)


class Dispatcher:

    def __init__(self, models: list[Model]):
        self.models = models
        self.queue: asyncio.Queue = asyncio.Queue()

    async def submit(self, prompt) -> object:
        loop = asyncio.get_running_loop()
        fut = loop.create_future()
        await self.queue.put((prompt, fut))
        return await fut

    async def worker(self, number):
        while True:
            prompt, fut = await self.queue.get()
            try:
                print("Work taken up by LLM queue worker", number)
                await self._process(prompt, fut)
            except Exception as e:
                print(f"[worker] Unexpected error: {e}")
            finally:
                self.queue.task_done()

    async def _process(self, prompt, fut: asyncio.Future):
        if fut.done():
            return

        query_meta = {
            "retries": 0,
            "time_taken": "",
            "model": "",
        }
        init_time = time.monotonic()

        for _ in range(10):  # max retries over all models

            for m in self.models:
                # Fix: atomic check-and-consume under lock — no more race condition
                acquired = await m.try_take()
                if not acquired:
                    continue

                print(f"Trying model: {m.name}")

                try:
                    result = await m.func(m.name, prompt)
                    query_meta["model"] = m.name
                    query_meta["time_taken"] = f"{(time.monotonic() - init_time):.2f}s"
                    if not fut.done():
                        fut.set_result((result, query_meta))
                    return

                except Exception as e:
                    print(f"{m.name} failed: {e}")
                    query_meta["retries"] += 1

            waits = await asyncio.gather(*(m.wait_time() for m in self.models))
            wait = min(waits)
            wait = max(wait, 0.05)
            print(f"All models rate-limited. Waiting {wait:.2f}s before retry.")
            await asyncio.sleep(wait)
