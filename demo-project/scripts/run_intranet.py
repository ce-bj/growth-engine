#!/usr/bin/env python3
"""内网原型一体启动：静态页 + chat-server + agent-bridge。

由目录页启动命令调用。进程组内的子进程会随 SIGTERM 一起退出。
静态目录用 web/（构建产物），避免把 .env.server 和 Python 源码暴露到页面端口。
"""
from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB_CANDIDATES = (ROOT / "web", ROOT / "dist")
ENV_FILE = ROOT / ".env.server"
LOG_DIR = ROOT / "logs"
BRIDGE_SCRIPT = ROOT / "server" / "agent-bridge" / "bridge.py"
CHAT_SCRIPT = ROOT / "server" / "chat-server.js"


def load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("#") or "=" not in trimmed:
            continue
        key, value = trimmed.split("=", 1)
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        if key and (key not in os.environ or not str(os.environ.get(key, "")).strip()):
            os.environ[key] = value


def resolve_web_dir() -> Path:
    for candidate in WEB_CANDIDATES:
        if (candidate / "index.html").is_file():
            return candidate
    raise SystemExit("找不到前端构建产物：请先在本机执行 npm run build:intranet")


def resolve_python() -> str:
    venv = ROOT / ".venv" / "bin" / "python"
    if venv.is_file() and os.access(venv, os.X_OK):
        return str(venv)
    return sys.executable


def resolve_node() -> str:
    from shutil import which

    node = which("node")
    if not node:
        raise SystemExit("找不到 node，无法启动 chat-server")
    return node


def apply_runtime_env(web_port: int) -> None:
    load_env_file(ENV_FILE)
    agents = ROOT / "agents-workspace"
    pythonpath = os.pathsep.join(
        p for p in (str(ROOT), str(agents), os.environ.get("PYTHONPATH", "")) if p
    )
    os.environ["PYTHONPATH"] = pythonpath
    os.environ.setdefault("AGENT_PYTHON_URL", "http://127.0.0.1:8790")
    os.environ.setdefault("AGENT_BRIDGE_PORT", "8790")
    os.environ.setdefault("CHAT_SERVER_PORT", "8787")
    os.environ.setdefault("PYTHON_AGENT_MODULE", "ai_ops_assistant")
    os.environ.setdefault("PYTHONUNBUFFERED", "1")
    os.environ.setdefault("INTRANET_WEB_PORT", str(web_port))


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:  # noqa: A002
        sys.stdout.write("%s - %s\n" % (self.log_date_time_string(), format % args))
        sys.stdout.flush()


def spawn(name: str, argv: list[str], log_path: Path) -> subprocess.Popen:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    logf = log_path.open("ab")
    logf.write(f"\n===== start {name} =====\n".encode("utf-8"))
    logf.flush()
    proc = subprocess.Popen(
        argv,
        cwd=str(ROOT),
        stdout=logf,
        stderr=subprocess.STDOUT,
        env=os.environ.copy(),
        start_new_session=False,
    )
    print(f"[intranet] {name} pid={proc.pid} {' '.join(argv)}", flush=True)
    return proc


def terminate(proc: subprocess.Popen) -> None:
    if proc.poll() is not None:
        return
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()


def main() -> None:
    parser = argparse.ArgumentParser(description="demo-project 内网一体启动")
    parser.add_argument("--port", type=int, default=int(os.environ.get("INTRANET_WEB_PORT", "4179")))
    args = parser.parse_args()
    web_port = args.port
    apply_runtime_env(web_port)
    web_dir = resolve_web_dir()
    python_bin = resolve_python()
    node_bin = resolve_node()
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    if not BRIDGE_SCRIPT.is_file():
        raise SystemExit(f"缺少 {BRIDGE_SCRIPT}")
    if not CHAT_SCRIPT.is_file():
        raise SystemExit(f"缺少 {CHAT_SCRIPT}")
    if not (ROOT / "agents-workspace" / "ai_ops_assistant").is_dir():
        raise SystemExit("缺少 agents-workspace/ai_ops_assistant，请把 Agent 工作区放进本目录")

    children: list[subprocess.Popen] = [
        spawn("agent-bridge", [python_bin, str(BRIDGE_SCRIPT)], LOG_DIR / "bridge.log"),
        spawn("chat-server", [node_bin, str(CHAT_SCRIPT)], LOG_DIR / "chat.log"),
    ]

    handler = partial(QuietHandler, directory=str(web_dir))
    httpd = ThreadingHTTPServer(("0.0.0.0", web_port), handler)
    httpd.daemon_threads = True

    stopping = False

    def shutdown(*_args) -> None:
        nonlocal stopping
        if stopping:
            return
        stopping = True
        print("[intranet] shutting down", flush=True)
        for proc in children:
            terminate(proc)
        threading.Thread(target=httpd.shutdown, daemon=True).start()

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    print(f"[intranet] web  http://0.0.0.0:{web_port}/  dir={web_dir}", flush=True)
    print("[intranet] chat http://0.0.0.0:8787/  nginx /_chat/", flush=True)
    print("[intranet] bridge http://127.0.0.1:8790/", flush=True)
    try:
        httpd.serve_forever()
    finally:
        shutdown()
        time.sleep(0.2)


if __name__ == "__main__":
    main()
