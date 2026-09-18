# -*- coding: utf-8 -*-
"""知识层与数据包加载。config/*.json 是唯一事实源，这里只读不写。"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / "config"
MOCK_DIR = ROOT / "mock"


def _read(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def metric_dict() -> dict[str, Any]:
    return _read(CONFIG_DIR / "metric_dict.json")


@lru_cache(maxsize=1)
def metrics_by_ref() -> dict[str, dict[str, Any]]:
    return {m["ref"]: m for m in metric_dict()["metrics"]}


@lru_cache(maxsize=1)
def hypothesis_lib() -> dict[str, Any]:
    return _read(CONFIG_DIR / "hypothesis_lib.json")


@lru_cache(maxsize=1)
def measure_lib() -> dict[str, Any]:
    return _read(CONFIG_DIR / "measure_lib.json")


@lru_cache(maxsize=1)
def thresholds() -> dict[str, Any]:
    return _read(CONFIG_DIR / "thresholds.json")


@lru_cache(maxsize=8)
def load_pack(site_id: str) -> dict[str, Any]:
    sid = {"site_demo_cnc": "site_demo_b2b"}.get(site_id, site_id)
    path = MOCK_DIR / sid / "pack.json"
    if not path.exists():
        available = [p.name for p in MOCK_DIR.iterdir() if p.is_dir()]
        raise FileNotFoundError(f"未找到数据包 {site_id}；已有：{available}")
    return _read(path)
