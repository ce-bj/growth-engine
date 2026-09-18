# -*- coding: utf-8 -*-
"""行业 A+B 内容规范查表 — v2：固定 4 项 generatableModules + industryHints。"""
from __future__ import annotations

import copy
import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from ..tools.page_draft import resolve_page_template_id

SPECS_DIR = Path(__file__).resolve().parent / "industry_specs"

IndustryType = Literal[
    "材料化工",
    "机械设备",
    "电子电气",
    "消费品食品",
    "家居建材",
    "服务类",
    "其他",
]

MatchKind = Literal["exact", "fuzzy", "type-fallback", "default"]

SPEC_VERSION_V2 = "2.0.0"
AGENT_SCOPE_V2 = "A+B-only"

DO_NOT_GENERATE_DATA = [
    "C 层独立应用正文 — 来自内容管理 CMS",
    "D 层关联产品条目 — 来自产品库关联 API",
]

HTML_LAYOUT_NOTE = (
    "章节顺序与是否使用表格/列表由 AI 按布局合理性实时决定，知识库不预制 htmlOutline"
)

DEFAULT_COMPLIANCE = [
    "不得编造 CE/ISO 等认证号与检测数据",
    "无法从图片或用户输入确认的参数须标注「待补充」或「待核对官方规格」",
]

DEFAULT_TOPICS_BY_TYPE: dict[str, list[str]] = {
    "材料化工": ["成分与规格", "应用领域", "性能特点", "储存与运输", "安全与合规"],
    "机械设备": ["核心参数", "产品特点", "应用场景", "安装与维护", "安全须知"],
    "电子电气": ["技术参数", "功能特点", "接口与兼容性", "应用场景", "认证与标准"],
    "消费品食品": ["成分与营养", "规格包装", "食用/使用方法", "储存条件", "注意事项"],
    "家居建材": ["材质与规格", "产品特点", "适用空间", "安装说明", "保养维护"],
    "服务类": ["服务范围", "服务流程", "交付标准", "适用客户", "常见问题"],
    "其他": ["产品概述", "核心参数", "应用场景", "使用说明", "注意事项"],
}

TYPE_KEYWORDS: list[tuple[IndustryType, list[re.Pattern[str]]]] = [
    (
        "材料化工",
        [re.compile(p) for p in (r"材料", r"化工", r"化学", r"催化", r"原料", r"试剂", r"涂料", r"塑料", r"橡胶", r"金属材")],
    ),
    (
        "机械设备",
        [re.compile(p) for p in (r"机械", r"设备", r"机床", r"数控", r"注塑", r"泵阀", r"汽车零", r"零部件", r"模具", r"泵", r"阀")],
    ),
    (
        "电子电气",
        [re.compile(p) for p in (r"电子", r"电气", r"半导体", r"芯片", r"传感器", r"连接", r"电池", r"显示", r"影音")],
    ),
    (
        "消费品食品",
        [re.compile(p) for p in (r"食品", r"饮料", r"消费", r"零售", r"美妆", r"服装", r"鞋", r"酒", r"零食")],
    ),
    (
        "家居建材",
        [re.compile(p) for p in (r"家居", r"建材", r"家具", r"卫浴", r"定制", r"装修", r"建筑", r"智能照明")],
    ),
    (
        "服务类",
        [re.compile(p) for p in (r"服务", r"咨询", r"律所", r"医院", r"学校", r"物流", r"管理", r"认证")],
    ),
]

_HUMANOID_HINTS = ("人形", "unitree", "宇树", "双足", "humanoid", "g1", "h1", "go1", "go2")


@lru_cache(maxsize=1)
def _load_json(name: str) -> dict[str, Any]:
    path = SPECS_DIR / name
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def get_module_catalog_v2() -> dict[str, Any]:
    return _load_json("module-catalog-v2.json")


def get_module_catalog() -> dict[str, Any]:
    """运营助手可生成模块目录（v2）。"""
    return get_module_catalog_v2()


