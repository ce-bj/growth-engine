# -*- coding: utf-8 -*-
"""构建生成前摘要（GenerationBrief）— 四维度澄清 + 可勾选章节 + 待补充清单。"""
from __future__ import annotations

import copy
import json
import re
import time
import uuid
from functools import lru_cache
from pathlib import Path
from typing import Any

from .brief_session import get_generation_brief, set_generation_brief

_CLARIFICATION_DIMS = (
    ("identity", "产品身份确认"),
    ("specs_evidence", "规格与证据"),
    ("scenarios", "应用场景"),
    ("advantages", "优势与特点"),
)

_SCENARIO_KEYWORDS = ("场景", "应用", "案例", "行业", "用途")
_ADVANTAGE_KEYWORDS = ("优势", "特点", "卖点", "性能", "功能")

# B 层详情页章节标题 — 禁止作为澄清卡片点选项
_META_TOPIC_BLOCKLIST = frozenset({
    "应用场景/使用案例",
    "产品功能/性能介绍",
    "产品规格参数表",
    "产品图片/视频展示",
    "资质认证与检测报告",
    "包装与物流信息",
    "售后服务与质保",
    "公司简介",
    "常见问题 FAQ",
})


@lru_cache(maxsize=1)
def _load_clarification_templates() -> dict[str, Any]:
    path = (
        Path(__file__).resolve().parent.parent
        / "knowledge"
        / "industry_specs"
        / "clarification-templates.json"
    )
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _parse_json_maybe(value: str | dict[str, Any] | None) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if not value:
        return {}
    try:
        data = json.loads(str(value))
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, TypeError):
        return {}


def _analysis_from_payload(image_analysis: str | dict[str, Any] | None) -> dict[str, Any]:
    data = _parse_json_maybe(image_analysis)
    analysis = data.get("analysis", data)
    return analysis if isinstance(analysis, dict) else {}


def _template_for_type(industry_type: str) -> dict[str, Any]:
    catalog = _load_clarification_templates().get("byIndustryType") or {}
    base = copy.deepcopy(catalog.get("default") or {})
    extra = catalog.get(industry_type) or {}
    for key, val in extra.items():
        if isinstance(val, dict) and isinstance(base.get(key), dict):
            base[key] = {**base[key], **val}
        else:
            base[key] = val
    return base


def _slug_topic(label: str, index: int) -> str:
    slug = re.sub(r"[^\w\u4e00-\u9fff]+", "-", str(label).strip()).strip("-").lower()
    return slug or f"topic-{index}"


def _build_suggested_topics(
    hints: dict[str, Any],
    *,
    industry_type: str,
) -> list[dict[str, Any]]:
    topics: list[dict[str, Any]] = []
    raw = list(hints.get("suggestedTopics") or [])
    for idx, label in enumerate(raw[:12]):
        text = str(label).strip()
        if not text:
            continue
        tier = "recommended"
        if any(k in text for k in _SCENARIO_KEYWORDS):
            tier = "scenario"
        elif any(k in text for k in _ADVANTAGE_KEYWORDS):
            tier = "advantage"
        topics.append(
            {
                "id": _slug_topic(text, idx),
                "label": text,
                "selected": True,
                "tier": tier,
            },
        )
    if not topics:
        fallback = _template_for_type(industry_type)
        for dim_id, title in _CLARIFICATION_DIMS[2:]:
            for opt in fallback.get(dim_id, {}).get("options", [])[:3]:
                topics.append(
                    {
                        "id": _slug_topic(str(opt), len(topics)),
                        "label": str(opt),
                        "selected": True,
                        "tier": dim_id,
                    },
                )
    return topics


