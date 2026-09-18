#!/usr/bin/env python3
"""把工作台 / 访客分析 / 智能营销页 / 对话后端打成可上传 zip。"""
from __future__ import annotations

import shutil
import zipfile
from pathlib import Path

GROWTH = Path(__file__).resolve().parents[1]
PACK = GROWTH / "_intranet_web"
ZIP_PATH = GROWTH / "growth-workbench.zip"
SKIP_DIRS = {"node_modules", "dist", ".git", "__pycache__", ".venv", ".vite", ".vercel"}


def copy_tree(src: Path, dst: Path) -> None:
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(
        src,
        dst,
        ignore=shutil.ignore_patterns(*SKIP_DIRS, "*.pyc", ".DS_Store"),
    )


def main() -> None:
    sources = (
        (GROWTH / "workbench" / "dist", PACK),
        (GROWTH / "demo-project" / "dist", PACK / "visitor"),
        (GROWTH / "vis-analysis" / "dist", PACK / "vis-analysis"),
        (GROWTH / "marketing-frontend" / "dist", PACK / "marketing"),
    )
    for src, _dst in sources:
        if not (src / "index.html").is_file():
            raise SystemExit(f"找不到构建产物 {src / 'index.html'}，请先 vite build")

    if PACK.exists():
        shutil.rmtree(PACK)
    PACK.mkdir(parents=True)

    shutil.copytree(GROWTH / "workbench" / "dist", PACK, dirs_exist_ok=True)
    copy_tree(GROWTH / "demo-project" / "dist", PACK / "visitor")
    copy_tree(GROWTH / "vis-analysis" / "dist", PACK / "vis-analysis")
    copy_tree(GROWTH / "marketing-frontend" / "dist", PACK / "marketing")
    copy_tree(GROWTH / "content-console", PACK / "content")
    copy_tree(GROWTH / "demo-project" / "server", PACK / "server")

    agents_src = GROWTH / "agents-workspace"
    if not (agents_src / "ai_ops_assistant").is_dir():
        agents_src = GROWTH / "demo-project" / "agents-workspace"
    copy_tree(agents_src, PACK / "agents-workspace")

    scripts_dir = PACK / "scripts"
    scripts_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(GROWTH / "scripts" / "run_intranet.py", scripts_dir / "run_intranet.py")

    start_sh = PACK / "start.sh"
    start_sh.write_text(
        "#!/usr/bin/env bash\nset -euo pipefail\ncd \"$(dirname \"$0\")\"\n"
        "export PYTHONUNBUFFERED=1\nexec python3 scripts/run_intranet.py \"$@\"\n",
        encoding="utf-8",
    )

    required = (
        PACK / "index.html",
        PACK / "visitor" / "index.html",
        PACK / "vis-analysis" / "index.html",
        PACK / "marketing" / "index.html",
        PACK / "content" / "index.html",
        PACK / "server" / "chat-server.js",
        PACK / "server" / "agent-bridge" / "bridge.py",
        PACK / "scripts" / "run_intranet.py",
        PACK / "agents-workspace" / "ai_ops_assistant",
    )
    missing = [str(p) for p in required if not p.exists()]
    if missing:
        raise SystemExit("打包缺文件：\n" + "\n".join(missing))

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in PACK.rglob("*"):
            if path.is_file():
                zf.write(path, path.relative_to(PACK).as_posix())

    size_mb = ZIP_PATH.stat().st_size / (1024 * 1024)
    with zipfile.ZipFile(ZIP_PATH) as zf:
        n = len(zf.namelist())
    print(f"web  {PACK}")
    print(f"zip  {ZIP_PATH}  {size_mb:.2f} MB  {n} files")


if __name__ == "__main__":
    main()
