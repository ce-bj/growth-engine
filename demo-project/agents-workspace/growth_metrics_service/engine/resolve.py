# -*- coding: utf-8 -*-
"""把用户随口说的指标名解析成字典里的 ref。不含 LLM。"""
from __future__ import annotations

import re
from typing import Any

from . import store

_PREFIX = re.compile(
    r"^(请|麻烦|帮我|给我|我想|我要|想)?"
    r"(查一下|看一下|问一下|查下|看下|问下|查询|查看|查查|看看|"
    r"查|看|问)+"
)
_SUFFIX = re.compile(
    r"(是多少|有多少|多少|数据|指标|切片|明细|"
    r"啊|呢|呀|吧|嘛|哦|哈|的)+$"
)
_PUNCT = re.compile(r"[？?！!。，,、；;：:\s]+")


def normalize_metric_query(query: str) -> str:
    q = (query or "").strip()
    q = _PUNCT.sub("", q)
    q = _PREFIX.sub("", q)
    q = _SUFFIX.sub("", q)
    return q.strip()


def resolve_metric_query(query: str) -> dict[str, Any]:
    """用户原话 / 简称 / 误拼 → 字典里的 ref 列表。"""
    raw = (query or "").strip()
    q = normalize_metric_query(raw)
    metrics = store.metric_dict()["metrics"]
    empty = {
        "query": raw,
        "normalized": q,
        "match": "none",
        "refs": [],
        "note": "",
        "candidates": _rank_candidates(q, metrics)[:8],
    }
    if not q:
        empty["note"] = "没有识别到指标名"
        return empty

    by_ref = {m["ref"]: m for m in metrics}

    if q in by_ref:
        return _hit(raw, q, [q], "exact_ref")

    name_hits = [m["ref"] for m in metrics if m.get("name") == q]
    if name_hits:
        return _hit(raw, q, name_hits, "exact_name")

    plain_hits = [m["ref"] for m in metrics if (m.get("plain") or "") == q]
    if plain_hits:
        return _hit(raw, q, plain_hits, "exact_plain")

    if "@" in q:
        left, right = q.split("@", 1)
        left, right = left.strip(), right.strip()
        exact_pair = [
            m["ref"] for m in metrics
            if m.get("name") == left and m.get("dim") == right
        ]
        if exact_pair:
            return _hit(raw, q, exact_pair, "exact_ref")

        swapped = [
            m["ref"] for m in metrics
            if m.get("name") in {right + left, left + right}
        ]
        if swapped:
            return _hit(
                raw, q, swapped, "swapped",
                note=f"没有「{q}」这条，已按「{swapped[0]}」取数。"
                if len(swapped) == 1
                else f"没有「{q}」这条，相近的有 {len(swapped)} 条。",
            )

        same_name = [m for m in metrics if m.get("name") == left]
        if same_name:
            refs = [m["ref"] for m in same_name]
            dims = "、".join(m.get("dim") or "" for m in same_name)
            return {
                "query": raw,
                "normalized": q,
                "match": "wrong_dim",
                "refs": [],
                "note": f"「{left}」没有「{right}」这个维度，现有维度：{dims}。",
                "candidates": [
                    _cand(m, 90) for m in same_name
                ] + [c for c in _rank_candidates(q, metrics) if c["ref"] not in refs][:5],
            }

    contains = [
        m["ref"] for m in metrics
        if q in (m.get("ref") or "") or q in (m.get("name") or "")
    ]
    if len(contains) == 1:
        return _hit(raw, q, contains, "contains")
    if len(contains) > 1:
        return _hit(
            raw, q, contains, "contains",
            note=f"「{q}」对应 {len(contains)} 条指标，已全部返回。",
        )

    empty["note"] = f"没有「{q}」这条指标。下面是相近的名字，请原样再查，不要改写成 UV@某维度。"
    return empty


def _hit(
    raw: str,
    q: str,
    refs: list[str],
    match: str,
    note: str = "",
) -> dict[str, Any]:
    if len(refs) > 1 and not note:
        note = f"同名有 {len(refs)} 个维度，已全部返回。只要其中一个请带维度，例如 {refs[0]}。"
    return {
        "query": raw,
        "normalized": q,
        "match": match,
        "refs": refs,
        "note": note,
        "candidates": [],
    }


def _cand(m: dict[str, Any], score: int) -> dict[str, Any]:
    return {
        "ref": m.get("ref"),
        "name": m.get("name"),
        "dim": m.get("dim"),
        "plain": m.get("plain") or "",
        "score": score,
    }


def _rank_candidates(q: str, metrics: list[dict[str, Any]]) -> list[dict[str, Any]]:
    tokens = [t for t in re.split(r"[@×xX/\\|\s]+", q) if t]
    ranked: list[dict[str, Any]] = []
    for m in metrics:
        blob = f"{m.get('ref','')}{m.get('name','')}{m.get('dim','')}{m.get('plain','')}"
        score = 0
        if q and q in (m.get("ref") or ""):
            score += 80
        if q and q in (m.get("name") or ""):
            score += 70
        for t in tokens:
            if t and t in blob:
                score += 15
        if score:
            ranked.append(_cand(m, score))
    ranked.sort(key=lambda x: (-x["score"], x["ref"] or ""))
    return ranked
