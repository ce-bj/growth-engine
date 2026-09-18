#!/usr/bin/env python3
"""本地 AgentScope 环境自检。"""
from __future__ import annotations

import sys
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent
OUTPUTS = WORKSPACE.parent


def _ensure_paths() -> None:
    for p in (OUTPUTS, WORKSPACE):
        s = str(p)
        if s not in sys.path:
            sys.path.insert(0, s)


def main() -> None:
    _ensure_paths()
    print("Python:", sys.version.split()[0])
    from agentscope._version import __version__

    print("AgentScope:", __version__)
    from agentscope.agent import Agent, ReActConfig
    from agentscope.tool import Toolkit, FunctionTool

    print("Agent / Toolkit / FunctionTool: OK")

    for pkg in ("b2b_portal_agent", "product_detail_page_agent"):
        try:
            mod = __import__(pkg, fromlist=["build_agent", "AGENT_NAME"])
            agent = mod.build_agent()
            print(f"{pkg}: {mod.AGENT_NAME} -> {type(agent).__name__}")
        except Exception as exc:  # noqa: BLE001
            print(f"{pkg}: SKIP -", exc)


if __name__ == "__main__":
    main()