def _collect_gaps(analysis: dict[str, Any], per_image: list[dict[str, Any]]) -> list[dict[str, Any]]:
    gaps: list[dict[str, Any]] = []
    seen: set[str] = set()

    def _add(gap_id: str, label: str, severity: str = "medium", source: str = "analysis") -> None:
        key = label.strip()
        if not key or key in seen:
            return
        seen.add(key)
        gaps.append({"id": gap_id, "label": label, "severity": severity, "source": source})

    for spec in analysis.get("missingSpecs") or []:
        _add(f"missing-{len(gaps)}", str(spec), "high", "missingSpecs")

    roles = analysis.get("imageRoleSummary") or {}
    if not roles.get("spec_sheet"):
        _add("spec-sheet", "技术参数表/铭牌/规格书图片", "high", "imageRole")
    if not roles.get("product_photo"):
        _add("product-photo", "产品实拍主图", "medium", "imageRole")

    if analysis.get("hasIrrelevantImages"):
        _add("irrelevant-images", "替换无关图片", "medium", "imageRole")

    for item in per_image:
        if item.get("imageRole") == "spec_sheet":
            for k, v in (item.get("extractedSpecs") or {}).items():
                if str(v).strip() in ("", "待确认", "待补充"):
                    _add(f"spec-{k}", f"{k}（待核对）", "medium", "perImage")

    if not gaps:
        _add("optional-detail", "可选：补充型号、认证、典型客户案例", "low", "hint")

    return gaps[:12]


def _normalize_options(raw_options: list[Any], *, dim_id: str) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for idx, opt in enumerate(raw_options or []):
        if isinstance(opt, dict):
            title = str(opt.get("title") or opt.get("label") or "").strip()
            desc = str(opt.get("description") or opt.get("detail") or "").strip()
            opt_id = str(opt.get("id") or f"{dim_id}-opt-{idx}")
        else:
            title = str(opt).strip()
            desc = ""
            opt_id = f"{dim_id}-opt-{idx}"
        if not title:
            continue
        out.append({"id": opt_id, "title": title, "description": desc})
    return out


def _recognition_label(page_spec: dict[str, Any], analysis: dict[str, Any]) -> str:
    industry = str(page_spec.get("industryName") or analysis.get("industryName") or "").strip()
    category = str(page_spec.get("productCategory") or analysis.get("productCategory") or "").strip()
    if industry and category:
        return f"{industry} / {category}"
    return industry or category or "待确认"


def _append_unique_option(
    bucket: list[dict[str, str]],
    seen: set[str],
    *,
    dim_id: str,
    title: str,
    description: str = "",
    opt_id: str = "",
    max_items: int = 6,
) -> None:
    text = str(title).strip()
    if not text or text in seen or len(bucket) >= max_items:
        return
    if not _is_valid_clarification_option(text, dim_id=dim_id):
        return
    seen.add(text)
    bucket.append({
        "id": opt_id or f"{dim_id}-opt-{len(bucket)}",
        "title": text,
        "description": str(description or "").strip(),
    })


def _is_valid_clarification_option(text: str, *, dim_id: str) -> bool:
    """过滤 B 层章节标题、空泛套话，避免误入澄清点选项。"""
    label = str(text).strip()
    if label in _META_TOPIC_BLOCKLIST:
        return False
    if label in ("暂不确定", "与识图结果一致", "需要补充说明"):
        return False
    # 「应用场景/使用案例」类章节名：含 / 且像模块标题
    if "/" in label and any(k in label for k in ("案例", "介绍", "说明", "展示", "参数表", "认证")):
        return False
    if re.match(r"^(应用场景|使用案例|产品功能|产品规格|资质认证)", label):
        return False
    if len(label) > 40:
        return False
    return True


def _topics_by_tier(hints: dict[str, Any], *, tier: str) -> list[str]:
    topics: list[str] = []
    for label in hints.get("suggestedTopics") or []:
        text = str(label).strip()
        if not text:
            continue
        if tier == "scenario" and any(k in text for k in _SCENARIO_KEYWORDS):
            topics.append(text)
        elif tier == "advantage" and any(k in text for k in _ADVANTAGE_KEYWORDS):
            topics.append(text)
    return topics


_CATEGORY_SCENARIO_HINTS: list[tuple[tuple[str, ...], list[str]]] = [
    (("模具", "钢模具", "收口井", "检查井", "预制"), [
        "市政排水检查井", "建筑工程配套", "预制混凝土构件", "农村污水改造", "电力通信井",
    ]),
    (("阀", "泵", "法兰", "管道"), [
        "建筑给排水", "暖通空调", "工业流体输送", "消防系统", "市政管网",
    ]),
    (("机器人", "机械臂", "自动化"), [
        "焊接产线", "装配搬运", "码垛分拣", "喷涂涂胶", "机床上下料",
    ]),
    (("食品", "饮料", "包装"), [
        "餐饮连锁供应", "商超零售", "电商直销", "出口贸易", "团餐配餐",
    ]),
]


