from google import genai
from google.genai import types
import env
import asyncio
from .queue_model import Model, Dispatcher

client = genai.Client(api_key=env.GEMINI_API_KEY)


async def __generate_response(model, prompt):

    response = await client.aio.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_level="high")
        ),
    )

    return response.text.strip()


models = [
    Model("gemma-4-31b-it", __generate_response),
    Model("gemma-4-31b-it", __generate_response),
]

# dispatcher instanace
dispatcher = Dispatcher(models, num_workers=5)

asyncio.create_task(dispatcher.start())
