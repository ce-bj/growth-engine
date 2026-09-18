#!/usr/bin/env python3
"""Growth 一体启动：前端 + 对话后端。

本地源码（有 workbench/）：
  前端  工作台 5176 / 数字门户 5174 / 访客分析 5177 / 智能营销页 5186
  后端  chat-server 8787 / agent-bridge 8790

内网打包目录（根目录有 index.html 和 visitor/）：
  静态页 + chat-server + agent-bridge，并把 /_chat/ 反代到 8787。

用法（在 Growth 目录）：
  python3 scripts/run_intranet.py
  python scripts/run_intranet.py --force          # 先清占用端口
  python scripts/run_intranet.py --skip-bridge    # 只起前端和 chat-server
"""
from __future__ import annotations

import argparse
import http.client
import os
import re
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
WORKBENCH = ROOT / "workbench"
DEMO = ROOT / "demo-project"
VIS_ANALYSIS = ROOT / "vis-analysis"
MARKETING = ROOT / "marketing-frontend"
CONTENT = ROOT / "content-console"
AGENTS = ROOT / "agents-workspace"
LOG_DIR = ROOT / "logs"
DEMO_REMOTE = Path("/data/www/demo-project")
OUTPUTS = ROOT.parent

PACKED = (ROOT / "index.html").is_file() and (ROOT / "visitor" / "index.html").is_file()

if PACKED:
    ENV_FILE = ROOT / ".env.server"
    BRIDGE_SCRIPT = ROOT / "server" / "agent-bridge" / "bridge.py"
    CHAT_SCRIPT = ROOT / "server" / "chat-server.js"
    WEB_DIR = ROOT
else:
    ENV_FILE = DEMO / ".env.server"
    BRIDGE_SCRIPT = DEMO / "server" / "agent-bridge" / "bridge.py"
    CHAT_SCRIPT = DEMO / "server" / "chat-server.js"
    WEB_DIR = ROOT

CHAT_PORT = 8787
BRIDGE_PORT = 8790
WEB_PORT_DEFAULT = 4181 if PACKED else 5176

FRONTENDS = (
    ("demo-project", DEMO, 5174),
    ("vis-analysis", VIS_ANALYSIS, 5177),
    ("marketing-frontend", MARKETING, 5186),
    ("content-console", CONTENT, 5178),
    ("workbench", WORKBENCH, 5176),
)

OWN_PORTS = (5174, 5176, 5177, 5178, 5186, CHAT_PORT, BRIDGE_PORT)


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


def which_cmd(*names: str) -> str:
    for name in names:
        found = shutil.which(name)
        if found:
            return found
    return ""


def ensure_windows_comspec() -> None:
    if os.name != "nt":
        return
    comspec = os.environ.get("ComSpec") or os.environ.get("COMSPEC")
    if not comspec or not Path(comspec).is_file():
        os.environ["ComSpec"] = r"C:\Windows\System32\cmd.exe"


def resolve_node() -> str:
    node = which_cmd("node.exe", "node")
    if not node:
        raise SystemExit("找不到 node，无法启动 chat-server")
    return node


def resolve_python() -> str:
    candidates = []
    if os.name == "nt":
        candidates.extend(
            [
                ROOT / ".venv" / "Scripts" / "python.exe",
                DEMO / ".venv" / "Scripts" / "python.exe",
                OUTPUTS / "agentscope" / ".venv" / "Scripts" / "python.exe",
            ]
        )
    else:
        candidates.extend(
            [
                ROOT / ".venv" / "bin" / "python",
                DEMO_REMOTE / ".venv" / "bin" / "python",
                DEMO / ".venv" / "bin" / "python",
                OUTPUTS / "agentscope" / ".venv" / "bin" / "python",
            ]
        )
    for path in candidates:
        if path.is_file():
            return str(path)
    return sys.executable


def port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.3)
        return sock.connect_ex(("127.0.0.1", port)) == 0


def pids_listening(port: int) -> list[int]:
    pids: set[int] = set()
    if os.name == "nt":
        try:
            out = subprocess.check_output(["netstat", "-ano"], text=True, errors="replace")
        except OSError:
            return []
        needle = re.compile(rf":{port}\s")
        for line in out.splitlines():
            if "LISTENING" not in line.upper() or not needle.search(line):
                continue
            try:
                pid = int(line.split()[-1])
            except ValueError:
                continue
            if pid > 0:
                pids.add(pid)
        return sorted(pids)
    try:
        out = subprocess.check_output(["lsof", "-ti", f"TCP:{port}", "-sTCP:LISTEN"], text=True, errors="replace")
    except (OSError, subprocess.CalledProcessError):
        return []
    for raw in out.split():
        try:
            pids.add(int(raw))
        except ValueError:
            continue
    return sorted(pids)