_CATEGORY_ADVANTAGE_HINTS: list[tuple[tuple[str, ...], list[str]]] = [
    (("模具", "钢模具"), ["尺寸精度", "脱模顺畅", "耐磨寿命", "拆装便捷", "可定制规格"]),
    (("阀", "泵"), ["密封性能", "耐腐蚀性", "启闭寿命", "压力等级", "认证合规"]),
    (("机器人",), ["重复定位精度", "负载能力", "防护等级", "易集成调试", "稳定稼动率"]),
]


def _category_hint_options(
    text_blob: str,
    mapping: list[tuple[tuple[str, ...], list[str]]],
) -> list[str]:
    blob = text_blob.lower()
    out: list[str] = []
    for keywords, labels in mapping:
        if any(k.lower() in blob for k in keywords):
            out.extend(labels)
    return out


def _build_identity_options(
    page_spec: dict[str, Any],
    analysis: dict[str, Any],
) -> list[dict[str, str]]:
    label = _recognition_label(page_spec, analysis)
    return [
        {
            "id": "confirm-recognition",
            "title": label,
            "description": "与当前识图判断一致",
        },
        {
            "id": "identity-other",
            "title": "其他",
            "description": "请填写正确的行业与品类",
        },
    ]


def _build_dynamic_scenario_options(
    template: dict[str, Any],
    *,
    analysis: dict[str, Any],
    page_spec: dict[str, Any],
    hints: dict[str, Any],
) -> list[dict[str, str]]:
    dim_id = "scenarios"
    bucket: list[dict[str, str]] = []
    seen: set[str] = set()
    blob = " ".join([
        str(page_spec.get("productCategory") or ""),
        str(page_spec.get("industryName") or ""),
        str(analysis.get("productCategory") or ""),
        str(analysis.get("industryName") or ""),
        str(analysis.get("notes") or ""),
    ])

    for item in analysis.get("likelyScenarios") or []:
        _append_unique_option(bucket, seen, dim_id=dim_id, title=str(item), description="识图推断场景")

    for text in _category_hint_options(blob, _CATEGORY_SCENARIO_HINTS):
        _append_unique_option(bucket, seen, dim_id=dim_id, title=text, description="品类常见场景")

    for opt in _normalize_options((template.get("scenarios") or {}).get("options") or [], dim_id=dim_id):
        _append_unique_option(
            bucket, seen, dim_id=dim_id,
            title=opt["title"], description=opt.get("description", ""),
            opt_id=opt["id"],
        )

    if not bucket:
        for text in ["工业制造", "市政工程", "建筑工程", "能源电力"]:
            _append_unique_option(bucket, seen, dim_id=dim_id, title=text)

    _append_unique_option(
        bucket, seen, dim_id=dim_id,
        title="其他", description="自定义填写场景",
        opt_id="scenarios-other", max_items=99,
    )
    return bucket


def _build_dynamic_advantage_options(
    template: dict[str, Any],
    *,
    analysis: dict[str, Any],
    page_spec: dict[str, Any],
    hints: dict[str, Any],
) -> list[dict[str, str]]:
    dim_id = "advantages"
    bucket: list[dict[str, str]] = []
    seen: set[str] = set()
    blob = " ".join([
        str(page_spec.get("productCategory") or ""),
        str(page_spec.get("industryName") or ""),
        str(analysis.get("productCategory") or ""),
        str(analysis.get("industryName") or ""),
    ])

    for item in analysis.get("likelyAdvantages") or []:
        _append_unique_option(bucket, seen, dim_id=dim_id, title=str(item), description="识图推断优势")

    for feat in analysis.get("visibleFeatures") or []:
        _append_unique_option(
            bucket, seen, dim_id=dim_id,
            title=str(feat), description="图片可见特征",
        )

    for text in _category_hint_options(blob, _CATEGORY_ADVANTAGE_HINTS):
        _append_unique_option(bucket, seen, dim_id=dim_id, title=text, description="品类常见卖点")

    for opt in _normalize_options((template.get("advantages") or {}).get("options") or [], dim_id=dim_id):
        _append_unique_option(
            bucket, seen, dim_id=dim_id,
            title=opt["title"], description=opt.get("description", ""),
            opt_id=opt["id"],
        )

    if not bucket:
        for text in ["性能参数", "可靠耐用", "易维护", "性价比"]:
            _append_unique_option(bucket, seen, dim_id=dim_id, title=text)

    _append_unique_option(
        bucket, seen, dim_id=dim_id,
        title="其他", description="自定义填写优势",
        opt_id="advantages-other", max_items=99,
    )
    return bucket


