from google import genai
import env

client = genai.Client(api_key=env.getenv("GEMINI_API_KEY"))


async def generate_response(prompt, error: Exception | None = None):
    models = [
        "gemma-3-27b-it",
        "gemma-3-12b-it",
        "gemma-3-12b-it",  # twice
        "gemma-3-4b-it",
        "gemma-3-4b-it",  # twice
        "gemma-3-1b-it",
    ]

    last_error = None

    for model in models:
        try:
            print(f"Trying model: {model}")

            response = await client.aio.models.generate_content(
                model=model,
                contents=prompt,
            )

            return response

        except Exception as gemini_error:
            print(f"{model} FAILED:", gemini_error)
            last_error = gemini_error
            continue

    # If all models fail
    if error:
        raise error from last_error

    raise last_error


async def extract_movie_name(file_name, description):
    prompt = f"""
Extract ONLY the TV show or movie title.

Filename:
{file_name}

Description:
{description}

Rules:
- Return ONLY the main movie or TV show title.
- Remove episode titles
- Remove season and episode numbers (S01E01, etc).
- Remove year, resolution, codec, release group, and file extension.
- Remove episode subtitles or names.
- Do NOT include any episode title or chapter name.
- Output only the clean title.

Examples:

Filename: Breaking.Bad.S04E13.Face.Off.1080p.mkv
Output: Breaking Bad

Filename: The.Dark.Knight.2008.1080p.BluRay.mkv
Output: The Dark Knight

Return only the title. No punctuation, no quotes, no explanation.

Answer:
"""

    response = await generate_response(
        prompt,
        error=Exception("LLM Exception: Failed to extract movie name from 'file_name'"),
    )

    return response.text.strip()


async def get_tmdb_id(filename: str, show_name: str, candidates: list):
    prompt = f"""
    You are selecting the best matching TMDB entry.

    Filename:
    {filename}

    Extracted Show Name:
    {show_name}

    Candidate Entries:
    {candidates}

    Rules:
    - Pick the entry that best matches the show name and filename.
    - Prefer exact title matches.
    - Ignore unrelated titles.
    - Return ONLY the numerical id.
    - Do not explain.
    - Do not return anything except the number.

    Answer:
    """
    response = await generate_response(
        prompt,
        error=Exception(
            "LLM Exception: Faild to get 'tmdb_id' from 'file_name', 'show_name' and 'candidates'"
        ),
    )

    return response.text.strip()


async def extract_episode(filename: str, season_info: dict):
    prompt = f"""
You are extracting season and episode information from a TV show filename.

Filename:
{filename}

Show Information:
{season_info}

Task:
Identify season and episode information from the filename.

Valid output formats (lowercase):

Single episode:
s04e13

Large episode number:
s05e234

Episode range:
s02e45-87

Season range:
s04-s06

Full season pack:
s03

Rules:
1. Use lowercase format exactly as shown above.
2. Always prefix season with "s" and episode with "e".
3. Season and episode numbers may be any length (no forced padding).
4. If multiple episodes are combined, use episode range (example: s01e01-05).
5. If multiple seasons are combined, use season range (example: s02-s04).
6. If the filename only indicates a full season, return only the season (example: s03).
7. Validate against show information:
   - season must exist
   - episode must not exceed episode_count for that season
8. Ignore resolution, codec, language tags, release group, and file extension.
9. Do not guess if information is unclear.

Examples:

Filename: Breaking.Bad.S04E13.1080p.BluRay.x264.mkv
Output: s04e13

Filename: Naruto.S05E234.720p.WEBRip.mkv
Output: s05e234

Filename: Show.Name.S02E45-87.1080p.WEBRip.mkv
Output: s02e45-87

Filename: Show.Name.S04-S06.Collection.mkv
Output: s04-s06

Filename: Show.Name.Season.03.Complete.1080p.mkv
Output: s03

Filename: Random.Video.File.1080p.mkv
Output: UNKNOWN

Output rules:
- Return ONLY the extracted result.
- No explanations.
- No punctuation.
- Single line only.

Answer:
"""

    response = await generate_response(
        prompt,
        error=Exception(
            "LLM Exception: Failed to extract Season/Episode Data from 'file_name' and 'season_info'"
        ),
    )

    return response.text.strip().upper()
