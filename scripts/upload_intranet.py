#!/usr/bin/env python3
"""Upload Growth zip to intranet prototype catalog and start it."""
from __future__ import annotations

import json
import mimetypes
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

HOST = "http://10.24.53.237"
PROJECT_ID = "growth-workbench"
DISPLAY_NAME = "增长工作台"
ZIP_PATH = Path(__file__).resolve().parents[1] / "growth-workbench.zip"
PORT = "4181"
START = "PYTHONUNBUFFERED=1 python3 scripts/run_intranet.py"
OPEN_URL = f":{PORT}/"
BACKEND_PORT = "8787"


def request(method: str, path: str, data: bytes | None = None, headers: dict | None = None):
    req = Request(HOST + path, data=data, method=method)
    for key, value in (headers or {}).items():
        req.add_header(key, value)
    try:
        with urlopen(req, timeout=180) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw.decode("utf-8")) if raw else {}
    except HTTPError as err:
        raw = err.read()
        try:
            body = json.loads(raw.decode("utf-8"))
        except Exception:
            body = {"error": raw.decode("utf-8", errors="replace")}
        raise SystemExit(f"HTTP {err.code} {path}: {body}") from err
    except URLError as err:
        raise SystemExit(f"无法连接 {HOST}: {err}") from err


def multipart(fields: dict[str, str], files: dict[str, Path]) -> tuple[bytes, str]:
    boundary = "----GrowthUpload" + uuid.uuid4().hex
    chunks: list[bytes] = []
    for name, value in fields.items():
        chunks.append(f"--{boundary}\r\n".encode("utf-8"))
        chunks.append(
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode("utf-8")
        )
    for name, path in files.items():
        filename = path.name
        ctype = mimetypes.guess_type(filename)[0] or "application/zip"
        chunks.append(f"--{boundary}\r\n".encode("utf-8"))
        chunks.append(
            (
                f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
                f"Content-Type: {ctype}\r\n\r\n"
            ).encode("utf-8")
        )
        chunks.append(path.read_bytes())
        chunks.append(b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode("utf-8"))
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


def main() -> None:
    if not ZIP_PATH.is_file():
        raise SystemExit(f"找不到 {ZIP_PATH}，请先运行 pack_intranet.py")

    body, ctype = multipart(
        {"id": PROJECT_ID, "displayName": DISPLAY_NAME},
        {"pack": ZIP_PATH},
    )
    print(f"uploading {ZIP_PATH.name} ({ZIP_PATH.stat().st_size} bytes) ...")
    _status, uploaded = request("POST", "/_api/upload", body, {"Content-Type": ctype})
    print("upload", json.dumps(uploaded, ensure_ascii=False))

    patch = {
        "displayName": DISPLAY_NAME,
        "startCommand": START,
        "port": PORT,
        "backendPort": BACKEND_PORT,
        "openUrl": OPEN_URL,
    }
    _status, saved = request(
        "PATCH",
        f"/_api/projects/{PROJECT_ID}",
        json.dumps(patch, ensure_ascii=False).encode("utf-8"),
        {"Content-Type": "application/json"},
    )
    print("patch", json.dumps(saved, ensure_ascii=False))

    _status, started = request("POST", f"/_api/projects/{PROJECT_ID}/start")
    print("start", json.dumps(started, ensure_ascii=False))
    print(f"open http://10.24.53.237{OPEN_URL}")
    print("card http://10.24.53.237/")


if __name__ == "__main__":
    main()