def _should_ask_clarification(
    analysis: dict[str, Any],
    page_spec: dict[str, Any],
    *,
    user_message: str = "",
    existing_brief: dict[str, Any] | None = None,
) -> bool:
    msg = user_message or ""
    if re.search(
        r"【用户已提交澄清答案】|已完成关键澄清|submit_clarification",
        msg,
        re.IGNORECASE,
    ):
        return False
    if isinstance(existing_brief, dict) and existing_brief.get("briefId"):
        status = str(existing_brief.get("status") or "")
        if status in ("awaiting_confirm", "confirmed"):
            return False
        dims = existing_brief.get("clarification", {}).get("dimensions") or []
        if dims and all(
            isinstance(d, dict) and (d.get("answered") or d.get("skipped"))
            for d in dims
        ):
            return False
    return True


def _build_dimension(
    dim_id: str,
    title: str,
    template: dict[str, Any],
    *,
    analysis: dict[str, Any],
    page_spec: dict[str, Any],
    hints: dict[str, Any],
    ask: bool,
) -> dict[str, Any]:
    tpl = template.get(dim_id) or {}
    question = str(tpl.get("question") or f"请补充{title}")
    raw_options = tpl.get("options") or []
    allow_multi = dim_id in ("scenarios", "advantages")
    inferred: str | None = None
    custom_input_when: str | None = None

    if dim_id == "identity":
        inferred = _recognition_label(page_spec, analysis)
        question = "请确认产品所属行业与品类"
        raw_options = _build_identity_options(page_spec, analysis)
        custom_input_when = "identity-other"
    elif dim_id == "specs_evidence":
        roles = analysis.get("imageRoleSummary") or {}
        if roles.get("spec_sheet"):
            inferred = "已有规格图/参数资料"
        elif roles.get("product_photo"):
            inferred = "仅有产品实拍图"
    elif dim_id == "scenarios":
        question = "主要应用于哪些场景？（可多选）"
        raw_options = _build_dynamic_scenario_options(
            template, analysis=analysis, page_spec=page_spec, hints=hints,
        )
        custom_input_when = "scenarios-other"
    elif dim_id == "advantages":
        question = "希望突出的优势与特点？（可多选）"
        raw_options = _build_dynamic_advantage_options(
            template, analysis=analysis, page_spec=page_spec, hints=hints,
        )
        custom_input_when = "advantages-other"

    if dim_id not in ("identity", "scenarios", "advantages"):
        options = _normalize_options(raw_options, dim_id=dim_id)
        if not options:
            options = _normalize_options(
                ["与识图结果一致", "需要补充说明", "暂不确定"],
                dim_id=dim_id,
            )
    else:
        options = raw_options if isinstance(raw_options, list) and raw_options else []

    return {
        "id": dim_id,
        "title": title,
        "question": question,
        "options": options,
        "allowCustom": custom_input_when is not None,
        "customInputWhen": custom_input_when,
        "allowMulti": allow_multi,
        "answered": False,
        "skipped": False,
        "selectedOptionId": None,
        "selectedOptionIds": [],
        "customValue": "",
        "value": None,
        "values": [],
        "hint": inferred,
    }