def get_template_catalog_cd() -> dict[str, Any]:
    return _load_json("template-catalog-cd.json")


def get_industry_library() -> dict[str, Any]:
    return _load_json("industry-content-spec.json")


def get_type_fallback() -> dict[str, Any]:
    return _load_json("industry-type-fallback.json")


def guess_industry_type(text: str) -> IndustryType:
    for industry_type, patterns in TYPE_KEYWORDS:
        if any(p.search(text) for p in patterns):
            return industry_type
    return "材料化工"


def _find_industrial_robot_row() -> dict[str, Any] | None:
    for row in get_industry_library().get("industries", []):
        if str(row.get("industryName", "")) == "工业机器人":
            return row
    return None


def _fuzzy_find_industry(query: str) -> dict[str, Any] | None:
    lib = get_industry_library()
    industries: list[dict[str, Any]] = lib.get("industries", [])
    q = query.strip().lower()
    if not q:
        return None

    if any(h in q for h in _HUMANOID_HINTS):
        row = _find_industrial_robot_row()
        if row:
            return row

    trimmed = query.strip()
    for row in industries:
        if row.get("industryName") == trimmed:
            return row

    for row in industries:
        aliases = row.get("aliases") or []
        if trimmed in aliases or any(a.lower() == q for a in aliases):
            return row

    best: dict[str, Any] | None = None
    best_score = 0
    for row in industries:
        name = str(row.get("industryName", "")).lower()
        category = str(row.get("productCategory", "")).lower()
        score = 0
        if trimmed == row.get("industryName"):
            score += 100
        if trimmed in (row.get("aliases") or []):
            score += 90
        if name == q:
            score += 80
        if category == q:
            score += 75
        if name in q or q in name:
            score += 12
        if category in q or q in category:
            score += 10
        if q in ("机器人", "robot") and ("扫地" in name or "扫地" in category):
            score -= 30
        if q in ("机器人", "robot") and "工业" in name:
            score += 25
        if score > best_score:
            best_score = score
            best = row

    return best if best_score > 0 else None


def _legacy_guidance_by_field(legacy_modules: list[dict[str, Any]]) -> dict[str, str]:
    out: dict[str, str] = {}
    for mod in legacy_modules:
        target = str(mod.get("fieldTarget") or "")
        guidance = mod.get("guidance")
        if target and guidance:
            out[target] = str(guidance).strip()
    return out


def _suggested_topics_from_legacy(legacy_modules: list[dict[str, Any]]) -> list[str]:
    topics: list[str] = []
    for mod in legacy_modules:
        target = str(mod.get("fieldTarget") or "")
        layer = mod.get("layer") or ("B" if target.startswith("layerB") else "A")
        if layer != "B" and not target.startswith("layerB"):
            continue
        name = str(mod.get("name") or "").strip()
        if name and name not in topics:
            topics.append(name)
    return topics


