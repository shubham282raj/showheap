import asyncio
import logging
import re
import time
from google.genai import errors


MAX_BACKOFF_SECONDS = 60
MIN_RETRY_SLEEP = 0.05
_SENTINEL = object()  # pushed onto the queue to stop workers


def get_retry_delay(err) -> float | None:

    try:
        details = err.response.json()["error"]["details"]
        for d in details:
            if d.get("@type", "").endswith("RetryInfo"):
                delay = d.get("retryDelay", "0s")
                nums = re.findall(r"\d+\.?\d*", delay)
                if nums:
                    return float(nums[0])
                logging.info("RetryInfo present but retryDelay unparseable: %s", delay)
    except Exception as exc:
        logging.info("Could not parse retryDelay from error response: %s", exc)
    return None


class Model:
    def __init__(self, name: str, func):
        self.name = name
        self.func = func

        self.cooldown_until: float = 0.0
        self.backoff_attempts: int = 0

        self._lock = asyncio.Lock()

    async def available(self) -> bool:
        async with self._lock:
            return time.monotonic() >= self.cooldown_until

    async def wait_time(self) -> float:
        async with self._lock:
            return max(0.0, self.cooldown_until - time.monotonic())

    async def apply_cooldown(
        self, seconds: float, cooldown_type: str = "error"
    ) -> None:
        async with self._lock:
            backoff_sec = seconds
            if cooldown_type == "rate_limit":
                self.cooldown_until = time.monotonic() + seconds
            elif cooldown_type == "error":
                self.backoff_attempts += 1
                backoff_sec = min(
                    seconds * (2 ** (self.backoff_attempts - 1)), MAX_BACKOFF_SECONDS
                )
                self.cooldown_until = time.monotonic() + backoff_sec
            logging.warning(
                "%s cooling down %.2fs (attempt %d)",
                self.name,
                backoff_sec,
                self.backoff_attempts,
            )

    async def reset(self) -> None:
        async with self._lock:
            self.backoff_attempts = 0
            self.cooldown_until = 0.0


class Dispatcher:
    def __init__(self, models: list[Model], num_workers: int = 1):
        if not models:
            raise ValueError("At least one model is required.")

        self.models = models
        self.num_workers = num_workers
        self.queue: asyncio.Queue = asyncio.Queue()
        self._tasks: list[asyncio.Task] = []

    async def start(self) -> None:
        for i in range(self.num_workers):
            task = asyncio.create_task(self._worker(i), name=f"dispatcher-worker-{i}")
            self._tasks.append(task)
        logging.info("Dispatcher started with %d worker(s).", self.num_workers)

    async def stop(self) -> None:
        for _ in self._tasks:
            await self.queue.put(_SENTINEL)
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logging.info("Dispatcher stopped.")

    async def __aenter__(self):
        await self.start()
        return self

    async def __aexit__(self, *_):
        await self.stop()

    async def submit(self, prompt: str):
        loop = asyncio.get_running_loop()
        fut: asyncio.Future = loop.create_future()
        await self.queue.put((prompt, fut))
        return await fut

    # internals

    async def _worker(self, number: int) -> None:
        while True:
            item = await self.queue.get()
            try:
                if item is _SENTINEL:
                    return  # graceful shutdown

                prompt, fut = item
                logging.debug("Worker %d picked up a task.", number)
                try:
                    await self._process(prompt, fut)
                except Exception as exc:
                    logging.exception("Worker %d unexpected error: %s", number, exc)
                    if not fut.done():
                        fut.set_exception(exc)
            finally:
                self.queue.task_done()

    async def _process(self, prompt: str, fut: asyncio.Future) -> None:
        if fut.done():
            return

        query_meta = {"retries": 0, "time_taken": "", "model": ""}
        init_time = time.monotonic()

        while True:
            for m in self.models:
                if not await m.available():
                    continue

                logging.info("Trying model: %s", m.name)

                try:
                    result = await m.func(m.name, prompt)
                    await m.reset()

                    query_meta["model"] = m.name
                    query_meta["time_taken"] = f"{time.monotonic() - init_time:.2f}s"

                    if not fut.done():
                        fut.set_result((result, query_meta))
                    return

                except errors.ClientError as exc:
                    logging.warning("%s GEMINI CLIENT ERROR: %s", m.name, exc.message)
                    await m.apply_cooldown(
                        get_retry_delay(exc) or 5.0, cooldown_type="rate_limit"
                    )
                    query_meta["retries"] += 1

                except errors.ServerError as exc:
                    logging.warning("%s GEMINI SERVER ERROR: %s", m.name, exc.message)
                    await m.apply_cooldown(5.0, cooldown_type="error")
                    query_meta["retries"] += 1

                except Exception as exc:
                    logging.error("%s UNEXPECTED ERROR: %s", m.name, exc)
                    await m.apply_cooldown(5.0, cooldown_type="error")
                    query_meta["retries"] += 1

            # sleep until the next model becomes available
            waits = await asyncio.gather(*(m.wait_time() for m in self.models))
            sleep_for = max(min(waits), MIN_RETRY_SLEEP)

            logging.warning("All models cooling down. Sleeping for %.2fs.", sleep_for)
            await asyncio.sleep(sleep_for)
