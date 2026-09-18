# -*- coding: utf-8 -*-
"""给 measure_lib.json 写入自然月复盘口径。只跑一次，结果落回 JSON。"""
from __future__ import annotations

import json
from pathlib import Path

PATH = Path(__file__).resolve().parents[1] / "config" / "measure_lib.json"

POLICY = {
    "cadence": "natural_month",
    "window": "next_full_calendar_month",
    "compare": "observe_month_vs_frozen_diagnosis_month",
    "absolute_as": "daily_average",
    "subtract_site_control": True,
    "skip_repeat_while_observing": True,
    "safety_check": "T+3_open_page_only",
    "verdicts": ["成功", "部分改善", "未改善", "看不出"],
    "plain": "改动当月不算。下一个完整自然月，对照工单冻结的那个月；绝对数按日均，并减掉全站同期变化。观察中不重出同一张工单。",
}

NO_TRACK = {
    "track": False,
    "skip_repeat_while_observing": False,
    "plain": "只出方案，不追踪执行效果。",
}

BY_ID = {
    "M-持续内容发布-承接搜索意图": {
        "track": True,
        "primary": ["来路关键词点击量@搜索词"],
        "corroborating": ["渠道UV占比@渠道"],
        "site_control": ["UV@全站"],
    },
    "M-持续内容发布-匹配词意图": {
        "track": True,
        "primary": ["来路关键词点击量@搜索词"],
        "site_control": ["UV@全站"],
    },
    "M-持续内容发布-巩固该词承接": {
        "track": True,
        "primary": ["落地接住率@搜索词×页"],
        "corroborating": ["按词页面停留@搜索词×页"],
        "site_control": ["有效浏览率@全站"],
    },
    "M-生成产品详情页-补缺型号": {
        "track": True,
        "primary": ["详情页到达率@全站"],
        "site_control": ["有效浏览率@全站"],
    },
    "M-生成产品详情页-按搜不到的词": {
        "track": True,
        "primary": ["站内搜索0结果率@全站"],
        "corroborating": ["搜后离站率@搜索词"],
        "site_control": ["详情页到达率@全站"],
    },
    "M-生成或重做营销落地页-对口承接": {
        "track": True,
        "primary": ["落地接住率@页面"],
        "site_control": ["有效浏览率@全站"],
    },
    "M-生成或重做营销落地页-按渠道来意": {
        "track": True,
        "primary": ["落地接住率@渠道×页"],
        "site_control": ["有效浏览率@全站"],
    },
    "M-改页面文案-首屏对齐来意": {
        "track": True,
        "primary": ["落地接住率@渠道×页"],
        "corroborating": ["落地停留均值@页面"],
        "site_control": ["有效浏览率@全站"],
    },
    "M-改页面文案-按词意图重写": {
        "track": True,
        "primary": ["落地接住率@搜索词×页"],
        "corroborating": ["按词页面停留@搜索词×页"],
        "site_control": ["有效浏览率@全站"],
    },
    "M-改页面文案-补详情页入口": {
        "track": True,
        "primary": ["未转化页出口率@页面"],
        "downstream": ["详情页到达率@全站"],
        "site_control": ["转化交互率@全站"],
    },
    "M-改产品详情-首屏前移": {
        "track": True,
        "primary": ["落地接住率@页面"],
        "corroborating": ["落地停留均值@页面", "滚动深度P75@页面"],
        "downstream": ["转化交互率@页面"],
        "site_control": ["有效浏览率@全站"],
    },
    "M-改产品详情-补询价入口": {
        "track": True,
        "primary": ["转化交互率@页面"],
        "site_control": ["转化交互率@全站"],
    },
    "M-改产品详情-补齐缺失项": {
        "track": True,
        "primary": ["转化交互率@页面"],
        "site_control": ["转化交互率@全站"],
    },
}


def main() -> None:
    data = json.loads(PATH.read_text(encoding="utf-8"))
    data["version"] = "1.2.0"
    data["review"] = POLICY
    seen: set[str] = set()
    for m in data["measures"]:
        mid = m["id"]
        seen.add(mid)
        if mid in BY_ID:
            m["review"] = BY_ID[mid]
        elif m.get("boundary") in ("仅展示", "系统动作"):
            m["review"] = NO_TRACK
        else:
            m["review"] = {"track": True}
    missing = set(BY_ID) - seen
    if missing:
        raise SystemExit(f"measure id 对不上：{missing}")
    order = ["version", "source", "note", "opsclaw_skills", "boundaries", "review", "measures"]
    data = {k: data[k] for k in order if k in data}
    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tracked = sum(1 for m in data["measures"] if m["review"].get("track"))
    print(f"wrote {PATH.name}  measures={len(data['measures'])} tracked={tracked}")


if __name__ == "__main__":
    main()
