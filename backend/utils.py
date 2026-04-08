import traceback
import os
import pyffx
import env
from urllib.parse import quote
import re


class SingletonMeta(type):
    _instance = None

    def __call__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__call__(*args, **kwargs)
        return cls._instance


def _pretty_format(data, indent=0, markdown: bool = False):
    spacing = "    " * indent

    # If dictionary
    if isinstance(data, dict):
        lines = []
        for key, value in data.items():
            if isinstance(value, (dict, list)):
                lines.append(f"{spacing}{key}:")
                lines.append(_pretty_format(value, indent + 1, markdown=markdown))
            else:
                lines.append(
                    f"{spacing}{key}: {_pretty_format(value, markdown=markdown)}"
                )
        return "\n".join(lines)

    # If list
    elif isinstance(data, list):
        lines = []
        for item in data:
            if isinstance(item, (dict, list)):
                lines.append(_pretty_format(item, indent + 1, markdown=markdown))
            else:
                lines.append(f"{spacing}- {_pretty_format(item, markdown=markdown)}")
        return "\n".join(lines)

    # If primitive (int, str, float, bool, etc.)
    else:
        return f"{spacing}`{data}`" if markdown else f"{spacing}{data}"


def pretty_format(*args, markdown: bool = False, delimiter="\n"):
    formatted = [_pretty_format(arg, markdown=markdown) for arg in args]
    return delimiter.join(formatted)


def shortenError(e: Exception):
    tb = traceback.extract_tb(e.__traceback__) if e.__traceback__ else []

    if tb:
        last = tb[-1]
        filename = os.path.basename(last.filename)
        line = last.lineno
    else:
        filename = "unknown"
        line = "?"

    return f"ERROR\n{filename} line{line}\n{type(e).__name__}: {e}"


def format_size(size: str | int):
    size = int(size)
    if size >= 1024**3:
        return f"{round(size / (1024**3), 2)} GB"
    elif size >= 1024**2:
        return f"{round(size / (1024**2), 2)} MB"
    else:
        return f"{round(size / 1024, 2)} KB"


def wrap_str(s: str, max_len: int) -> str:
    return "\n".join(s[i : i + max_len] for i in range(0, len(s), max_len))


class FPE:
    SECRET = env.FPE_SECRET.encode() if env.FPE_SECRET else None
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    @staticmethod
    def encode_string(s: str):
        if not FPE.SECRET:  # skip encoding
            return s
        cipher = pyffx.String(FPE.SECRET, alphabet=FPE.alphabet, length=len(s))
        return cipher.encrypt(s)

    @staticmethod
    def decode_string(s: str):
        if not FPE.SECRET:  # skip decoding
            return s
        cipher = pyffx.String(FPE.SECRET, alphabet=FPE.alphabet, length=len(s))
        return cipher.decrypt(s)


def sanitize_header(v: str) -> str:
    return v.encode("latin-1", "ignore").decode("latin-1")


def fix_content_disposition(cd: str, force_download: bool = False) -> str:

    if force_download:
        if "inline" in cd:
            cd = cd.replace("inline", "attachment", 1)
        else:
            cd = "attachment"

    # Extract filename if exists
    if "filename=" in cd:
        try:
            filename = cd.split("filename=")[-1].strip('"')
            safe_filename = filename.encode("latin-1", "ignore").decode("latin-1")

            return (
                f'attachment; filename="{safe_filename}"; '
                f"filename*=UTF-8''{quote(filename)}"
            )
        except Exception:
            pass

    return sanitize_header(cd)


def build_episode_code(season=-1, episode_start=-1, episode_end=-1):

    if episode_start == episode_end:
        return f"S{season:02d}E{episode_start:02d}"

    return f"S{season:02d}E{episode_start:02d}-{episode_end:02d}"


def parse_episode_code(code: str):
    code = code.strip().upper()

    if code == "NONE":
        return [], []

    # season range (S04-S06)
    m = re.match(r"S(\d+)-S(\d+)", code)
    if m:
        start, end = map(int, m.groups())
        seasons = list(range(start, end + 1))
        return seasons, []  # no episode info

    # episode (single or range)
    m = re.match(r"S(\d+)E(\d+)(?:-(\d+))?", code)
    if m:
        season = int(m.group(1))
        ep_start = int(m.group(2))
        ep_end = int(m.group(3)) if m.group(3) else ep_start

        episodes = list(range(ep_start, ep_end + 1))
        return [season], episodes

    # fallback
    return [], []
