# -*- coding: utf-8 -*-
"""候选经验待确认（链路 A 最小版）。

Agent 只有提议权。运营确认后才允许把文件内容追加进 hypothesis_lib.json。
本模块不自动入库。
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PENDING_DIR = Path(__file__).resolve().parent / "pending"


def propose_hypothesis(
    *,
    name: str,
    layer: str,
    when_text: str,
    how_to_verify: str,
    metrics_needed: list[str],
    site_id: str,
    note: str = "",
) -> dict[str, Any]:
    PENDING_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    slug = "".join(ch if ch.isalnum() else "-" for ch in name)[:24].strip("-") or "hyp"
    path = PENDING_DIR / f"hypothesis_{now}_{slug}.json"
    payload = {
        "status": "pending_review",
        "source": "model",
        "created_at": now,
        "site_id": site_id,
        "layer": layer,
        "name": name,
        "when_text": when_text,
        "how_to_verify": how_to_verify,
        "metrics_needed": metrics_needed,
        "note": note,
        "instruction": "运营确认后，按 hypothesis_lib.json 的 when DSL 改写成机器可执行条件再入库。未确认不得生效。",
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"ok": True, "path": str(path), "status": "pending_review", "payload": payload}


def list_pending() -> list[dict[str, Any]]:
    if not PENDING_DIR.exists():
        return []
    rows = []
    for p in sorted(PENDING_DIR.glob("hypothesis_*.json")):
        rows.append(json.loads(p.read_text(encoding="utf-8")))
    return rows
