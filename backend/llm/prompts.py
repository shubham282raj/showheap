from . import dispatcher


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

    responsetxt, logs = await dispatcher.submit(prompt)

    return responsetxt, logs


async def get_imdb_id(filename: str, description: str, candidates: list):
    prompt = f"""
You are selecting the best matching IMDb entry.

Inputs:
Filename:
{filename}

Description:
{description}

Candidates (name, imdb_id, year, type):
{candidates}


Task:
Pick the SINGLE best match.

Matching Strategy:

1. TITLE MATCH (highest priority)
   - Prefer exact or close match with filename
   - Ignore dots, casing, punctuation
   - Example: "The.Boys" → "The Boys"

2. TYPE MATCH
   - Detect MOVIE vs SERIES:
     • TV clues → S01E01, Season, Episode
     • Movie clues → year, BluRay, WEB-DL
   - Must match candidate.type ("movie" or "series")
   - If type mismatches → reject

3. YEAR MATCH
   - Extract year from filename/description
   - Match with candidate.year
   - For series: use start year ("2019-2026" → 2019)

4. DESCRIPTION
   - Use to resolve remakes/sequels

5. GENRES (weak signal)
   - Only for tie-breaking


Ignore:
resolution, codec, release group, extensions


Decision Rules:
- Choose best match (title + type + year)
- If multiple → use year
- If no reasonable match → return None
- Do NOT force a match


Output Rules:
- Return ONLY imdb_id (e.g., tt1234567) or none
- No explanation, no extra text

Example 1:
Filename: Breaking.Bad.S04E13.Face.Off.1080p.BluRay.x264.mkv
Candidates:
[
  {{ "name": "Breaking Bad", "imdb_id": "tt0903747", "year": "2008-2013", "type": "series" }},
  {{ "name": "Breaking Bad Movie", "imdb_id": "tt1234567", "year": "2015", "type": "movie" }}
]
Output:
tt0903747


Example 2:
Filename: The.Dark.Knight.2008.IMAX.1080p.BluRay.mkv
Candidates:
[
  {{ "name": "The Dark Knight", "imdb_id": "tt0468569", "year": "2008", "type": "movie" }},
  {{ "name": "The Dark Knight Returns", "imdb_id": "tt2313197", "year": "2012", "type": "movie" }}
]
Output:
tt0468569


Example 3:
Filename: Dune.Part.Two.2024.1080p.WEBRip.mkv
Candidates:
[
  {{ "name": "The Office", "imdb_id": "tt0386676", "year": "2005–2013", "type": "series" }},
  {{ "name": "The Office", "imdb_id": "tt0290978", "year": "2001–2003", "type": "series" }}
]
Output:
None


Answer:
"""

    responsetxt, logs = await dispatcher.submit(prompt)
    return responsetxt.strip().lower(), logs


async def extract_episode(filename: str, description: str, season_info: dict):
    prompt = f"""
You are extracting season and episode information from a TV show filename.

Filename:
{filename}

Description:
{description}

Show Information:
{season_info}

Task:
Identify season and episode information from the filename.

Valid output formats (lowercase):

Single episode:
S04E13

Large episode number:
S05E234

Episode range:
S02E45-87

Season range:
(no need to return episode information in case of multiple seasons clubbed together)
S04-S06

Full season pack:
say, number of episodes are 16 in that season
S03E01-16

Rules:
1. Use uppercase format exactly as shown above.
2. Always prefix season with "S" and episode with "E".
3. Season and episode numbers may be any length (no forced padding).
4. If multiple episodes are combined, use episode range (example: S01E01-05).
5. If multiple seasons are combined, use season range (example: S02-S04).
6. If the filename only indicates a full season, look are the season info and get the number of episodes, return SXXE01-(number_of_episodes_in_season_XX) (example: S03E01-16).
7. Validate against show information:
   - season must exist
   - episode must not exceed episode_count for that season
8. Ignore resolution, codec, language tags, release group, and file extension.
9. Do not guess if information is unclear.

Examples:

Filename: Breaking.Bad.S04E13.1080p.BluRay.x264.mkv
Output: S04E13

Filename: Naruto.S05E234.720p.WEBRip.mkv
Output: S05E234

Filename: Show.Name.S02E45-87.1080p.WEBRip.mkv
Output: S02E45-87

Filename: Show.Name.S04-S06.Collection.mkv
Output: S04-S06

Filename: Show.Name.Season.03.Complete.1080p.mkv
(Take hint from Season Information: if season 3 has 9 episodes)
Output: S03E01-09

Filename: Prison.Break.1080p.mkv
(No hint is given => Something is wrong)
Output: NONE (always fallback to NONE)

Output rules:
- Return ONLY the extracted result (or fallback NONE).
- No explanations.
- No punctuation.
- Single line only.

Answer:
"""

    responsetxt, logs = await dispatcher.submit(prompt)

    return responsetxt.upper(), logs
