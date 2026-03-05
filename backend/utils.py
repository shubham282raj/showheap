import traceback
import os


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


import traceback
import os


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
