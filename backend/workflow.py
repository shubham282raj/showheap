import llm
import tmdb
import bot.botutils as botutils


async def fetchMediaDetails(metadata: dict, tglogger: botutils.TGLogger = None):
    # dummy tg logger
    if not tglogger:
        tglogger = botutils.TGLogger()

    tglogger.append({"File Name": metadata["file_name"]})

    # LLM: Extract content name
    extracted_name = await llm.extract_movie_name(
        metadata["file_name"], metadata["description"]
    )
    tglogger.append({"Extracted Name": f"'{extracted_name}'"})

    # FETCH: Query tmdb contents using extracted name
    candidates = await tmdb.queryv3("search/multi", {"query": extracted_name})
    if not candidates.get("results"):
        raise Exception("Workflow Error: Found 0 results Extracted Name")
    tglogger.append({"TMDB:": f"Found {len(candidates)} matches"}, delimiter="\n")
    reduced_candidates = tmdb.clean_multi_search_query(candidates)

    # LLM: Extract tmdbID of the most relevant show
    tmdbID = await llm.get_tmdb_id(
        metadata["file_name"], extracted_name, reduced_candidates
    )
    tmdbID = int(tmdbID)
    metadata["tmdb_id"] = tmdbID
    tglogger.append({"TMDB ID": f"'{tmdbID}'"}, delimiter="\n")

    # Filter content from the tmdb content query
    content_candidate = tmdb.filter_content(candidates, tmdbID)
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
        episode_code = await llm.extract_episode(metadata["file_name"], season_info)
        metadata["episode_code"] = episode_code

        tglogger.append({"Episode Code Extracted": f"'{episode_code}'"}, delimiter="\n")

    tglogger.append("WorkFlow Successful: Fetch Media Details", markdown=False)

    return content_details