def kill_port(port: int) -> None:
    for pid in pids_listening(port):
        print(f"[growth] --force 结束占用 :{port} 的 pid={pid}", flush=True)
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/PID", str(pid), "/T", "/F"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        else:
            try:
                os.kill(pid, signal.SIGTERM)
            except OSError:
                pass
    deadline = time.time() + 4
    while port_open(port) and time.time() < deadline:
        time.sleep(0.2)


def apply_runtime_env() -> None:
    ensure_windows_comspec()
    for candidate in (ENV_FILE, DEMO / ".env.server", DEMO_REMOTE / ".env.server"):
        load_env_file(candidate)
    pythonpath = os.pathsep.join(
        p
        for p in (
            str(ROOT),
            str(AGENTS),
            str(DEMO) if DEMO.is_dir() else "",
            str(DEMO / "agents-workspace") if (DEMO / "agents-workspace").is_dir() else "",
            str(OUTPUTS / "agents-workspace") if (OUTPUTS / "agents-workspace").is_dir() else "",
            str(DEMO_REMOTE) if DEMO_REMOTE.is_dir() else "",
            str(DEMO_REMOTE / "agents-workspace") if (DEMO_REMOTE / "agents-workspace").is_dir() else "",
            str(OUTPUTS),
            os.environ.get("PYTHONPATH", ""),
        )
        if p
    )
    os.environ["PYTHONPATH"] = pythonpath
    os.environ.setdefault("AGENT_PYTHON_URL", f"http://127.0.0.1:{BRIDGE_PORT}")
    os.environ.setdefault("AGENT_BRIDGE_PORT", str(BRIDGE_PORT))
    os.environ.setdefault("CHAT_SERVER_PORT", str(CHAT_PORT))
    os.environ.setdefault("PYTHON_AGENT_MODULE", "ai_ops_assistant")
    os.environ.setdefault("PYTHONUNBUFFERED", "1")
    public = (os.environ.get("INTRANET_PUBLIC_HOST") or "").strip()
    if public:
        host = public.split("://")[-1].split("/")[0].split(":")[0]
        origin = f"http://{host}"
        os.environ.setdefault("VITE_VISITOR_ANALYSIS_URL", f"{origin}:5177/")
        os.environ.setdefault("VITE_MARKETING_AGENT_URL", f"{origin}:5186/")
        os.environ.setdefault("VITE_CONTENT_AGENT_URL", f"{origin}:5178/?embed=1")
        os.environ.setdefault("VITE_OPS_ASSISTANT_URL", f"{origin}:5174/")
        os.environ.setdefault("VITE_PORTAL_URL", f"{origin}:5174/")


def spawn(name: str, argv: list[str], cwd: Path) -> subprocess.Popen:
    env = os.environ.copy()
    kwargs: dict = {"cwd": str(cwd), "env": env}
    if os.name == "nt":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    elif os.environ.get("GROWTH_SAME_SESSION") != "1":
        kwargs["start_new_session"] = True
    proc = subprocess.Popen(argv, **kwargs)
    print(f"[growth] {name} pid={proc.pid}  {' '.join(argv)}", flush=True)
    return proc


