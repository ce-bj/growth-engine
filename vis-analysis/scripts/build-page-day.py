"""Turn MCP markdown dumps of page-day metrics into catalog TSV files."""
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1] / "src" / "detail-board"
TOOLS = Path(r"C:\Users\范勇健\.cursor\projects\c-Users-qoderwork-workspace-mqaotdz1p13gu04b-outputs\agent-tools")
CHANNEL = {"ALL": "all", "直接访问": "direct", "搜索引擎": "search", "外部链接": "referral", "广告": "ads"}

JOBS = {
    "lanbao": {
        "d7": TOOLS / "35dfd1bb-654b-466c-bb3f-d9be7f75485a.txt",
        "p7": TOOLS / "a395773f-0dcb-4bc8-9190-284c94bcac30.txt",
        "d30": TOOLS / "005e2b25-a8ca-40d1-a80d-6c575a936e4c.txt",
        "d90": TOOLS / "45f0b420-c72e-489e-811b-a8eef1be492d.txt",
        "out": ROOT / "catalog" / "page-day.tsv",
        "pages": ROOT / "catalog" / "pages.tsv",
    },
    "goody": {
        "d7": TOOLS / "0e9c61c7-1e54-472d-bee9-93454bf2d45e.txt",
        "p7": TOOLS / "5b98bffd-2adb-4e48-9aef-c18b1640a2b0.txt",
        "d30": TOOLS / "b233ab02-2fce-47e7-af8a-366e48f32deb.txt",
        "d90": TOOLS / "330f6b38-5473-4836-973b-e3bd164a05ae.txt",
        "out": ROOT / "catalog" / "goody" / "page-day.tsv",
        "pages": ROOT / "catalog" / "goody" / "pages.tsv",
    },
}


def norm(path):
    text = unquote(path or "/")
    for mark in ("#", "?"):
        if mark in text:
            text = text.split(mark, 1)[0]
    if not text.startswith("/"):
        text = "/" + text
    if len(text) > 1 and text.endswith("/"):
        text = text[:-1]
    return text or "/"


def parse(path):
    rows = []
    seen = set()
    splitter = re.compile(r"\\\|")
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line.startswith("|") or line.startswith("| line") or line.startswith("| ---"):
            continue
        cell = line.strip().strip("|").strip()
        parts = splitter.split(cell)
        if len(parts) < 10:
            continue
        key = tuple(parts[:10])
        if key in seen:
            continue
        seen.add(key)
        rows.append(parts[:10])
    return rows


def main():
    for name, job in JOBS.items():
        lines = []
        index = defaultdict(dict)
        for win in ("d7", "p7", "d30", "d90"):
            rows = parse(job[win])
            unknown = sorted({row[0] for row in rows if row[0] not in CHANNEL})
            print(name, win, "rows", len(rows), "unknown", unknown)
            for ch, path, qual, uv, scroll, samples, viewed, convert, edit, submit in rows:
                cid = CHANNEL[ch]
                key = norm(path)
                index[(win, cid)][key] = True
                lines.append("\t".join([win, cid, key, qual, uv, scroll, samples, viewed, convert, edit, submit]))
        for (win, cid), bag in index.items():
            folded = defaultdict(list)
            for key in bag:
                folded[key.lower()].append(key)
            clashes = {key: paths for key, paths in folded.items() if len(paths) > 1}
            if clashes:
                print(" case clash", name, win, cid, list(clashes.items())[:2])
        job["out"].write_text("\n".join(lines) + "\n", encoding="utf-8")
        catalog = defaultdict(list)
        for raw in job["pages"].read_text(encoding="utf-8").splitlines():
            if not raw.strip():
                continue
            win, cid, path, _pv, uv, _sec = raw.split("\t")[:6]
            catalog[(win, cid)].append((norm(path), int(uv or 0)))
        print("---", name, "match ---")
        for win in ("d7", "d30", "d90"):
            for cid in ("all", "search", "direct", "referral", "ads", "ai"):
                rows = catalog.get((win, cid))
                if not rows:
                    continue
                bag = index.get((win, cid), {})
                folded = {key.lower() for key in bag}
                hit = hit_uv = total_uv = case_only = 0
                for path, uv in rows:
                    total_uv += uv
                    if path in bag:
                        hit += 1
                        hit_uv += uv
                    elif path.lower() in folded:
                        case_only += 1
                share = hit / len(rows)
                uv_share = hit_uv / total_uv if total_uv else 0
                print(f"{win:4} {cid:9} pages {len(rows):4} hit {hit:4} ({share:6.1%}) uv {hit_uv}/{total_uv} ({uv_share:6.1%}) case_only {case_only}")


if __name__ == "__main__":
    main()
