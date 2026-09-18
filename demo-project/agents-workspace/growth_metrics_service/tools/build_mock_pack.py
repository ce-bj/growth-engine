# -*- coding: utf-8 -*-
"""构造贯穿案例数据包 site_demo_b2b。

案例（来自方法论走查）：
    UV 1650 持平 · 有效浏览率 40%→30% · 主力型号详情页落地接住率腰斩
    · 五渠交叉同步变差 · 转化交互率与留资完成率持平

比率一律由分子分母算出，不手写，保证漏斗层层自洽。

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

CHANNELS = [
    {"key": "organic", "label": "自然搜索"},
    {"key": "paid", "label": "付费搜索"},
    {"key": "direct", "label": "直接访问"},
    {"key": "referral", "label": "外链"},
    {"key": "social", "label": "社媒"},
]
HERO = "/products/cnc-6061-bracket"
PAGES = [
    {"key": HERO, "label": "主力型号详情页 · CNC-6061 铝支架", "page_type": "product_detail"},
    {"key": "/", "label": "首页", "page_type": "home"},
    {"key": "/products", "label": "产品列表", "page_type": "list"},
    {"key": "/campaign/cnc-oem-q3", "label": "Q3 OEM 营销落地页", "page_type": "landing"},
    {"key": "/blog/cnc-tolerance-guide", "label": "公差指南文章", "page_type": "article"},
    {"key": "/about", "label": "关于我们", "page_type": "about"},
]
KEYWORDS = [
    {"key": "cnc machined aluminum bracket", "channel": "organic", "landing": HERO},
    {"key": "6061 aluminum cnc parts", "channel": "organic", "landing": HERO},
    {"key": "cnc oem supplier china", "channel": "paid", "landing": "/campaign/cnc-oem-q3"},
]
CTA_CHANNELS = [{"key": "form", "label": "表单"}, {"key": "chat", "label": "智能客服"}]

# ---------------------------------------------------------------- 全站基本盘
SITE_UV = (1650, 1620)
EFFECTIVE = (495, 648)          # 有效浏览访客
INTERACT = (60, 80)             # 转化交互访客
LEAD_VISITOR = (33, 44)         # 留资访客
LEAD_COUNT = (34, 45)           # 去重留资条数
FORM_START = (44, 58)
FORM_SUBMIT = (24, 32)
CHAT_START = (22, 29)
CHAT_LEAD = (10, 13)
BOUNCE = (694, 535)             # 秒退访客 → 42% / 33%
DETAIL_REACH = (320, 424)       # 打开过产品详情的有效浏览访客

# ---------------------------------------------------------------- 渠道盘
# key: (UV本期, UV基线, 有效浏览本期, 有效浏览基线, 秒退本期, 秒退基线,
#        留资条数本期, 留资条数基线, 交互本期, 交互基线, 留资访客本期, 留资访客基线)
CH: dict[str, tuple[int, ...]] = {
    "organic": (620, 600, 192, 246, 254, 192, 16, 21, 24, 31, 16, 20),
    "paid":    (430, 425, 120, 166, 194, 149,  9, 12, 15, 20,  9, 12),
    "direct":  (300, 300,  99, 126, 114,  90,  5,  7, 11, 15,  5,  7),
    "referral":(180, 175,  52,  67,  77,  60,  3,  3,  6,  8,  3,  3),
    "social":  (120, 120,  32,  43,  55,  44,  1,  2,  4,  6,  1,  2),
}

# ---------------------------------------------------------------- 页面盘（落地）
# key: (落地访客本期, 落地访客基线, 接住本期, 接住基线, 落地停留秒本期, 基线, P75本期, P75基线)
PG: dict[str, tuple[Any, ...]] = {
    HERO:                        (380, 372,  84, 167, 18, 47, 0.31, 0.62),
    "/":                         (420, 415, 172, 178, 44, 46, 0.58, 0.60),
    "/products":                 (260, 255,  99,  102, 39, 41, 0.55, 0.57),
    "/campaign/cnc-oem-q3":      (210, 205,  92,  94, 51, 53, 0.63, 0.64),
    "/blog/cnc-tolerance-guide": (290, 285, 113, 117, 62, 64, 0.71, 0.72),
    "/about":                    ( 90,  88,  32,  33, 28, 29, 0.52, 0.53),
}

# 渠道 × 主力型号页：五渠同步变差（不是单渠）→ 排除「落地页和广告创意对不上」
CH_HERO: dict[str, tuple[int, int, int, int]] = {
    # 渠道: (落地访客本期, 基线, 接住本期, 基线)
    "organic":  (150, 147, 34, 68),
    "paid":     (110, 108, 23, 48),
    "direct":   ( 45,  44, 11, 20),
    "referral": ( 40,  39,  9, 17),
    "social":   ( 35,  34,  7, 14),
}

# 搜索词：展现 / 点击 都持平 → 排除「词的展现点击掉了」
KW: dict[str, tuple[int, int, int, int]] = {
    "cnc machined aluminum bracket": (4200, 4100, 210, 205),
    "6061 aluminum cnc parts":       (1900, 1850,  95,  92),
    "cnc oem supplier china":        (2600, 2550, 130, 128),
}
# 搜索词 × 页 落地接住率
KW_PAGE: dict[str, tuple[int, int, int, int]] = {
    "cnc machined aluminum bracket": (210, 205, 46, 92),
    "6061 aluminum cnc parts":       ( 95,  92, 20, 41),
    "cnc oem supplier china":        (130, 128, 57, 59),
}

# 流失点2 页面：比率没变，只是人少了 → 不落流失点2
PG_L2: dict[str, tuple[int, int, int, int, int, int, int, int]] = {
    # 页面: (该页UV本期, 基线, 合格浏览本期, 基线,
    #        该页有效浏览访客本期, 基线, 该页转化交互本期, 基线)
    HERO:                        (410, 402, 121, 239,  84, 167, 15, 31),
    "/":                         (520, 512, 232, 232, 150, 156, 12, 13),
    "/products":                 (340, 334, 148, 149, 110, 115,  9, 10),
    "/campaign/cnc-oem-q3":      (245, 240, 121, 121,  95,  99, 14, 15),
    "/blog/cnc-tolerance-guide": (330, 325, 152, 153, 120, 126,  6,  6),
    "/about":                    (105, 103,  41,  41,  30,  31,  1,  1),
}
# 页面停留均值（秒）：本期, 基线。首屏被换掉的那页同步变短
PG_DWELL: dict[str, tuple[int, int]] = {
    HERO: (24, 52),
    "/": (41, 43),
    "/products": (36, 38),
    "/campaign/cnc-oem-q3": (48, 50),
    "/blog/cnc-tolerance-guide": (66, 68),
    "/about": (26, 27),
}
# 未转化页出口人数（本期, 基线）
PG_EXIT: dict[str, tuple[int, int]] = {
    HERO: (22, 44),
    "/": (41, 42),
    "/products": (33, 34),
    "/campaign/cnc-oem-q3": (18, 19),
    "/blog/cnc-tolerance-guide": (52, 54),
    "/about": (11, 11),
}


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


def main() -> None:
    facts: dict[str, dict[str, Any]] = {}

    def put(ref: str, slices: list[dict[str, Any]]) -> None:
        facts[ref] = {"slices": slices}

    # ---------------- 扫描层（全站）
    put("UV@全站", [pair(SITE_UV[0], None, SITE_UV[1], None)])
    put("留资数@全站", [pair(LEAD_COUNT[0], None, LEAD_COUNT[1], None)])
    put("留资率@全站", [pair(LEAD_COUNT[0], SITE_UV[0], LEAD_COUNT[1], SITE_UV[1])])
    put("有效浏览率@全站", [pair(EFFECTIVE[0], SITE_UV[0], EFFECTIVE[1], SITE_UV[1])])
    put("转化交互率@全站", [pair(INTERACT[0], EFFECTIVE[0], INTERACT[1], EFFECTIVE[1])])
    put("留资完成率@全站", [pair(LEAD_VISITOR[0], INTERACT[0], LEAD_VISITOR[1], INTERACT[1])])
    put("秒退率@全站", [pair(BOUNCE[0], SITE_UV[0], BOUNCE[1], SITE_UV[1])])
    put("有效浏览访客@全站", [pair(EFFECTIVE[0], None, EFFECTIVE[1], None)])
    put("转化交互访客@全站", [pair(INTERACT[0], None, INTERACT[1], None)])
    put("留资访客@全站", [pair(LEAD_VISITOR[0], None, LEAD_VISITOR[1], None)])
    put("健康度待处理问题数@全站", [pair(0, None, 0, None)])
    put("健康度待处理问题列表@全站", [
        {"key": "__site__", "current": {"value": [], "high_risk": 0}, "baseline": {"value": []}},
    ])

    # ---------------- 访问入口 / 渠道
    ch_uv, ch_share, ch_lead_rate, ch_lead_cnt = [], [], [], []
    ch_eff, ch_bounce, ch_interact, ch_done = [], [], [], []
    ch_form_start, ch_chat, ch_detail, ch_form_done, ch_chat_lead = [], [], [], [], []
    for c, v in CH.items():
        uv, uv_b, eff, eff_b, bo, bo_b, lead, lead_b, itr, itr_b, lv, lv_b = v
        ch_uv.append(pair(uv, None, uv_b, None, c))
        ch_share.append(pair(uv, SITE_UV[0], uv_b, SITE_UV[1], c))
        ch_lead_cnt.append(pair(lead, None, lead_b, None, c))
        ch_lead_rate.append(pair(lead, uv, lead_b, uv_b, c))
        ch_eff.append(pair(eff, uv, eff_b, uv_b, c))
        ch_bounce.append(pair(bo, uv, bo_b, uv_b, c))
        ch_interact.append(pair(itr, eff, itr_b, eff_b, c))
        ch_done.append(pair(lv, itr, lv_b, itr_b, c))
        # 表单/客服/详情页到达：按全站比例分摊，保持持平
        ch_form_start.append(pair(round(eff * 0.0889), eff, round(eff_b * 0.0895), eff_b, c))
        ch_chat.append(pair(round(eff * 0.0444), eff, round(eff_b * 0.0448), eff_b, c))
        ch_detail.append(pair(round(eff * 0.6465), eff, round(eff_b * 0.6543), eff_b, c))
        fs, fs_b = max(round(eff * 0.0889), 1), max(round(eff_b * 0.0895), 1)
        ch_form_done.append(pair(round(fs * 0.545), fs, round(fs_b * 0.552), fs_b, c))
        cs, cs_b = max(round(eff * 0.0444), 1), max(round(eff_b * 0.0448), 1)
        ch_chat_lead.append(pair(round(cs * 0.455), cs, round(cs_b * 0.448), cs_b, c))

    put("UV@渠道", ch_uv)
    put("渠道UV占比@渠道", ch_share)
    put("留资数@渠道", ch_lead_cnt)
    put("留资率@渠道", ch_lead_rate)
    put("有效浏览率@渠道", ch_eff)
    put("秒退率@渠道", ch_bounce)
    put("转化交互率@渠道", ch_interact)
    put("留资完成率@渠道", ch_done)
    put("表单开始率@渠道", ch_form_start)
    put("开聊率@渠道", ch_chat)
    put("详情页到达率@渠道", ch_detail)
    put("表单完成率@渠道", ch_form_done)
    put("开聊留资率@渠道", ch_chat_lead)

    # ---------------- 搜索词
    put("来路关键词展现量@搜索词", [pair(v[0], None, v[1], None, k) for k, v in KW.items()])
    put("来路关键词点击量@搜索词", [pair(v[2], None, v[3], None, k) for k, v in KW.items()])
    put("搜后离站率@搜索词", [
        pair(round(v[2] * 0.18), v[2], round(v[3] * 0.175), v[3], k) for k, v in KW.items()
    ])

    # ---------------- 流失点1 · 页面
    put("落地接住率@页面", [pair(v[2], v[0], v[3], v[1], k) for k, v in PG.items()])
    put("落地停留均值@页面", [pair(v[4] * v[0], v[0], v[5] * v[1], v[1], k) for k, v in PG.items()])
    put("页面停留均值@页面", [
        pair(PG_DWELL[k][0] * v[0], v[0], PG_DWELL[k][1] * v[1], v[1], k)
        for k, v in PG_L2.items()
    ])
    put("滚动深度P75@页面", [
        {"key": k, "current": {"value": v[6], "denominator": v[0]},
         "baseline": {"value": v[7], "denominator": v[1]}}
        for k, v in PG.items()
    ])
    put("合格浏览率@页面", [pair(v[2], v[0], v[3], v[1], k) for k, v in PG_L2.items()])

    # ---------------- 流失点1 · 渠道×页（只对异常页展开）
    put("落地接住率@渠道×页", [
        pair(v[2], v[0], v[3], v[1], f"{c}|{HERO}") for c, v in CH_HERO.items()
    ])
    put("合格浏览率@渠道×页", [
        pair(v[2] + 1, v[0] + 8, v[3] + 2, v[1] + 8, f"{c}|{HERO}") for c, v in CH_HERO.items()
    ])

    # ---------------- 流失点1 · 搜索词×页
    landing_of = {k["key"]: k["landing"] for k in KEYWORDS}
    put("落地接住率@搜索词×页", [
        pair(v[2], v[0], v[3], v[1], f"{k}|{landing_of[k]}") for k, v in KW_PAGE.items()
    ])
    put("按词页面停留@搜索词×页", [
        pair(v[0] * 21, v[0], v[1] * 44, v[1], f"{k}|{landing_of[k]}")
        for k, v in KW_PAGE.items()
    ])

    # ---------------- 流失点2
    put("表单开始率@全站", [pair(FORM_START[0], EFFECTIVE[0], FORM_START[1], EFFECTIVE[1])])
    put("开聊率@全站", [pair(CHAT_START[0], EFFECTIVE[0], CHAT_START[1], EFFECTIVE[1])])
    put("详情页到达率@全站", [pair(DETAIL_REACH[0], EFFECTIVE[0], DETAIL_REACH[1], EFFECTIVE[1])])
    put("转化交互率@页面", [pair(v[6], v[4], v[7], v[5], k) for k, v in PG_L2.items()])
    put("转化交互率@渠道×页", [
        pair(max(round(v[2] * 0.18), 1), max(round(v[0] * 0.22), 1),
             max(round(v[3] * 0.18), 1), max(round(v[1] * 0.45), 1), f"{c}|{HERO}")
        for c, v in CH_HERO.items()
    ])
    total_exit = sum(v[0] for v in PG_EXIT.values())
    total_exit_b = sum(v[1] for v in PG_EXIT.values())
    put("未转化页出口率@页面", [
        pair(v[0], total_exit, v[1], total_exit_b, k) for k, v in PG_EXIT.items()
    ])
    put("人均有效浏览页数@全站", [pair(round(EFFECTIVE[0] * 2.6), EFFECTIVE[0],
                                       round(EFFECTIVE[1] * 2.8), EFFECTIVE[1])])
    put("人均浏览页数@全站", [pair(round(SITE_UV[0] * 1.9), SITE_UV[0],
                                   round(SITE_UV[1] * 2.2), SITE_UV[1])])
    put("单页深读占比@全站", [pair(round(EFFECTIVE[0] * 0.41), EFFECTIVE[0],
                                   round(EFFECTIVE[1] * 0.38), EFFECTIVE[1])])
    put("站内搜索关键词数@全站", [pair(37, None, 39, None)])
    put("站内搜索0关键词@全站", [
        {"key": "__site__",
         "current": {"value": ["6082 bracket", "anodized finish spec"]},
         "baseline": {"value": ["anodized finish spec"]}},
    ])
    put("站内搜索0结果率@全站", [pair(11, 138, 11, 146)])
    put("路径UV@路径", [
        pair(210, None, 205, None, f"/ > /products > {HERO}"),
        pair(180, None, 176, None, f"{HERO} > /"),
    ])
    put("表单曝光率@页面", [])          # 未接入
    put("询价入口个数@页面", [
        {"key": HERO, "current": {"value": 2}, "baseline": {"value": 2}},
    ])
    put("页面内容@页面", [
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
            "baseline": {"value": {"first_screen": "CNC-6061 铝合金精密支架 · 公差 ±0.01mm · 6061-T6",
                                    "hero_params_visible": True}},
        },
    ])

    # ---------------- 流失点3
    put("表单完成率@全站", [pair(FORM_SUBMIT[0], FORM_START[0], FORM_SUBMIT[1], FORM_START[1])])
    put("开聊留资率@全站", [pair(CHAT_LEAD[0], CHAT_START[0], CHAT_LEAD[1], CHAT_START[1])])
    put("留资来源通道占比@通道", [
        pair(FORM_SUBMIT[0], LEAD_COUNT[0], FORM_SUBMIT[1], LEAD_COUNT[1], "form"),
        pair(CHAT_LEAD[0], LEAD_COUNT[0], CHAT_LEAD[1], LEAD_COUNT[1], "chat"),
    ])
    put("意图留资率@全站", [pair(14, 22, 18, 29)])
    put("高价值线索占比@全站", [])   # 一期不计算
    put("页面留资率@页面", [])       # 现网无

    pack = {
        "site_id": SITE,
        "site_label": "Demo · CNC 精密加工件外贸站",
        "site_origin": "https://www.demo-cnc-oem.com",
        "period": PERIOD,
        "case_note": (
            "贯穿案例：UV 持平、有效浏览率 40%→30%、主力型号详情页落地接住率腰斩、"
            "五渠同步变差、转化交互率与留资完成率持平"
        ),
        "dimensions": {
            "渠道": CHANNELS,
            "页面": PAGES,
            "搜索词": KEYWORDS,
            "通道": CTA_CHANNELS,
        },
        "facts": facts,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(pack, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {OUT} refs={len(facts)}")


if __name__ == "__main__":
    main()
