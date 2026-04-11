import llm.prompts as prompts
import cinemeta
import bot.botutils as botutils
import utils


async def fetchMediaDetails(metadata: dict, tglogger: botutils.TGLogger = None):
    # dummy tg logger
    if not tglogger:
        tglogger = botutils.TGLogger()

    tglogger.append({"File Name": metadata["file_name"]})

    # get catalog
    catalog = await cinemeta.get_all_catalog(metadata["file_name"])

    if not catalog:
        extracted_name, llm_logs = await prompts.extract_movie_name(
            metadata["file_name"], metadata["description"]
        )
        tglogger.append({"Extracted Name": f"'{extracted_name}'", "LLM Logs": llm_logs})
        catalog = await cinemeta.get_all_catalog(extracted_name)

    if not catalog:
        raise Exception("Workflow Error: Found 0 results while cataloging")

    # prepare for llm extraction
    candidates = []
    for candidate in catalog:
        reduced = {}
        for key in ["imdb_id", "name", "year", "type"]:
            reduced[key] = candidate.get(key, "")
        genre = set()
        for key in ["genre", "genres"]:
            if key in candidate:
                for g in candidate[key]:
                    genre.add(g)
        reduced["genres"] = list(genre)
        candidates.append(reduced)

    tglogger.append({"TMDB": f"Found {len(candidates)} matches"}, delimiter="\n")

    # # LLM: Extract tmdbID of the most relevant show
    imdb_id, llm_logs = await prompts.get_imdb_id(
        metadata["file_name"],
        metadata["description"],
        candidates,
    )
    if imdb_id == "none":
        tglogger.append({"candidates": candidates})
        raise Exception(
            f"File did not match from any of the {len(candidates)} candidates"
        )
    tglogger.append({"IMDB ID": f"'{imdb_id}'", "LLM Logs": llm_logs}, delimiter="\n")

    # Filter content from the tmdb content query
    correct_candidate = cinemeta.filter_candidates(catalog, imdb_id)
    if not correct_candidate.get("type"):
        raise Exception("Something went wrong getting media type")
    tglogger.append(
        {"Content Type": f"{correct_candidate.get("type")}"}, delimiter="\n"
    )

    # LLM: Extract Season / Episode Numbers
    if correct_candidate["type"] == "series":
        show_meta = await cinemeta.get_meta(
            correct_candidate["type"], correct_candidate["imdb_id"]
        )
        season_info = cinemeta.extract_season_info(show_meta)
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
            {
                "Episode Code Extracted": f"'{episode_code}'",
                "season": metadata["season"],
                "episodes": metadata["episodes"],
                "LLM Logs": llm_logs,
            },
            delimiter="\n",
        )

    tglogger.append("WorkFlow Successful: Fetch Media Details", markdown=False)

    content_details = {
        "imdb_id": correct_candidate.get("imdb_id"),
        "media_type": correct_candidate.get("type"),
        "name": correct_candidate.get("name"),
        "description": correct_candidate.get("description"),
        "lower_name": correct_candidate.get("name", "").lower(),
        "genre": correct_candidate.get("genre", []),
        "background": correct_candidate.get("background"),
        "poster": correct_candidate.get("poster"),
        "logo": correct_candidate.get("logo"),
    }

    metadata["imdb_id"] = correct_candidate.get("imdb_id")
    metadata["media_type"] = correct_candidate.get("type")

    return content_details, metadata
