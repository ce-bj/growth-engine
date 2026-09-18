# -*- coding: utf-8 -*-
"""第 3 步：下钻到异常点，并给出交叉核对。

按落点选主指标往下切，不按假设编号分支。交叉核对只回答：
「是一渠独差，还是各渠同步变差」。
"""
from __future__ import annotations

from typing import Any

from .locate import _brief
from .metrics import SITE_KEY, STATE_ANOMALY, STATE_IMPROVE, MetricSet, Slice

# 各落点用来钉「具体落到谁」的主指标
PRIMARY_BY_LAYER = {
    "访问入口": ["UV@渠道", "来路关键词点击量@搜索词", "来路关键词展现量@搜索词"],
    "流失点1": ["落地接住率@页面"],
    "流失点2": ["转化交互率@页面", "未转化页出口率@页面", "详情页到达率@全站"],
    "流失点3": ["表单完成率@全站", "开聊留资率@全站", "留资完成率@渠道"],
}

# 钉点之后陪跑的旁证，不单独占异常点
CORROBORATING_BY_LAYER = {
    "流失点1": ["落地停留均值@页面", "滚动深度P75@页面", "合格浏览率@页面", "秒退率@渠道"],
    "流失点2": ["人均有效浏览页数@全站", "站内搜索0结果率@全站"],
    "流失点3": ["留资来源通道占比@通道"],
}

CROSS_REF = {
    "流失点1": "落地接住率@渠道×页",
    "流失点2": "转化交互率@渠道×页",
}


def drill(ms: MetricSet, locate_result: dict[str, Any]) -> dict[str, Any]:
    layer = locate_result.get("loss_point")
    scopes = _build_scopes(ms)
    points = _anomaly_points(ms, layer)
    corroborating = _corroborating(ms, layer, scopes)
    cross = _cross_check(ms, layer, scopes)
    return {
        "loss_point": layer,
        "anomaly_points": points,
        "corroborating": corroborating,
        "cross_check": cross,
        "scopes": scopes,
    }


def _build_scopes(ms: MetricSet) -> dict[str, list[str]]:
    """作用域候选，供假设求值器绑定。与本期落点无关，缺的就是空列表。"""
    pages = _keys_in_state(ms, "落地接住率@页面", STATE_ANOMALY)
    interact_pages = _keys_in_state(ms, "转化交互率@页面", STATE_ANOMALY)
    detail_pages = [
        k for k in interact_pages
        if _page_meta(ms, k).get("page_type") == "product_detail"
    ]
    return {
        "anomaly_page": pages,
        "anomaly_detail_page": detail_pages,
        "anomaly_channel": _keys_in_state(ms, "UV@渠道", STATE_ANOMALY),
        "uplift_channel": _keys_in_state(ms, "UV@渠道", STATE_IMPROVE),
        "anomaly_keyword": sorted(set(
            _keys_in_state(ms, "来路关键词点击量@搜索词", STATE_ANOMALY)
            + _keys_in_state(ms, "来路关键词展现量@搜索词", STATE_ANOMALY)
        )),
        "anomaly_keyword_page": _keys_in_state(ms, "落地接住率@搜索词×页", STATE_ANOMALY),
    }


def _anomaly_points(ms: MetricSet, layer: str | None) -> list[dict[str, Any]]:
    refs = PRIMARY_BY_LAYER.get(layer or "", [])
    points: list[dict[str, Any]] = []
    for ref in refs:
        spec = ms.dict_by_ref.get(ref) or {}
        if spec.get("role") != "primary":
            # 全站主指标（详情页到达率等）也允许进异常点
            pass
        for sl in ms.all_of(ref):
            if sl.state != STATE_ANOMALY or sl.data_status != "ok":
                continue
            if sl.key == SITE_KEY and spec.get("dim") != "全站":
                continue
            points.append(_point_from_slice(ms, sl))
    return points