def terminate(proc: subprocess.Popen) -> None:
    if proc.poll() is not None:
        return
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(proc.pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        return
    try:
        os.killpg(proc.pid, signal.SIGTERM)
    except OSError:
        proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except OSError:
            proc.kill()


FORBIDDEN_PREFIXES = (
    "/server/",
    "/scripts/",
    "/agents-workspace/",
    "/logs/",
    "/.env",
)


class IntranetHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:  # noqa: A002
        sys.stdout.write("%s - %s\n" % (self.log_date_time_string(), fmt % args))
        sys.stdout.flush()

    def _forbidden(self) -> bool:
        path = urlsplit(self.path).path
        return any(path.startswith(prefix) for prefix in FORBIDDEN_PREFIXES)

    def do_GET(self) -> None:
        if self._forbidden():
            self.send_error(404)
            return
        if urlsplit(self.path).path.startswith("/_chat"):
            self.proxy_chat()
            return
        super().do_GET()

    def do_POST(self) -> None:
        if urlsplit(self.path).path.startswith("/_chat"):
            self.proxy_chat()
            return
        self.send_error(404)

    def do_OPTIONS(self) -> None:
        if urlsplit(self.path).path.startswith("/_chat"):
            self.proxy_chat()
            return
        self.send_error(404)

    def proxy_chat(self) -> None:
        parts = urlsplit(self.path)
        dest = parts.path[len("/_chat") :] or "/"
        if parts.query:
            dest = f"{dest}?{parts.query}"
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None
        headers = {
            key: value
            for key, value in self.headers.items()
            if key.lower() not in {"host", "content-length", "connection"}
        }
        if body is not None:
            headers["Content-Length"] = str(len(body))
        conn = http.client.HTTPConnection("127.0.0.1", CHAT_PORT, timeout=360)
        try:
            conn.request(self.command, dest, body=body, headers=headers)
            resp = conn.getresponse()
            self.send_response(resp.status)
            for key, value in resp.getheaders():
                if key.lower() in {"transfer-encoding", "connection", "keep-alive"}:
                    continue
                self.send_header(key, value)
            self.end_headers()
            while True:
                chunk = resp.read(8192)
                if not chunk:
                    break
                self.wfile.write(chunk)
                self.wfile.flush()
        except Exception as err:
            if not self.wfile.closed:
                try:
                    self.send_error(502, str(err))
                except Exception:
                    pass
        finally:
            conn.close()


def start_backend(skip_bridge: bool) -> list[tuple[str, subprocess.Popen]]:
    children: list[tuple[str, subprocess.Popen]] = []
    node = resolve_node()
    cwd = ROOT if PACKED else DEMO

    if not CHAT_SCRIPT.is_file():
        print("[growth] 未找到 chat-server.js，运营助手将无法对话", flush=True)
    elif port_open(CHAT_PORT):
        print(f"[growth] chat-server 已在 :{CHAT_PORT}，复用", flush=True)
    else:
        children.append(("chat-server", spawn("chat-server", [node, str(CHAT_SCRIPT)], cwd)))

    if skip_bridge:
        print("[growth] 已跳过 agent-bridge", flush=True)
        return children

    agents_ok = (AGENTS / "ai_ops_assistant").is_dir() or (DEMO / "agents-workspace" / "ai_ops_assistant").is_dir()
    if not BRIDGE_SCRIPT.is_file():
        print("[growth] 未找到 agent-bridge，已跳过", flush=True)
    elif not agents_ok:
        print("[growth] 未找到 ai_ops_assistant，已跳过 agent-bridge", flush=True)
    elif port_open(BRIDGE_PORT):
        print(f"[growth] agent-bridge 已在 :{BRIDGE_PORT}，复用", flush=True)
    else:
        python_bin = resolve_python()
        children.append(("agent-bridge", spawn("agent-bridge", [python_bin, str(BRIDGE_SCRIPT)], cwd)))
    return children


def run_packed(port: int, skip_bridge: bool) -> None:
    apply_runtime_env()
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    children = start_backend(skip_bridge)
    handler = partial(IntranetHandler, directory=str(WEB_DIR))
    httpd = ThreadingHTTPServer(("0.0.0.0", port), handler)
    httpd.daemon_threads = True
    stopping = False

    def shutdown(*_args) -> None:
        nonlocal stopping
        if stopping:
            return
        stopping = True
        print("[growth] shutting down", flush=True)
        for _name, proc in reversed(children):
            terminate(proc)
        threading.Thread(target=httpd.shutdown, daemon=True).start()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)
    print(f"[growth] web   http://0.0.0.0:{port}/", flush=True)
    print(f"[growth] chat  /_chat/  -> 127.0.0.1:{CHAT_PORT}", flush=True)
    print("[growth] portal /visitor/   assistant /visitor/?embed=assistant", flush=True)
    try:
        httpd.serve_forever()
    finally:
        shutdown()
        time.sleep(0.2)


def ensure_npm(npm: str, cwd: Path) -> None:
    if not (cwd / "package.json").is_file():
        return
    if (cwd / "node_modules").is_dir():
        return
    print(f"[growth] npm install in {cwd.name}", flush=True)
    subprocess.check_call([npm, "install"], cwd=str(cwd), env=os.environ.copy())


