import re
import httpx
import env

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_ACCESS_TOKEN = env.TMDB_ACCESS_TOKEN


async def queryv3(full_path: str, query_params: dict | None = None):
    """
    Makes a TMDB v3 API request.

    :param full_path: TMDB endpoint path (e.g., "search/movie")
    :param query_params: Dictionary of query parameters
    :return: Parsed JSON response
    """

    if query_params is None:
        query_params = {}

    url = f"{TMDB_BASE_URL}/{full_path}"

    try:
        async with httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {TMDB_ACCESS_TOKEN}",
                "Accept": "application/json",
            }
        ) as client:
            response = await client.get(url, params=query_params, timeout=10.0)
    except httpx.ConnectError as e:
        raise Exception(
            f"TMDB ConnectError: Could not reach {url}\n"
            f"Possible causes: no internet, TMDB blocked by ISP, or bad API key.\n"
            f"Details: {e}"
        ) from e
    except httpx.TimeoutException as e:
        raise Exception(f"TMDB request timed out for URL: {url}\nDetails: {e}") from e
    except httpx.RequestError as e:
        raise Exception(f"TMDB request failed for URL: {url}\nDetails: {e}") from e

    if response.status_code != 200:
        raise Exception(
            f"TMDB Error {response.status_code}\nURL: {response.request.url}\nResponse: {response.text}"
        )

    try:
        return response.json()
    except Exception:
        raise Exception(f"Invalid JSON returned:\n{response.text}")


def clean_multi_search_query(candidates_list: str):
    results = []

    for item in candidates_list:
        reduced_item = {
            "id": item.get("id"),
            "title": item.get("title") or item.get("name"),
            "original_title": item.get("original_title") or item.get("original_name"),
            "original_language": item.get("original_language"),
            "release_date": item.get("release_date") or item.get("first_air_date"),
            "media_type": item.get("media_type"),
        }

        if reduced_item["title"] or reduced_item["original_title"]:
            results.append(reduced_item)

    return results


def filter_content(candidates_list: list, tmdbID: int):
    for item in candidates_list:
        itemID = item.get("id")
        if itemID == tmdbID:
            return item
    return None


def extract_season_info(show_details: dict):
    season_data = []

    for season in show_details.get("seasons", []):
        season_data.append(
            {
                "season_number": season.get("season_number"),
                "episode_count": season.get("episode_count"),
            }
        )

    return {
        "name": show_details.get("name"),
        "total_seasons": show_details.get("number_of_seasons"),
        "total_episodes": show_details.get("number_of_episodes"),
        "seasons": season_data,
    }


def parse_SxxExx(code: str):
    match = re.match(r"S(\d{2})E(\d{2})", code)
    if not match:
        return None

    season = int(match.group(1))
    episode = int(match.group(2))

    return season, episode