def build_generation_brief_payload(
    page_spec: str | dict[str, Any],
    image_analysis: str | dict[str, Any] | None = None,
    *,
    user_message: str = "",
    existing_brief: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """从 page_spec + 识图结果构建 GenerationBrief v1。"""
    spec = _parse_json_maybe(page_spec)
    analysis = _analysis_from_payload(image_analysis)
    per_image = _parse_json_maybe(image_analysis).get("perImage") or []
    if not isinstance(per_image, list):
        per_image = []

    industry_type = str(spec.get("industryType") or analysis.get("industryType") or "其他")
    template = _template_for_type(industry_type)
    hints = spec.get("industryHints") or {}
    ask = _should_ask_clarification(
        analysis,
        spec,
        user_message=user_message,
        existing_brief=existing_brief,
    )

    recognition = {
        "industryName": spec.get("industryName") or analysis.get("industryName") or "待确认",
        "productCategory": spec.get("productCategory") or analysis.get("productCategory") or "待识别",
        "match": spec.get("match") or "default",
        "confidence": analysis.get("confidence"),
        "visibleFeatures": list(analysis.get("visibleFeatures") or [])[:8],
    }

    dimensions = [
        _build_dimension(
            dim_id, title, template,
            analysis=analysis, page_spec=spec, hints=hints, ask=ask,
        )
        for dim_id, title in _CLARIFICATION_DIMS
    ]

    suggested_topics = _build_suggested_topics(hints, industry_type=industry_type)
    gaps = _collect_gaps(analysis, per_image)

    if isinstance(existing_brief, dict) and existing_brief.get("briefId"):
        prev_topics = {
            t.get("id"): t
            for t in (existing_brief.get("suggestedTopics") or [])
            if isinstance(t, dict) and t.get("id")
        }
        for topic in suggested_topics:
            prev = prev_topics.get(topic["id"])
            if prev and "selected" in prev:
                topic["selected"] = bool(prev["selected"])

        prev_dims = {
            d.get("id"): d
            for d in (existing_brief.get("clarification", {}).get("dimensions") or [])
            if isinstance(d, dict)
        }
        for dim in dimensions:
            prev = prev_dims.get(dim["id"])
            if not prev:
                continue
            for key in (
                "answered", "skipped", "value", "values",
                "selectedOptionId", "selectedOptionIds", "customValue",
                "options",
            ):
                if key in prev:
                    dim[key] = copy.deepcopy(prev[key])

    needs_clarification = ask and any(
        not d.get("answered") and not d.get("skipped") for d in dimensions
    )
    status = "needs_clarification" if needs_clarification else "awaiting_confirm"
    if isinstance(existing_brief, dict) and existing_brief.get("briefId"):
        prev_status = str(existing_brief.get("status") or "")
        if prev_status == "confirmed":
            status = "confirmed"
        elif prev_status == "awaiting_confirm" and not needs_clarification:
            status = "awaiting_confirm"

    brief = {
        "version": "1",
        "briefId": (existing_brief or {}).get("briefId")
        or f"brief-{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}",
        "status": status,
        "recognition": recognition,
        "clarification": {"dimensions": dimensions},
        "generatableModules": list(spec.get("generatableModules") or []),
        "suggestedTopics": suggested_topics,
        "gaps": gaps,
        "pageTemplateId": spec.get("pageTemplateId"),
        "pageSpec": spec,
        "userMessageRef": (user_message or "")[:300],
        "updatedAt": time.time(),
    }
    return set_generation_brief(brief)


def get_selected_topic_labels(brief: dict[str, Any] | None = None) -> list[str]:
    data = brief or get_generation_brief() or {}
    return [
        str(t.get("label"))
        for t in (data.get("suggestedTopics") or [])
        if isinstance(t, dict) and t.get("selected") and t.get("label")
    ]


def format_clarification_summary(brief: dict[str, Any]) -> str:
    lines = ["**澄清结果摘要**"]
    for dim in brief.get("clarification", {}).get("dimensions") or []:
        if not isinstance(dim, dict):
            continue
        title = dim.get("title", "")
        if dim.get("skipped"):
            lines.append(f"- {title}：已跳过")
            continue
        if dim.get("allowMulti"):
            vals = dim.get("values") or []
            lines.append(f"- {title}：{', '.join(vals) if vals else '未填'}")
        else:
            lines.append(f"- {title}：{dim.get('value') or '未填'}")
    return "\n".join(lines)
