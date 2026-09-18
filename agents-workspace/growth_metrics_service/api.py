# -*- coding: utf-8 -*-
"""指标数据分析服务对外入口。不含 LLM。"""
from __future__ import annotations

from typing import Any

from .engine.metrics import MetricSet
from .engine.resolve import resolve_metric_query
from .engine.snapshot import build_snapshot
from .engine.store import ROOT
from .pending import propose_hypothesis as _propose


def get_snapshot(site_id: str = "site_demo_b2b") -> dict[str, Any]:
    """一次拿到扫描 / 定位 / 下钻 / 假设核对 / 带交接提示词的任务。"""
    return build_snapshot(site_id)


def get_metric_detail(
    ref: str,
    site_id: str = "site_demo_b2b",
    key: str = "",
) -> dict[str, Any]:
    """追问时取指标切片。ref 可以是字典主键，也可以是用户原话（如「路径UV」「帮我查路径UV」）。"""
    ms = MetricSet(site_id)
    resolved = resolve_metric_query(ref)
    refs: list[str] = resolved["refs"]
    base = {
        "ok": bool(refs),
        "query": resolved["query"],
        "normalized": resolved["normalized"],
        "match": resolved["match"],
        "refs": refs,
        "note": resolved["note"],
    }
    if not refs:
        base["error"] = resolved["note"] or "没有这个指标"
        base["candidates"] = resolved["candidates"]
        base["hint"] = "把用户说的名字原样再传，不要改写成 UV@某维度。"
        return base

    packs = []
    for r in refs:
        spec = ms.dict_by_ref.get(r)
        if key:
            sl = ms.get(r, key)
            packs.append({
                "ref": r,
                "spec": spec,
                "key": key,
                "slice": None if sl is None else sl.as_dict(),
            })
        else:
            packs.append({
                "ref": r,
                "spec": spec,
                "slices": [s.as_dict() for s in ms.all_of(r)],
            })

    if len(packs) == 1:
        base["ref"] = packs[0]["ref"]
        base["spec"] = packs[0]["spec"]
        if key:
            base["key"] = key
            base["slice"] = packs[0]["slice"]
        else:
            base["slices"] = packs[0]["slices"]
        return base

    base["metrics"] = packs
    if key:
        base["key"] = key
        base["slice"] = next((p["slice"] for p in packs if p.get("slice")), None)
    else:
        flat: list[dict[str, Any]] = []
        for p in packs:
            flat.extend(p.get("slices") or [])
        base["slices"] = flat
        base["spec"] = None
    return base


def get_page_content(page_path: str, site_id: str = "site_demo_b2b") -> dict[str, Any]:
    """读页正文，写任务说明用。抓不到就喊人，不编。"""
    ms = MetricSet(site_id)
    sl = ms.get("页面内容@页面", page_path)
    if sl is None or sl.data_status != "ok" or sl.value in (None, ""):
        return {
            "page_path": page_path,
            "ok": False,
            "reason": (sl.gap_reason if sl else "数据包没有这一页"),
        }
    meta = {}
    for item in (ms.pack.get("dimensions") or {}).get("页面") or []:
        if item.get("key") == page_path:
            meta = item
            break
    cta = ms.get("询价入口个数@页面", page_path)
    return {
        "page_path": page_path,
        "ok": True,
        "url": _full_page_url(ms, page_path),
        "label": meta.get("label"),
        "page_type": meta.get("page_type"),
        "content": sl.value,
        "询价入口个数": None if cta is None else cta.value,
    }


def propose_hypothesis(
    name: str,
    layer: str,
    when_text: str,
    how_to_verify: str,
    metrics_needed: list[str] | None = None,
    site_id: str = "site_demo_b2b",
    note: str = "",
) -> dict[str, Any]:
    """库内全不命中时由 Agent 提候选，落 pending/，没有入库权。"""
    return _propose(
        name=name,
        layer=layer,
        when_text=when_text,
        how_to_verify=how_to_verify,
        metrics_needed=metrics_needed or [],
        site_id=site_id,
        note=note,
    )


def list_sites() -> list[str]:
    mock = ROOT / "mock"
    return [p.name for p in mock.iterdir() if p.is_dir() and (p / "pack.json").exists()]


def _full_page_url(ms: MetricSet, page_path: str) -> str:
    origin = (ms.pack.get("site_origin") or "").rstrip("/")
    if not origin:
        return page_path
    if page_path.startswith("http"):
        return page_path
    return origin + (page_path if page_path.startswith("/") else "/" + page_path)


__all__ = [
    "get_snapshot",
    "get_metric_detail",
    "get_page_content",
    "propose_hypothesis",
    "list_sites",
    "resolve_metric_query",
]
