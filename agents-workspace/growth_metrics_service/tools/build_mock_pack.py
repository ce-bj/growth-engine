# -*- coding: utf-8 -*-
"""构造贯穿案例数据包 site_demo_b2b。

事实源：
    指标名 / 维度 = 最新《指标字典与假设方案库.xlsx》111 条
    人数漏斗 = demo-project/src/funnel-review/data.js（四渠）

案例：
    全站 UV 1650 持平 · 有效浏览率 40%→30% · 卡在流失点 1
    · 主力型号详情页落地接住率腰斩 · 四渠在该页同步变差
    · 转化交互率与留资完成率持平 · 询盘条数 47→36（死档）

facts 主键 = Excel「指标名称」。同时写入旧「名称@维度」别名，
供尚未切换字典的引擎读取。

用法：
    python -m growth_metrics_service.tools.build_mock_pack
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

OUT = Path(__file__).resolve().parents[1] / "mock" / "site_demo_b2b" / "pack.json"

SITE = "site_demo_b2b"
PERIOD = {
    "current": {"start": "2026-08-04", "end": "2026-08-31", "days": 28},
    "baseline": {
        "method": "past_4w_same_period",
        "start": "2026-07-07",
        "end": "2026-08-03",
        "days": 28,
    },
}

HERO = "/products/cnc-6061-bracket"
CAMPAIGN = "/campaign/cnc-oem-q3"
BLOG = "/blog/cnc-tolerance-guide"

CHANNELS = [
    {"key": "search", "label": "搜索引擎"},
    {"key": "direct", "label": "直接访问"},
    {"key": "referral", "label": "外部链接"},
    {"key": "ads", "label": "广告"},
]
CH_LABEL = {c["key"]: c["label"] for c in CHANNELS}

PAGES = [
    {"key": HERO, "label": "主力型号详情页 · CNC-6061 铝支架", "page_type": "product_detail"},
    {"key": "/", "label": "首页", "page_type": "home"},
    {"key": "/products", "label": "产品列表", "page_type": "list"},
    {"key": CAMPAIGN, "label": "Q3 OEM 营销落地页", "page_type": "landing"},
    {"key": BLOG, "label": "公差指南文章", "page_type": "article"},
    {"key": "/about", "label": "关于我们", "page_type": "about"},
]
ORGANIC_KWS = [
    {"key": "cnc aluminum bracket oem", "channel": "search", "landing": HERO},
    {"key": "6061 bracket manufacturer", "channel": "search", "landing": HERO},
    {"key": "cnc tolerance standard", "channel": "search", "landing": BLOG},
    {"key": "oem cnc parts moq", "channel": "search", "landing": HERO},
]
AD_KWS = [
    {"key": "cnc machining quote", "channel": "ads", "landing": CAMPAIGN},
    {"key": "oem cnc quote", "channel": "ads", "landing": CAMPAIGN},
]
SITE_SEARCH_KWS = [
    {"key": "6061 bracket drawing", "channel": "onsite"},
    {"key": "6082 bracket", "channel": "onsite"},
    {"key": "anodized finish spec", "channel": "onsite"},
]
CTA_CHANNELS = [{"key": "form", "label": "表单"}, {"key": "chat", "label": "智能客服"}]

# ---------------------------------------------------------------- 全站基本盘（四渠加总必须等于全站）
SITE_UV = (1650, 1650)
VIEW = (495, 660)
INTERACT = (74, 99)
LEAD_V = (34, 45)
LEAD_C = (36, 47)          # 询盘条数 47→36，环比 -23.4% 落死档
BOUNCE = (693, 545)        # 42% / 33%；秒退+有效浏览 ≤ UV
FORM_START = (50, 66)
FORM_DONE = (22, 29)
CHAT_START = (24, 32)
CHAT_LEAD = (12, 16)
DETAIL = (287, 383)        # 详情页到达率 58% 持平

# key: uv, view, interact, lead_v, lead_c, bounce, form_start, form_done, chat_start, chat_lead, detail
CH: dict[str, dict[str, tuple[int, int]]] = {
    "search": {
        "uv": (780, 770), "view": (195, 308), "interact": (28, 46),
        "lead_v": (12, 21), "lead_c": (13, 22), "bounce": (388, 308),
        "form_start": (18, 28), "form_done": (7, 11),
        "chat_start": (10, 17), "chat_lead": (4, 7), "detail": (101, 160),
    },
    "direct": {
        "uv": (290, 300), "view": (131, 135), "interact": (22, 23),
        "lead_v": (12, 12), "lead_c": (13, 13), "bounce": (55, 54),
        "form_start": (16, 16), "form_done": (8, 8),
        "chat_start": (6, 6), "chat_lead": (3, 3), "detail": (89, 92),
    },
    "referral": {
        "uv": (210, 220), "view": (84, 92), "interact": (12, 14),
        "lead_v": (6, 7), "lead_c": (6, 7), "bounce": (69, 62),
        "form_start": (8, 9), "form_done": (4, 4),
        "chat_start": (4, 4), "chat_lead": (2, 2), "detail": (46, 51),
    },
    "ads": {
        "uv": (370, 360), "view": (85, 125), "interact": (12, 16),
        "lead_v": (4, 5), "lead_c": (4, 5), "bounce": (181, 121),
        "form_start": (8, 13), "form_done": (3, 6),
        "chat_start": (4, 5), "chat_lead": (3, 4), "detail": (51, 80),
    },
}

# 落地页：主力型号腰斩，其余持平
# land, catch, stay_sec, p75
PG_LAND: dict[str, tuple[int, int, int, int, int, int, float, float]] = {
    HERO:     (420, 420,  92, 226, 11, 32, 0.18, 0.62),
    "/":      (310, 310, 186, 186, 34, 34, 0.52, 0.52),
    "/products": (260, 255, 99, 102, 39, 41, 0.55, 0.57),
    CAMPAIGN: (180, 180,  41,  41, 13, 13, 0.22, 0.22),
    BLOG:     (140, 140,  84,  84, 48, 48, 0.71, 0.71),
    "/about": ( 90,  90,  52,  52, 29, 29, 0.48, 0.48),
}

# 页面 UV / 合格浏览 / 页面停留秒
PG_PAGE: dict[str, tuple[int, int, int, int, int, int]] = {
    HERO:     (580, 570, 139, 319, 16, 38),
    "/":      (400, 395, 248, 241, 36, 36),
    "/products": (340, 334, 148, 149, 36, 38),
    CAMPAIGN: (220, 215,  57,  58, 14, 14),
    BLOG:     (180, 178, 140, 137, 52, 52),
    "/about": (110, 108,  64,  62, 31, 31),
}

# 四渠 × 主力型号：同步腰斩（钉页本身，不是单渠创意对不上）
CH_HERO_LAND: dict[str, tuple[int, int, int, int]] = {
    "search":   (200, 200, 44, 108),
    "direct":   ( 70,  70, 15,  38),
    "referral": ( 80,  80, 18,  43),
    "ads":      ( 70,  70, 15,  37),
}
CH_HERO_QUAL: dict[str, tuple[int, int, int, int]] = {
    "search":   (280, 275, 50, 154),
    "direct":   ( 90,  88, 22,  49),
    "referral": (110, 108, 26,  60),
    "ads":      (100,  99, 24,  55),
}

# 流失点 2 页面（比率持平）
PG_L2: dict[str, tuple[int, int, int, int, int, int]] = {
    # page_viewed, interact, exit
    HERO:     (92, 90,  8,  8, 38, 40),
    BLOG:     (84, 82,  2,  2, 32, 33),
    "/products": (110, 108, 5, 5, 20, 20),
    "/":      (150, 156, 12, 13, 41, 42),
    CAMPAIGN: (95, 99, 14, 15, 18, 19),
    "/about": (30, 31,  1,  1, 11, 11),
}
CH_HERO_L2: dict[str, tuple[int, int, int, int]] = {
    "search":   (48, 50, 3, 3),
    "direct":   (38, 36, 6, 6),
    "referral": (22, 22, 2, 2),
    "ads":      (20, 20, 2, 2),
}

# 自然搜索词：展现 / 点击持平
ORG_KW: dict[str, tuple[int, int, int, int]] = {
    "cnc aluminum bracket oem": (4200, 4100, 210, 205),
    "6061 bracket manufacturer": (1900, 1850,  95,  92),
    "cnc tolerance standard":    (1600, 1580,  80,  79),
    "oem cnc parts moq":         (1100, 1080,  55,  54),
}
ORG_KW_PAGE: dict[str, tuple[int, int, int, int]] = {
    "cnc aluminum bracket oem": (210, 205, 46, 92),
    "6061 bracket manufacturer": (95,  92, 20, 41),
    "cnc tolerance standard":    (80,  79, 48, 48),
    "oem cnc parts moq":         (55,  54, 12, 24),
}
AD_KW: dict[str, tuple[int, int, int, int]] = {
    "cnc machining quote": (2600, 2550, 130, 128),
    "oem cnc quote":       (1400, 1380,  70,  69),
}
AD_KW_PAGE: dict[str, tuple[int, int, int, int]] = {
    "cnc machining quote": (130, 128, 30, 29),
    "oem cnc quote":       ( 70,  69, 16, 16),
}

EXECUTED_MEASURES = [
    {
        "id": "trial-202608-cta",
        "measure_id": "M-改产品详情-补询价入口",
        "hypothesis_id": "H-L2-09",
        "target": HERO,
        "executed_on": "2026-08-12",
        "frozen_month": "2026-07",
        "observe_month": "2026-09",
        "snapshot_before": {
            "转化交互率@页面": {
                "key": HERO,
                "value": 0.041,
                "baseline": 0.04,
                "state": "持平",
                "data_status": "ok",
            }
        },
    }
]

VISITORS: list[dict[str, Any]] = [
    {
        "id": "v01", "channel": "search", "loss": "l1",
        "ad_kw": "", "site_search": [],
        "land": HERO,
        "pages": [{ "path": HERO, "stay": 8, "scroll": 0.12 }],
        "caught": False, "viewed": False, "bounced": True,
        "interacted": False, "led": False,
    },
    {
        "id": "v02", "channel": "search", "loss": "l1",
        "ad_kw": "", "site_search": [],
        "land": HERO,
        "pages": [{ "path": HERO, "stay": 6, "scroll": 0.09 }],
        "caught": False, "viewed": False, "bounced": True,
        "interacted": False, "led": False,
    },
    {
        "id": "v03", "channel": "ads", "loss": "l1",
        "ad_kw": "cnc machining quote", "site_search": [],
        "land": CAMPAIGN,
        "pages": [{ "path": CAMPAIGN, "stay": 9, "scroll": 0.16 }],
        "caught": False, "viewed": False, "bounced": True,
        "interacted": False, "led": False,
    },
    {
        "id": "v04", "channel": "search", "loss": "l2",
        "ad_kw": "", "site_search": ["6061 bracket drawing"],
        "land": BLOG,
        "pages": [
            { "path": BLOG, "stay": 74, "scroll": 0.82 },
            { "path": "/products", "stay": 18, "scroll": 0.4 },
            { "path": HERO, "stay": 41, "scroll": 0.33 },
        ],
        "caught": True, "viewed": True, "bounced": False,
        "interacted": False, "led": False,
    },
    {
        "id": "v05", "channel": "direct", "loss": "l2",
        "ad_kw": "", "site_search": [],
        "land": "/",
        "pages": [
            { "path": "/", "stay": 22, "scroll": 0.45 },
            { "path": HERO, "stay": 88, "scroll": 0.7 },
            { "path": "/about", "stay": 36, "scroll": 0.55 },
            { "path": "/", "stay": 14, "scroll": 0.28 },
            { "path": HERO, "stay": 40, "scroll": 0.38 },
        ],
        "caught": True, "viewed": True, "bounced": False,
        "interacted": False, "led": False,
    },
    {
        "id": "v06", "channel": "search", "loss": "l3",
        "ad_kw": "", "site_search": [],
        "land": HERO,
        "pages": [{ "path": HERO, "stay": 96, "scroll": 0.64 }],
        "caught": True, "viewed": True, "bounced": False,
        "interacted": True, "led": False,
    },
    {
        "id": "v07", "channel": "direct", "loss": None,
        "ad_kw": "", "site_search": [],
        "land": HERO,
        "pages": [{ "path": HERO, "stay": 140, "scroll": 0.78 }],
        "caught": True, "viewed": True, "bounced": False,
        "interacted": True, "led": True,
    },
    {
        "id": "v08", "channel": "referral", "loss": "l1",
        "ad_kw": "", "site_search": [],
        "land": HERO,
        "pages": [{ "path": HERO, "stay": 7, "scroll": 0.1 }],
        "caught": False, "viewed": False, "bounced": True,
        "interacted": False, "led": False,
    },
    {
        "id": "v09", "channel": "ads", "loss": "l2",
        "ad_kw": "cnc machining quote", "site_search": [],
        "land": CAMPAIGN,
        "pages": [
            { "path": CAMPAIGN, "stay": 41, "scroll": 0.58 },
            { "path": HERO, "stay": 22, "scroll": 0.28 },
        ],
        "caught": True, "viewed": True, "bounced": False,
        "interacted": False, "led": False,
    },
    {
        "id": "v10", "channel": "ads", "loss": "l3",
        "ad_kw": "oem cnc quote", "site_search": [],
        "land": CAMPAIGN,
        "pages": [
            { "path": CAMPAIGN, "stay": 28, "scroll": 0.4 },
            { "path": HERO, "stay": 72, "scroll": 0.55 },
        ],
        "caught": True, "viewed": True, "bounced": False,
        "interacted": True, "led": False,
    },
]

LOSS_LABEL = {
    "l1": "没看进去",
    "l2": "看了没动手",
    "l3": "动手没留下",
}

EXCEL_NAMES = [
    "全站留资数", "全站留资率", "全站有效浏览率", "全站转化交互率", "全站留资完成率",
    "全站UV", "搜索引擎UV占比", "直接访问UV占比", "外部链接UV占比", "广告UV占比",
    "全站秒退率", "全站有效浏览访客", "全站转化交互访客", "全站留资访客",
    "健康度待处理问题数", "健康度待处理问题列表",
    "搜索引擎UV", "直接访问UV", "外部链接UV", "广告UV",
    "搜索引擎留资率", "直接访问留资率", "外部链接留资率", "广告留资率",
    "搜索引擎留资数", "直接访问留资数", "外部链接留资数", "广告留资数",
    "自然搜索词展现量", "自然搜索词点击量", "广告关键词展现量", "广告关键词点击量",
    "搜索引擎有效浏览率", "直接访问有效浏览率", "外部链接有效浏览率", "广告有效浏览率",
    "搜索引擎秒退率", "直接访问秒退率", "外部链接秒退率", "广告秒退率",
    "落地接住率", "合格浏览率",
    "搜索引擎落地接住率", "直接访问落地接住率", "外部链接落地接住率", "广告落地接住率",
    "搜索引擎合格浏览率", "直接访问合格浏览率", "外部链接合格浏览率", "广告合格浏览率",
    "广告关键词落地接住率", "落地停留均值", "页面停留均值", "滚动深度P75", "按广告词页面停留",
    "搜索引擎转化交互率", "直接访问转化交互率", "外部链接转化交互率", "广告转化交互率",
    "全站表单开始率", "搜索引擎表单开始率", "直接访问表单开始率", "外部链接表单开始率", "广告表单开始率",
    "全站开聊率", "搜索引擎开聊率", "直接访问开聊率", "外部链接开聊率", "广告开聊率",
    "全站详情页到达率", "搜索引擎详情页到达率", "直接访问详情页到达率", "外部链接详情页到达率", "广告详情页到达率",
    "未转化页出口率", "页面转化交互率",
    "搜索引擎页面转化交互率", "直接访问页面转化交互率", "外部链接页面转化交互率", "广告页面转化交互率",
    "人均有效浏览页数", "人均浏览页数", "单页深读占比",
    "站内搜索关键词数", "站内搜索0关键词", "站内搜索0结果率", "搜后离站率", "路径UV",
    "表单曝光率", "页面内容", "询价入口个数",
    "搜索引擎留资完成率", "直接访问留资完成率", "外部链接留资完成率", "广告留资完成率",
    "全站表单完成率", "搜索引擎表单完成率", "直接访问表单完成率", "外部链接表单完成率", "广告表单完成率",
    "全站开聊留资率", "搜索引擎开聊留资率", "直接访问开聊留资率", "外部链接开聊留资率", "广告开聊留资率",
    "表单留资占比", "智能客服留资占比", "意图留资率", "高价值线索占比", "页面留资率",
    "访客当日浏览档案",
]


def rate(n: int | float, d: int | float) -> float | None:
    return None if not d else round(n / d, 6)


def slot(n: int | float, d: int | float | None) -> dict[str, Any]:
    out: dict[str, Any] = {"numerator": n}
    if d is not None:
        out["denominator"] = d
        out["value"] = rate(n, d)
    else:
        out["value"] = n
    return out


def pair(cur_n, cur_d, base_n, base_d, key: str = "__site__") -> dict[str, Any]:
    return {"key": key, "current": slot(cur_n, cur_d), "baseline": slot(base_n, base_d)}


def visitor_archive(v: dict[str, Any]) -> dict[str, Any]:
    led = v["led"]
    return {
        "访客渠道": CH_LABEL[v["channel"]],
        "访客落地页": v["land"],
        "访客广告关键词": v["ad_kw"] or None,
        "访客站内搜索词": list(v["site_search"]),
        "访客页面序列": [p["path"] for p in v["pages"]],
        "访客页面停留": [p["stay"] for p in v["pages"]],
        "访客落地是否接住": v["caught"],
        "访客是否有效浏览": v["viewed"],
        "访客是否秒退": v["bounced"],
        "访客是否转化交互": v["interacted"],
        "访客是否留资": led,
        "访客流失点": "留下了" if led else LOSS_LABEL.get(v["loss"] or "", ""),
        "访客出口页": None if led else v["pages"][-1]["path"],
    }


def _sum_ch(field: str, idx: int) -> int:
    return sum(CH[c][field][idx] for c in CH)


def _assert_funnel() -> None:
    assert _sum_ch("uv", 0) == SITE_UV[0] and _sum_ch("uv", 1) == SITE_UV[1]
    assert _sum_ch("view", 0) == VIEW[0] and _sum_ch("view", 1) == VIEW[1]
    assert _sum_ch("interact", 0) == INTERACT[0] and _sum_ch("interact", 1) == INTERACT[1]
    assert _sum_ch("lead_v", 0) == LEAD_V[0] and _sum_ch("lead_v", 1) == LEAD_V[1]
    assert _sum_ch("lead_c", 0) == LEAD_C[0] and _sum_ch("lead_c", 1) == LEAD_C[1]
    assert _sum_ch("bounce", 0) == BOUNCE[0] and _sum_ch("bounce", 1) == BOUNCE[1]
    for c, row in CH.items():
        assert row["bounce"][0] + row["view"][0] <= row["uv"][0], c
        assert row["bounce"][1] + row["view"][1] <= row["uv"][1], c
    assert BOUNCE[0] + VIEW[0] <= SITE_UV[0]
    hero_land = sum(v[0] for v in CH_HERO_LAND.values())
    hero_catch = sum(v[2] for v in CH_HERO_LAND.values())
    assert hero_land == PG_LAND[HERO][0]
    assert hero_catch == PG_LAND[HERO][2]


def main() -> None:
    _assert_funnel()
    facts: dict[str, dict[str, Any]] = {}

    def put(ref: str, slices: list[dict[str, Any]]) -> None:
        facts[ref] = {"slices": slices}

    def alias(new_name: str, old_ref: str) -> None:
        facts[old_ref] = facts[new_name]

    def put_ch(excel_suffix: str, old_ref: str, field_n: str, field_d: str | None) -> None:
        old_slices = []
        for c in CHANNELS:
            row = CH[c["key"]]
            n, bn = row[field_n]
            d = bd = None
            if field_d:
                d, bd = row[field_d]
            put(f"{c['label']}{excel_suffix}", [pair(n, d, bn, bd)])
            old_slices.append(pair(n, d, bn, bd, c["key"]))
        put(old_ref, old_slices)

    # ---------------- 扫描
    put("全站UV", [pair(SITE_UV[0], None, SITE_UV[1], None)])
    alias("全站UV", "UV@全站")
    put("全站留资数", [pair(LEAD_C[0], None, LEAD_C[1], None)])
    alias("全站留资数", "留资数@全站")
    put("全站留资率", [pair(LEAD_C[0], SITE_UV[0], LEAD_C[1], SITE_UV[1])])
    alias("全站留资率", "留资率@全站")
    put("全站有效浏览率", [pair(VIEW[0], SITE_UV[0], VIEW[1], SITE_UV[1])])
    alias("全站有效浏览率", "有效浏览率@全站")
    put("全站转化交互率", [pair(INTERACT[0], VIEW[0], INTERACT[1], VIEW[1])])
    alias("全站转化交互率", "转化交互率@全站")
    put("全站留资完成率", [pair(LEAD_V[0], INTERACT[0], LEAD_V[1], INTERACT[1])])
    alias("全站留资完成率", "留资完成率@全站")
    put("全站秒退率", [pair(BOUNCE[0], SITE_UV[0], BOUNCE[1], SITE_UV[1])])
    alias("全站秒退率", "秒退率@全站")
    put("全站有效浏览访客", [pair(VIEW[0], None, VIEW[1], None)])
    alias("全站有效浏览访客", "有效浏览访客@全站")
    put("全站转化交互访客", [pair(INTERACT[0], None, INTERACT[1], None)])
    alias("全站转化交互访客", "转化交互访客@全站")
    put("全站留资访客", [pair(LEAD_V[0], None, LEAD_V[1], None)])
    alias("全站留资访客", "留资访客@全站")
    put("健康度待处理问题数", [pair(0, None, 0, None)])
    alias("健康度待处理问题数", "健康度待处理问题数@全站")
    put("健康度待处理问题列表", [
        {"key": "__site__", "current": {"value": [], "high_risk": 0}, "baseline": {"value": []}},
    ])
    alias("健康度待处理问题列表", "健康度待处理问题列表@全站")

    share_old = []
    for c in CHANNELS:
        uv, uv_b = CH[c["key"]]["uv"]
        put(f"{c['label']}UV占比", [pair(uv, SITE_UV[0], uv_b, SITE_UV[1])])
        share_old.append(pair(uv, SITE_UV[0], uv_b, SITE_UV[1], c["key"]))
    put("渠道UV占比@渠道", share_old)

    # ---------------- 访问入口
    put_ch("UV", "UV@渠道", "uv", None)
    put_ch("留资率", "留资率@渠道", "lead_c", "uv")
    put_ch("留资数", "留资数@渠道", "lead_c", None)

    put("自然搜索词展现量", [pair(v[0], None, v[1], None, k) for k, v in ORG_KW.items()])
    put("自然搜索词点击量", [pair(v[2], None, v[3], None, k) for k, v in ORG_KW.items()])
    put("广告关键词展现量", [pair(v[0], None, v[1], None, k) for k, v in AD_KW.items()])
    put("广告关键词点击量", [pair(v[2], None, v[3], None, k) for k, v in AD_KW.items()])
    all_imp = (
        [pair(v[0], None, v[1], None, k) for k, v in ORG_KW.items()]
        + [pair(v[0], None, v[1], None, k) for k, v in AD_KW.items()]
    )
    all_clk = (
        [pair(v[2], None, v[3], None, k) for k, v in ORG_KW.items()]
        + [pair(v[2], None, v[3], None, k) for k, v in AD_KW.items()]
    )
    put("来路关键词展现量@搜索词", all_imp)
    put("来路关键词点击量@搜索词", all_clk)

    # ---------------- 流失点 1
    put_ch("有效浏览率", "有效浏览率@渠道", "view", "uv")
    put_ch("秒退率", "秒退率@渠道", "bounce", "uv")

    put("落地接住率", [
        pair(v[2], v[0], v[3], v[1], k) for k, v in PG_LAND.items()
    ])
    alias("落地接住率", "落地接住率@页面")
    put("合格浏览率", [
        pair(v[2], v[0], v[3], v[1], k) for k, v in PG_PAGE.items()
    ])
    alias("合格浏览率", "合格浏览率@页面")
    put("落地停留均值", [
        pair(v[4] * v[0], v[0], v[5] * v[1], v[1], k) for k, v in PG_LAND.items()
    ])
    alias("落地停留均值", "落地停留均值@页面")
    put("页面停留均值", [
        pair(v[4] * v[0], v[0], v[5] * v[1], v[1], k) for k, v in PG_PAGE.items()
    ])
    alias("页面停留均值", "页面停留均值@页面")
    put("滚动深度P75", [
        {
            "key": k,
            "current": {"value": v[6], "denominator": v[0]},
            "baseline": {"value": v[7], "denominator": v[1]},
        }
        for k, v in PG_LAND.items()
    ])
    alias("滚动深度P75", "滚动深度P75@页面")

    catch_x, qual_x = [], []
    for c in CHANNELS:
        land = CH_HERO_LAND[c["key"]]
        qual = CH_HERO_QUAL[c["key"]]
        put(f"{c['label']}落地接住率", [pair(land[2], land[0], land[3], land[1], HERO)])
        put(f"{c['label']}合格浏览率", [pair(qual[2], qual[0], qual[3], qual[1], HERO)])
        catch_x.append(pair(land[2], land[0], land[3], land[1], f"{c['key']}|{HERO}"))
        qual_x.append(pair(qual[2], qual[0], qual[3], qual[1], f"{c['key']}|{HERO}"))
    put("落地接住率@渠道×页", catch_x)
    put("合格浏览率@渠道×页", qual_x)

    landing_ad = {k["key"]: k["landing"] for k in AD_KWS}
    landing_org = {k["key"]: k["landing"] for k in ORGANIC_KWS}
    put("广告关键词落地接住率", [
        pair(v[2], v[0], v[3], v[1], f"{k}|{landing_ad[k]}") for k, v in AD_KW_PAGE.items()
    ])
    put("按广告词页面停留", [
        pair(v[0] * 12, v[0], v[1] * 13, v[1], f"{k}|{landing_ad[k]}")
        for k, v in AD_KW_PAGE.items()
    ])
    alias("按广告词页面停留", "按词页面停留@搜索词×页")
    put("落地接住率@搜索词×页", [
        pair(v[2], v[0], v[3], v[1], f"{k}|{landing_org[k]}") for k, v in ORG_KW_PAGE.items()
    ] + [
        pair(v[2], v[0], v[3], v[1], f"{k}|{landing_ad[k]}") for k, v in AD_KW_PAGE.items()
    ])

    # ---------------- 流失点 2
    put_ch("转化交互率", "转化交互率@渠道", "interact", "view")
    put("全站表单开始率", [pair(FORM_START[0], VIEW[0], FORM_START[1], VIEW[1])])
    alias("全站表单开始率", "表单开始率@全站")
    put_ch("表单开始率", "表单开始率@渠道", "form_start", "view")
    put("全站开聊率", [pair(CHAT_START[0], VIEW[0], CHAT_START[1], VIEW[1])])
    alias("全站开聊率", "开聊率@全站")
    put_ch("开聊率", "开聊率@渠道", "chat_start", "view")
    put("全站详情页到达率", [pair(DETAIL[0], VIEW[0], DETAIL[1], VIEW[1])])
    alias("全站详情页到达率", "详情页到达率@全站")
    put_ch("详情页到达率", "详情页到达率@渠道", "detail", "view")

    put("页面转化交互率", [
        pair(v[2], v[0], v[3], v[1], k) for k, v in PG_L2.items()
    ])
    alias("页面转化交互率", "转化交互率@页面")
    interact_x = []
    for c in CHANNELS:
        n = CH_HERO_L2[c["key"]]
        put(f"{c['label']}页面转化交互率", [pair(n[2], n[0], n[3], n[1], HERO)])
        interact_x.append(pair(n[2], n[0], n[3], n[1], f"{c['key']}|{HERO}"))
    put("转化交互率@渠道×页", interact_x)

    total_exit = sum(v[4] for v in PG_L2.values())
    total_exit_b = sum(v[5] for v in PG_L2.values())
    put("未转化页出口率", [
        pair(v[4], total_exit, v[5], total_exit_b, k) for k, v in PG_L2.items()
    ])
    alias("未转化页出口率", "未转化页出口率@页面")

    put("人均有效浏览页数", [pair(round(VIEW[0] * 2.6), VIEW[0], round(VIEW[1] * 2.6), VIEW[1])])
    alias("人均有效浏览页数", "人均有效浏览页数@全站")
    put("人均浏览页数", [pair(round(SITE_UV[0] * 1.9), SITE_UV[0], round(SITE_UV[1] * 1.9), SITE_UV[1])])
    alias("人均浏览页数", "人均浏览页数@全站")
    put("单页深读占比", [pair(round(VIEW[0] * 0.41), VIEW[0], round(VIEW[1] * 0.41), VIEW[1])])
    alias("单页深读占比", "单页深读占比@全站")
    put("站内搜索关键词数", [pair(37, None, 39, None)])
    alias("站内搜索关键词数", "站内搜索关键词数@全站")
    put("站内搜索0关键词", [
        {
            "key": "__site__",
         "current": {"value": ["6082 bracket", "anodized finish spec"]},
            "baseline": {"value": ["anodized finish spec"]},
        },
    ])
    alias("站内搜索0关键词", "站内搜索0关键词@全站")
    put("站内搜索0结果率", [pair(11, 138, 11, 146)])
    alias("站内搜索0结果率", "站内搜索0结果率@全站")

    onsite_exit = {
        "6061 bracket drawing": (4, 18, 4, 17),
        "6082 bracket": (6, 8, 5, 8),
        "anodized finish spec": (5, 9, 5, 9),
    }
    put("搜后离站率", [pair(v[0], v[1], v[2], v[3], k) for k, v in onsite_exit.items()])
    alias("搜后离站率", "搜后离站率@搜索词")
    put("路径UV", [
        pair(210, None, 205, None, f"/ > /products > {HERO}"),
        pair(180, None, 176, None, f"{HERO} > /"),
        pair(95, None, 92, None, f"{BLOG} > /products > {HERO}"),
    ])
    alias("路径UV", "路径UV@路径")
    put("表单曝光率", [])
    alias("表单曝光率", "表单曝光率@页面")
    put("询价入口个数", [
        {"key": HERO, "current": {"value": 1}, "baseline": {"value": 1}},
        {"key": CAMPAIGN, "current": {"value": 1}, "baseline": {"value": 1}},
    ])
    alias("询价入口个数", "询价入口个数@页面")
    put("页面内容", [
        {
            "key": HERO,
            "current": {
                "value": {
                    "title": "CNC-6061 铝合金精密支架 | OEM 定制加工",
                    "first_screen": "专业 CNC 加工服务商 · 20 年经验 · 全球交付",
                    "sections": ["公司介绍", "服务优势", "规格表", "认证", "怎么报价", "相关产品"],
                    "has": {"规格表": True, "认证": True, "怎么报价": True},
                    "hero_params_visible": False,
                    "material": "6061-T6",
                    "wall_thickness": "待确认",
                    "last_redesign": "2026-08-02",
                },
            },
            "baseline": {
                "value": {
                    "first_screen": "CNC-6061 铝合金精密支架 · 公差 ±0.01mm · 6061-T6",
                    "hero_params_visible": True,
                },
            },
        },
    ])
    alias("页面内容", "页面内容@页面")

    put("访客当日浏览档案", [
        {
            "key": v["id"],
            "current": {"value": visitor_archive(v)},
            "baseline": {"value": None},
        }
        for v in VISITORS
    ])

    # ---------------- 流失点 3
    put_ch("留资完成率", "留资完成率@渠道", "lead_v", "interact")
    put("全站表单完成率", [pair(FORM_DONE[0], FORM_START[0], FORM_DONE[1], FORM_START[1])])
    alias("全站表单完成率", "表单完成率@全站")
    put_ch("表单完成率", "表单完成率@渠道", "form_done", "form_start")
    put("全站开聊留资率", [pair(CHAT_LEAD[0], CHAT_START[0], CHAT_LEAD[1], CHAT_START[1])])
    alias("全站开聊留资率", "开聊留资率@全站")
    put_ch("开聊留资率", "开聊留资率@渠道", "chat_lead", "chat_start")
    put("表单留资占比", [pair(FORM_DONE[0], LEAD_C[0], FORM_DONE[1], LEAD_C[1])])
    put("智能客服留资占比", [pair(CHAT_LEAD[0], LEAD_C[0], CHAT_LEAD[1], LEAD_C[1])])
    put("留资来源通道占比@通道", [
        pair(FORM_DONE[0], LEAD_C[0], FORM_DONE[1], LEAD_C[1], "form"),
        pair(CHAT_LEAD[0], LEAD_C[0], CHAT_LEAD[1], LEAD_C[1], "chat"),
    ])
    put("意图留资率", [pair(14, 22, 18, 29)])
    alias("意图留资率", "意图留资率@全站")
    put("高价值线索占比", [])
    alias("高价值线索占比", "高价值线索占比@全站")
    put("页面留资率", [])
    alias("页面留资率", "页面留资率@页面")

    missing = [n for n in EXCEL_NAMES if n not in facts]
    extra_excel = [k for k in facts if k in EXCEL_NAMES]
    if missing:
        raise SystemExit(f"缺 Excel 指标：{missing}")

    pack = {
        "site_id": SITE,
        "site_label": "Demo · CNC 精密加工件外贸站",
        "site_origin": "https://www.demo-cnc-oem.com",
        "period": PERIOD,
        "case_note": (
            "贯穿案例：UV 1650 持平、有效浏览率 40%→30%、主力型号详情页落地接住率腰斩、"
            "四渠在该页同步变差、转化交互率与留资完成率持平、询盘条数 47→36"
        ),
        "metric_catalog": {
            "source": "指标字典与假设方案库.xlsx",
            "excel_metric_count": len(EXCEL_NAMES),
            "note": "facts 主键 = Excel 指标名称；名称@维度 为旧引擎别名",
        },
        "executed_measures": EXECUTED_MEASURES,
        "dimensions": {
            "渠道": CHANNELS,
            "页面": PAGES,
            "自然搜索词": ORGANIC_KWS,
            "广告关键词": AD_KWS,
            "搜索词": ORGANIC_KWS + AD_KWS + SITE_SEARCH_KWS,
            "路径": [
                {"key": f"/ > /products > {HERO}"},
                {"key": f"{HERO} > /"},
                {"key": f"{BLOG} > /products > {HERO}"},
            ],
            "访客": [{"key": v["id"]} for v in VISITORS],
            "通道": CTA_CHANNELS,
        },
        "facts": facts,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    aliases = len(facts) - len(extra_excel)
    print(f"wrote {OUT} excel={len(extra_excel)} aliases={aliases} total_refs={len(facts)}")


if __name__ == "__main__":
    main()
