import llm.prompts as prompts
import tmdb
import bot.botutils as botutils
import utils


async def fetchMediaDetails(metadata: dict, tglogger: botutils.TGLogger = None):
    # dummy tg logger
    if not tglogger:
        tglogger = botutils.TGLogger()

    tglogger.append({"File Name": metadata["file_name"]})

    # LLM: Extract content name
    extracted_name, llm_logs = await prompts.extract_movie_name(
        metadata["file_name"], metadata["description"]
    )
    tglogger.append({"Extracted Name": f"'{extracted_name}'", "LLM Logs": llm_logs})

    # FETCH: Query tmdb contents using extracted name
    movie_candidates = (
        await tmdb.queryv3("search/movie", {"query": extracted_name})
    ).get("results", [])
    tv_candidates = (await tmdb.queryv3("search/tv", {"query": extracted_name})).get(
        "results", []
    )

    for candidate in movie_candidates:
        candidate["media_type"] = "movie"
    for candidate in tv_candidates:
        candidate["media_type"] = "tv"

    candidates_list = movie_candidates + tv_candidates

    if not candidates_list:
        raise Exception("Workflow Error: Found 0 results Extracted Name")
    tglogger.append({"TMDB": f"Found {len(candidates_list)} matches"}, delimiter="\n")
    reduced_candidates = tmdb.clean_multi_search_query(candidates_list)

    # LLM: Extract tmdbID of the most relevant show
    tmdbID, llm_logs = await prompts.get_tmdb_id(
        metadata["file_name"],
        extracted_name,
        metadata["description"],
        reduced_candidates,
    )
    tmdbID = int(tmdbID)
    if tmdbID == -1:
        tglogger.append({"candidates": reduced_candidates})
        raise Exception(
            f"{extracted_name} did not match from any of the {len(reduced_candidates)} candidates"
        )
    metadata["tmdb_id"] = tmdbID
    tglogger.append({"TMDB ID": f"'{tmdbID}'", "LLM Logs": llm_logs}, delimiter="\n")

    # Filter content from the tmdb content query
    content_candidate = tmdb.filter_content(candidates_list, tmdbID)
    if not content_candidate:
        raise Exception("Workflow Error: tmdbID did not match with queried candidates")
    content_type = content_candidate.get("media_type")
    metadata["media_type"] = content_type
    tglogger.append({"Content Type": f"{content_type}"}, delimiter="\n")

    # FETCH: Fetch Details of the content using tmdbID
    content_details = await tmdb.queryv3(f"{content_type}/{tmdbID}")
    tglogger.append(
        {
            "Content Title": f"{content_details.get('title') or content_details.get('name')}"
        },
        delimiter="\n",
    )

    # LLM: Extract Season / Episode Numbers
    if content_type == "tv":
        season_info = tmdb.extract_season_info(content_details)
        episode_code, llm_logs = await prompts.extract_episode(
            metadata["file_name"], metadata["description"], season_info
        )
        metadata["episode_code"] = episode_code

        seasons, episodes = utils.parse_episode_code(episode_code)

        if not seasons or not episodes:
            raise Exception("No Season Info Or Episodes Info could be extracted")
        elif len(seasons) > 1:
            raise Exception("Multiple Seasons in one file is not yet suppored")

        metadata["season"] = seasons[0]
        metadata["episodes"] = episodes
        metadata["episode_start"] = episodes[0]
        metadata["episode_end"] = episodes[-1]

        tglogger.append(
            {"Episode Code Extracted": f"'{episode_code}'", "LLM Logs": llm_logs},
            delimiter="\n",
        )

    # imdb id
    external_ids = await tmdb.queryv3(f"{content_type}/{tmdbID}/external_ids")
    content_details["imdb_id"] = external_ids["imdb_id"]
    metadata["imdb_id"] = external_ids["imdb_id"]

    tglogger.append("WorkFlow Successful: Fetch Media Details", markdown=False)

    return content_details, metadata