def _corroborating(
    ms: MetricSet, layer: str | None, scopes: dict[str, list[str]],
) -> list[dict[str, Any]]:
    refs = CORROBORATING_BY_LAYER.get(layer or "", [])
    pages = set(scopes.get("anomaly_page") or [])
    rows: list[dict[str, Any]] = []
    for ref in refs:
        spec = ms.dict_by_ref.get(ref) or {}
        dim = spec.get("dim")
        for sl in ms.all_of(ref):
            if sl.data_status != "ok":
                continue
            if dim == "页面" and pages and sl.key not in pages:
                continue
            if sl.state not in (STATE_ANOMALY, STATE_IMPROVE) and not sl.labels:
                continue
            rows.append(_point_from_slice(ms, sl))
    return rows


def _cross_check(
    ms: MetricSet, layer: str | None, scopes: dict[str, list[str]],
) -> dict[str, Any]:
    ref = CROSS_REF.get(layer or "")
    pages = scopes.get("anomaly_page") or []
    if not ref or not pages:
        return {"pattern": "无交叉", "note": "本期没有可交叉的异常页", "anomaly_count": 0}

    matched: list[Slice] = []
    usable: list[Slice] = []
    for sl in ms.all_of(ref):
        page = _page_part(sl.key)
        if page not in pages:
            continue
        if sl.data_status == "ok":
            usable.append(sl)
            if sl.state == STATE_ANOMALY:
                matched.append(sl)

    n_anom, n_ok = len(matched), len(usable)
    if n_ok == 0:
        pattern, note = "证据不足", "交叉切片全部低于最低基数"
    elif n_anom == 0:
        pattern, note = "无交叉异常", "各渠道在该页的交叉指标都没破线"
    elif n_anom == 1:
        pattern, note = "单渠", f"只有 1 条渠道在该页破线（{matched[0].key}）"
    elif n_anom == n_ok:
        pattern, note = "同步变差", f"{n_anom} 条渠道同向破线，不是单渠来路问题"
    else:
        pattern, note = "多渠", f"{n_anom}/{n_ok} 条渠道破线，未覆盖全部渠道"

    return {
        "ref": ref,
        "pattern": pattern,
        "note": note,
        "anomaly_count": n_anom,
        "usable_count": n_ok,
        "anomaly_keys": [s.key for s in matched],
        "slices": [_brief(s) for s in usable],
    }


def _point_from_slice(ms: MetricSet, sl: Slice) -> dict[str, Any]:
    dim = (ms.dict_by_ref.get(sl.ref) or {}).get("dim") or ""
    row = _brief(sl)
    row["dim"] = dim
    row["label"] = _label_for(ms, dim, sl.key)
    return row


def _keys_in_state(ms: MetricSet, ref: str, state: str) -> list[str]:
    return [
        s.key for s in ms.all_of(ref)
        if s.state == state and s.data_status == "ok" and s.key != SITE_KEY
    ]


def _page_part(key: str) -> str:
    return key.split("|", 1)[1] if "|" in key else key


def _channel_part(key: str) -> str:
    return key.split("|", 1)[0] if "|" in key else key


def _page_meta(ms: MetricSet, key: str) -> dict[str, Any]:
    for item in (ms.pack.get("dimensions") or {}).get("页面") or []:
        if item.get("key") == key:
            return item
    return {"key": key, "label": key}


def _label_for(ms: MetricSet, dim: str, key: str) -> str:
    dims = ms.pack.get("dimensions") or {}
    if dim == "页面":
        return _page_meta(ms, key).get("label") or key
    if dim == "渠道":
        for item in dims.get("渠道") or []:
            if item.get("key") == key:
                return item.get("label") or key
    if dim == "渠道×页":
        ch, page = _channel_part(key), _page_part(key)
        return f"{_label_for(ms, '渠道', ch)} × {_label_for(ms, '页面', page)}"
    if dim == "搜索词×页":
        kw, page = _channel_part(key), _page_part(key)
        return f"{kw} × {_label_for(ms, '页面', page)}"
    return key