def _build_generatable_modules(
    *,
    industry_name: str,
    product_category: str,
    legacy_modules: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """v2 固定 4 项；合并 v1 行业库中的模块 guidance。"""
    legacy = legacy_modules or []
    by_field = _legacy_guidance_by_field(legacy)
    b_topics = _suggested_topics_from_legacy(legacy)

    modules: list[dict[str, Any]] = []
    for base in get_module_catalog_v2().get("modules", []):
        mod = copy.deepcopy(base)
        field_target = str(mod.get("fieldTarget") or "")
        v2_id = int(mod.get("id", -1))

        extra = by_field.get(field_target, "")
        if v2_id == 1 and industry_name:
            extra = (extra + f" 标题含行业/品类关键词：{industry_name}、{product_category}。").strip()
        if v2_id == 100 and b_topics:
            topic_hint = "、".join(b_topics[:8])
            extra = (
                (extra + " " if extra else "")
                + f"HTML 详情建议覆盖：{topic_hint}；由 AI 实时编排章节顺序。"
            ).strip()

        if extra:
            base_guidance = str(mod.get("guidance") or "").strip()
            mod["guidance"] = f"{base_guidance} {extra}".strip() if base_guidance else extra

        modules.append(mod)
    return modules


def _build_industry_hints(
    *,
    industry_type: str,
    legacy_modules: list[dict[str, Any]] | None = None,
    product_category: str = "",
    row_hints: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if isinstance(row_hints, dict) and row_hints:
        return {
            "compliance": list(row_hints.get("compliance") or DEFAULT_COMPLIANCE)[:6],
            "suggestedTopics": list(row_hints.get("suggestedTopics") or [])[:10],
            "tone": row_hints.get("tone") or "B2B 专业、简体中文",
            "htmlLayoutNote": row_hints.get("htmlLayoutNote") or HTML_LAYOUT_NOTE,
        }
    legacy = legacy_modules or []
    topics = _suggested_topics_from_legacy(legacy)
    if not topics:
        topics = list(DEFAULT_TOPICS_BY_TYPE.get(industry_type, DEFAULT_TOPICS_BY_TYPE["其他"]))

    compliance = list(DEFAULT_COMPLIANCE)
    for mod in legacy:
        name = str(mod.get("name") or "")
        guidance = str(mod.get("guidance") or "")
        if any(k in name for k in ("认证", "检测", "安全", "合规")) and guidance:
            line = guidance[:120].strip()
            if line and line not in compliance:
                compliance.append(line)

    if product_category and product_category not in topics:
        topics = [f"{product_category}相关要点"] + topics

    return {
        "compliance": compliance[:6],
        "suggestedTopics": topics[:10],
        "tone": "B2B 专业、简体中文",
        "htmlLayoutNote": HTML_LAYOUT_NOTE,
    }


def _build_template_prefab() -> dict[str, Any]:
    cd = get_template_catalog_cd()
    return {
        "catalogRef": "template-catalog-cd.json",
        "layerCApps": [
            app.get("cmsAppKey")
            for app in cd.get("layerC", {}).get("apps", [])
            if app.get("cmsAppKey")
        ],
        "layerDBlocks": [
            block.get("blockId")
            for block in cd.get("layerD", {}).get("blocks", [])
            if block.get("blockId")
        ],
    }


def _build_v2_spec(
    *,
    match: MatchKind,
    industry_name: str,
    product_category: str,
    industry_type: str,
    legacy_modules: list[dict[str, Any]] | None = None,
    row_hints: dict[str, Any] | None = None,
    scope_note: str = "",
) -> dict[str, Any]:
    spec_meta = {
        "industryName": industry_name,
        "industryType": industry_type,
    }
    generatable = _build_generatable_modules(
        industry_name=industry_name,
        product_category=product_category,
        legacy_modules=legacy_modules,
    )
    return {
        "specVersion": SPEC_VERSION_V2,
        "match": match,
        "industryName": industry_name,
        "productCategory": product_category,
        "industryType": industry_type,
        "pageTemplateId": resolve_page_template_id(spec_meta),
        "agentScope": AGENT_SCOPE_V2,
        "generatableModules": generatable,
        "industryHints": _build_industry_hints(
            industry_type=industry_type,
            legacy_modules=legacy_modules,
            product_category=product_category,
            row_hints=row_hints,
        ),
        "doNotGenerate": DO_NOT_GENERATE_DATA,
        "templatePrefab": _build_template_prefab(),
        "scope": "agent-generatable-ab-only",
        "scopeNote": scope_note,
    }


def _from_industry_row(
    row: dict[str, Any],
    match: MatchKind,
    *,
    product_category_override: str = "",
) -> dict[str, Any]:
    industry_name = str(row.get("industryName") or "")
    product_category = product_category_override.strip() or str(row.get("productCategory") or "")
    industry_type = str(row.get("industryType") or guess_industry_type(industry_name))
    legacy_modules = row.get("contentModules") if isinstance(row.get("contentModules"), list) else []

    note = ""
    if match == "fuzzy":
        note = "行业模糊命中，已合并 v1 库模块 guidance 至 v2 generatableModules"
    elif match == "exact":
        note = "行业精确命中"

    return _build_v2_spec(
        match=match,
        industry_name=industry_name,
        product_category=product_category,
        industry_type=industry_type,
        legacy_modules=legacy_modules,
        row_hints=row.get("industryHints") if isinstance(row.get("industryHints"), dict) else None,
        scope_note=note,
    )


def _from_type_template(
    industry_type: IndustryType,
    industry: str,
    match: MatchKind,
    *,
    product_category_override: str = "",
) -> dict[str, Any]:
    templates = get_type_fallback().get("templates", {})
    tpl = templates.get(industry_type) or templates.get("材料化工", {})
    industry_name = industry.strip() or industry_type
    product_category = product_category_override.strip() or str(tpl.get("industryType") or industry_type)
    legacy_modules = tpl.get("contentModules") if isinstance(tpl.get("contentModules"), list) else []
    row_hints = tpl.get("industryHints") if isinstance(tpl.get("industryHints"), dict) else None

    scope_note = "行业未精确命中，已回退到行业大类母版"
    if match == "default":
        scope_note = "未命中行业库，已回退到默认母版"

    return _build_v2_spec(
        match=match,
        industry_name=industry_name,
        product_category=product_category,
        industry_type=industry_type,
        legacy_modules=legacy_modules,
        row_hints=row_hints,
        scope_note=scope_note,
    )


def lookup_content_spec(
    industry: str,
    product_category: str = "",
) -> dict[str, Any]:
    """按行业/品类查询 v2 规范：generatableModules（4 项）+ industryHints。"""
    cat_trimmed = product_category.strip()
    query = f"{industry} {cat_trimmed}".strip() if cat_trimmed else industry
    row = _fuzzy_find_industry(query) or _fuzzy_find_industry(industry)

    if row:
        trimmed = industry.strip()
        is_exact = (
            row.get("industryName") == trimmed
            or trimmed in (row.get("aliases") or [])
            or (cat_trimmed and row.get("productCategory") == cat_trimmed)
        )
        return _from_industry_row(
            row,
            "exact" if is_exact else "fuzzy",
            product_category_override=cat_trimmed,
        )

    industry_type = guess_industry_type(query)
    templates = get_type_fallback().get("templates", {})
    if industry_type in templates:
        return _from_type_template(
            industry_type,
            industry,
            "type-fallback",
            product_category_override=cat_trimmed,
        )

    return _from_type_template(
        "材料化工",
        industry,
        "default",
        product_category_override=cat_trimmed,
    )


def search_agent_industries(query: str, limit: int = 20) -> list[dict[str, Any]]:
    """在行业主库中搜索候选行业（名称/品类/别名）。"""
    lib = get_industry_library()
    industries: list[dict[str, Any]] = lib.get("industries", [])
    q = query.strip().lower()
    if not q:
        return [
            {
                "industryName": r.get("industryName"),
                "productCategory": r.get("productCategory"),
                "industryType": r.get("industryType"),
            }
            for r in industries[:limit]
        ]

    hits: list[dict[str, Any]] = []
    for row in industries:
        name = str(row.get("industryName", "")).lower()
        category = str(row.get("productCategory", "")).lower()
        itype = str(row.get("industryType", "")).lower()
        aliases = [str(a).lower() for a in row.get("aliases") or []]
        if (
            q in name
            or q in category
            or q in itype
            or any(q in a for a in aliases)
        ):
            hits.append(
                {
                    "industryName": row.get("industryName"),
                    "productCategory": row.get("productCategory"),
                    "industryType": row.get("industryType"),
                    "aliases": row.get("aliases", []),
                },
            )
        if len(hits) >= limit:
            break
    return hits


def get_module_by_id(module_id: int) -> dict[str, Any] | None:
    for module in get_module_catalog_v2().get("modules", []):
        if module.get("id") == module_id:
            return module
    return None
