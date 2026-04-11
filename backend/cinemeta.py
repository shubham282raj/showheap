import httpx
import asyncio
import logging
from collections import defaultdict
from urllib.parse import quote


client = httpx.AsyncClient()


async def get_catalog(type: str, query: str):
    response = await client.get(
        f"https://v3-cinemeta.strem.io/catalog/{type}/top/search={quote(query)}.json",
        follow_redirects=True,
        timeout=30.0,
    )

    if response.status_code != 200:
        raise Exception("Cinemeta query failed")

    return response.json()


async def get_meta(type: str, imdb_id: str):
    response = await client.get(
        f"https://v3-cinemeta.strem.io/meta/{type}/{imdb_id}.json",
        follow_redirects=True,
        timeout=30.0,
    )

    if response.status_code != 200:
        raise Exception("Cinemeta query failed")

    return response.json()


async def get_all_catalog(query):
    catalogs = await asyncio.gather(
        get_catalog("movie", query),
        get_catalog("series", query),
        return_exceptions=True,
    )

    result = []

    for catalog in catalogs:
        if isinstance(catalog, Exception):
            logging.error(f"Catalog fetch failed: {catalog}")
            continue

        for show in catalog.get("metas", []):
            result.append(show)

    return result


def filter_candidates(candidates: list, imdb_id: str):
    for candidate in candidates:
        if imdb_id == candidate["imdb_id"]:
            return candidate

    return None


def extract_season_info(show_details: dict):
    videos = show_details.get("meta", {}).get("videos", [])

    seasons = defaultdict(int)

    for ep in videos:
        season = ep.get("season")

        if season is None:
            continue

        seasons[season] += 1

    # build season_data list (same format as before)
    season_data = [
        {
            "season_number": season,
            "episode_count": count,
        }
        for season, count in sorted(seasons.items())
    ]

    return {
        "name": show_details.get("meta", {}).get("name"),
        "total_seasons": len(seasons),
        "total_episodes": sum(seasons.values()),
        "seasons": season_data,
    }
