from google import genai
import env
import asyncio
from .queue_model import Model, Dispatcher

client = genai.Client(api_key=env.GEMINI_API_KEY)


async def __generate_response(model, prompt):

    response = await client.aio.models.generate_content(
        model=model,
        contents=prompt,
    )

    return response.text.strip()


models = [
    Model("gemma-3-27b-it", __generate_response),
    Model("gemma-3-12b-it", __generate_response),
]

# dispatcher instanace
dispatcher = Dispatcher(models, num_workers=5)

asyncio.create_task(dispatcher.start())

# models = [
#     # Model("gemini-3-flash", 5, __generate_response),
#     # Model("gemini-2.5-flash", 5, __generate_response),
#     # Model("gemini-3.1-flash-lite", 15, __generate_response),
#     # Model("gemini-2.5-flash-lite", 10, __generate_response),
#     Model("gemma-3-27b-it", 30, __generate_response),
#     Model("gemma-3-12b-it", 30, __generate_response),
#     # Model("gemma-3-4b-it", 30, __generate_response),
#     # Model("gemma-3-2b-it", 30, __generate_response),
#     # Model("gemma-3-1b-it", 30, __generate_response),
# ]
