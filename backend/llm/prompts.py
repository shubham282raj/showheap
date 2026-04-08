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


async def get_tmdb_id(
    filename: str, show_name: str, description: str, candidates: list
):
    prompt = f"""
You are selecting the best matching TMDB entry.

Inputs:

Filename:
{filename}

Extracted Show Name:
{show_name}

Description:
{description}

Candidate Entries (each has: title, id, release_date, media_type):
{candidates}


Task:
Pick the SINGLE best matching entry.


Matching Strategy (VERY IMPORTANT):

1. TITLE MATCH (highest priority)
   - Prefer exact or near-exact matches with the extracted show name.
   - Ignore differences in punctuation, dots, casing.
   - Example: "Breaking.Bad" → "Breaking Bad"

2. MEDIA TYPE MATCH
   - Determine whether the content is a MOVIE or TV show using clues:
     • TV clues → S01E01, Season, Episode, multi-episode, "Complete Season"
     • Movie clues → year (e.g., 2019), no episode pattern, "BluRay", "WEB-DL"
   - Match this with candidate.media_type ("tv" or "movie").
   - Strongly prefer correct media type over title similarity if conflict exists.

3. RELEASE DATE VALIDATION
   - Extract year hints from filename or description.
     Examples:
       "The.Dark.Knight.2008" → 2008
       "Avatar.2022" → 2022
   - Compare with candidate.release_date.
   - Prefer candidates with matching or very close year.

4. DESCRIPTION CONTEXT
   - Use description to disambiguate remakes, sequels, or similarly named titles.

5. IGNORE:
   - Resolution (1080p, 720p)
   - Codec (x264, HEVC)
   - Release groups
   - File extensions


Decision Rules:

- Choose the candidate that best satisfies ALL:
  title similarity + correct media_type + matching release year.
- If title matches but media_type is wrong → REJECT.
- If multiple titles match → use release_date to decide.
- If still ambiguous → pick the closest overall match.
- If NONE of the candidates reasonably match the title → return -1.
- Do NOT force a match if title similarity is low or unrelated.

Output Rules:

- Return ONLY the numerical id.
- No explanation.
- No text.
- No formatting.
- Single line only.


Examples:

Example 1:
Filename: Breaking.Bad.S04E13.1080p.mkv
Show Name: Breaking Bad
Candidates:
[
  {{ "title": "Breaking Bad", "id": 1396, "release_date": "2008-01-20", "media_type": "tv" }},
  {{ "title": "Breaking Bad Movie", "id": 9999, "release_date": "2015-01-01", "media_type": "movie" }}
]
Output:
1396


Example 2:
Filename: The.Dark.Knight.2008.1080p.BluRay.mkv
Show Name: The Dark Knight
Candidates:
[
  {{ "title": "The Dark Knight", "id": 155, "release_date": "2008-07-18", "media_type": "movie" }},
  {{ "title": "The Dark Knight Returns", "id": 49026, "release_date": "2012-09-25", "media_type": "movie" }}
]
Output:
155


Example 3:
Filename: The.Office.US.S02E03.mkv
Show Name: The Office
Candidates:
[
  {{ "title": "The Office", "id": 2316, "release_date": "2005-03-24", "media_type": "tv" }},
  {{ "title": "The Office", "id": 10429, "release_date": "1995-07-01", "media_type": "tv" }}
]
Output:
2316


Example 4:
Filename: Avatar.2009.1080p.mkv
Show Name: Avatar
Candidates:
[
  {{ "title": "Avatar", "id": 19995, "release_date": "2009-12-18", "media_type": "movie" }},
  {{ "title": "Avatar: The Last Airbender", "id": 246, "release_date": "2005-02-21", "media_type": "tv" }}
]
Output:
19995

Example 5 (No Match → Fallback):
Filename: The.Walking.Dead.2023.1080p.mkv
Show Name: The Walking Dead
Candidates:
[
  {{ "title": "Inception", "id": 27205, "release_date": "2010-07-16", "media_type": "movie" }},
  {{ "title": "Interstellar", "id": 157336, "release_date": "2014-11-07", "media_type": "movie" }}
]
Output:
-1

Answer:
"""

    responsetxt, logs = await dispatcher.submit(prompt)

    return responsetxt.strip(), logs


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