def start_static(name: str, cwd: Path, port: int, host: str) -> tuple[str, subprocess.Popen] | None:
    if not (cwd / "index.html").is_file():
        print(f"[growth] 跳过 {name}（没有 index.html）", flush=True)
        return None
    if port_open(port):
        print(f"[growth] {name} 已在 :{port}，复用", flush=True)
        return None
    bind = "0.0.0.0" if host in {"0.0.0.0", "::"} else host
    return (
        name,
        spawn(name, [sys.executable, "-m", "http.server", str(port), "--bind", bind], cwd),
    )


def start_frontend(name: str, cwd: Path, port: int, npm: str, host: str) -> tuple[str, subprocess.Popen] | None:
    if (cwd / "package.json").is_file():
        if port_open(port):
            print(f"[growth] {name} 已在 :{port}，复用", flush=True)
            return None
        ensure_npm(npm, cwd)
        return (
            name,
            spawn(
                name,
                [npm, "run", "dev", "--", "--host", host, "--port", str(port), "--strictPort"],
                cwd,
            ),
        )
    return start_static(name, cwd, port, host)


def wait_ports(items: list[tuple[str, int]], timeout: float = 30) -> None:
    pending = {port: name for name, port in items}
    deadline = time.time() + timeout
    while pending and time.time() < deadline:
        for port, name in list(pending.items()):
            if port_open(port):
                pending.pop(port)
        if pending:
            time.sleep(0.4)
    print("", flush=True)
    print("[growth] -------- 已启动 --------", flush=True)
    print("[growth] 前端", flush=True)
    print("[growth]   工作台       http://127.0.0.1:5176/", flush=True)
    print("[growth]   数字门户     http://127.0.0.1:5174/", flush=True)
    print("[growth]   访客分析     http://127.0.0.1:5177/", flush=True)
    print("[growth]   智能营销页   http://127.0.0.1:5186/", flush=True)
    print("[growth]   内容发布     http://127.0.0.1:5178/", flush=True)
    print("[growth] 后端", flush=True)
    print("[growth]   chat-server  http://127.0.0.1:8787/health", flush=True)
    print("[growth]   agent-bridge http://127.0.0.1:8790/health", flush=True)
    if pending:
        still = ", ".join(f"{name}:{port}" for port, name in pending.items())
        print(f"[growth] 尚未起来：{still}", flush=True)
    print("[growth] Ctrl+C 结束本次拉起的进程（复用的端口不会关）", flush=True)


def run_dev(args: argparse.Namespace) -> None:
    npm = which_cmd("npm.cmd", "npm")
    if not npm:
        raise SystemExit("找不到 npm")
    apply_runtime_env()
    if args.force:
        for port in OWN_PORTS:
            if port_open(port):
                kill_port(port)

    children: list[tuple[str, subprocess.Popen]] = []
    children.extend(start_backend(args.skip_bridge))
    for name, cwd, port in FRONTENDS:
        app = start_frontend(name, cwd, port, npm, args.host)
        if app:
            children.append(app)

    expected = [
        (name, port)
        for name, cwd, port in FRONTENDS
        if (cwd / "package.json").is_file() or (cwd / "index.html").is_file()
    ]
    expected.append(("chat-server", CHAT_PORT))
    if not args.skip_bridge:
        expected.append(("agent-bridge", BRIDGE_PORT))
    wait_ports(expected)

    stopping = False

    def shutdown(*_args) -> None:
        nonlocal stopping
        if stopping:
            return
        stopping = True
        print("\n[growth] shutting down", flush=True)
        for _name, proc in reversed(children):
            terminate(proc)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)
    try:
        while not stopping:
            if children and not any(proc.poll() is None for _n, proc in children):
                print("[growth] 子进程已全部退出", flush=True)
                break
            time.sleep(0.5)
        if not children:
            while not stopping:
                time.sleep(0.5)
    except KeyboardInterrupt:
        shutdown()
    finally:
        shutdown()


def main() -> None:
    parser = argparse.ArgumentParser(description="Growth 营销增长工作台一体启动（前端 + 后端）")
    parser.add_argument("--port", type=int, default=int(os.environ.get("INTRANET_WEB_PORT", str(WEB_PORT_DEFAULT))))
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--skip-bridge", action="store_true", help="不启动 Python agent-bridge（仍启动 chat-server）")
    parser.add_argument("--force", action="store_true", help="先结束占用 5174/5176/5177/5186/8787/8790 的进程")
    args = parser.parse_args()
    if PACKED:
        run_packed(args.port, args.skip_bridge)
        return
    run_dev(args)


if __name__ == "__main__":
    main()
