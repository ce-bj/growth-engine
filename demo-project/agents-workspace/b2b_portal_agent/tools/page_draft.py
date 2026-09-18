# -*- coding: utf-8 -*-
"""将 generate_product_content 结果组装为 ProductPageDraft v2。"""
from __future__ import annotations

import json
import re
import time
import uuid
from typing import Any

DEFAULT_TEMPLATE_ID = "industrial-robot-v1"
DRAFT_VERSION = "2"

_INDUSTRY_TEMPLATE_MAP: dict[str, str] = {
    "工业机器人": "industrial-robot-v1",
    "机械设备": "industrial-robot-v1",
}


def resolve_page_template_id(page_spec: dict[str, Any] | None) -> str:
    if not page_spec:
        return DEFAULT_TEMPLATE_ID
    explicit = page_spec.get("pageTemplateId")
    if isinstance(explicit, str) and explicit.strip():
        return explicit.strip()
    industry = str(page_spec.get("industryName") or "").strip()
    if industry in _INDUSTRY_TEMPLATE_MAP:
        return _INDUSTRY_TEMPLATE_MAP[industry]
    industry_type = str(page_spec.get("industryType") or "").strip()
    if industry_type in _INDUSTRY_TEMPLATE_MAP:
        return _INDUSTRY_TEMPLATE_MAP[industry_type]
    return DEFAULT_TEMPLATE_ID


def _parse_title_field(content: str) -> dict[str, Any]:
    text = (content or "").strip()
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    return {
        "headline": lines[0] if lines else text,
        "sellingPoints": [re.sub(r"^[-*•]\s*", "", ln) for ln in lines[1:]],
    }


def _parse_media_content(content: Any) -> dict[str, Any]:
    if isinstance(content, dict):
        data = content
    else:
        raw = str(content or "").strip()
        if not raw:
            return {"caption": "", "items": []}
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return {"caption": raw, "items": []}
    if not isinstance(data, dict):
        return {"caption": str(data), "items": []}
    items = data.get("items") if isinstance(data.get("items"), list) else []
    return {
        "caption": str(data.get("caption") or ""),
        "items": [
            {
                "imageRef": str(it.get("imageRef", "")),
                "alt": str(it.get("alt") or "产品图片"),
                **({"caption": str(it["caption"])} if it.get("caption") else {}),
            }
            for it in items
            if isinstance(it, dict)
        ],
    }


def _build_slots(agent_result: dict[str, Any]) -> dict[str, Any]:
    slots: dict[str, Any] = {}

    for field in agent_result.get("independentFields") or []:
        key = field.get("fieldTarget")
        if not key:
            continue
        content = field.get("content", "")
        label = field.get("fieldLabel") or field.get("moduleName") or key
        if key == "layerA.title":
            slots[key] = {
                "type": "title",
                "label": label,
                "source": "agent",
                "value": _parse_title_field(str(content)),
            }
        elif key == "layerA.media":
            slots[key] = {
                "type": "image_meta",
                "label": label,
                "source": "agent",
                "value": _parse_media_content(content),
            }
        elif key == "layerA.overview":
            slots[key] = {
                "type": "overview",
                "label": label,
                "source": "agent",
                "value": str(content),
            }

    html_body = agent_result.get("htmlBody") or {}
    if not html_body.get("html"):
        for section in agent_result.get("richTextSections") or []:
            if section.get("fieldTarget") == "layerB.body":
                html_body = {
                    "html": str(section.get("markdown") or section.get("html") or ""),
                    "outline": section.get("outline") or [],
                }
                break

    html = str(html_body.get("html") or "").strip()
    outline = html_body.get("outline") if isinstance(html_body.get("outline"), list) else []
    slots["layerB.body"] = {
        "type": "html_richtext",
        "label": "产品详情",
        "source": "agent",
        "value": {"html": html, "outline": outline},
    }

    return slots


def slots_to_llm_draft(page_draft: dict[str, Any]) -> dict[str, Any]:
    """将 pageDraft slots 转回 generate/patch 使用的 llm draft 结构。"""
    slots = page_draft.get("slots") or {}
    independent: list[dict[str, Any]] = []
    label_map = {
        "layerA.title": ("产品名称", 1),
        "layerA.overview": ("产品概述", 0),
        "layerA.media": ("产品图片说明", 5),
    }
    for field_target, (label, module_id) in label_map.items():
        slot = slots.get(field_target) or {}
        value = slot.get("value")
        if field_target == "layerA.title" and isinstance(value, dict):
            headline = str(value.get("headline") or "")
            points = value.get("sellingPoints") or []
            content = headline
            if points:
                content = headline + "\n" + "\n".join(f"- {p}" for p in points)
        elif field_target == "layerA.media":
            content = json.dumps(value if isinstance(value, dict) else {}, ensure_ascii=False)
        else:
            content = str(value or "")
        independent.append(
            {
                "moduleId": module_id,
                "moduleName": label,
                "fieldLabel": label,
                "fieldTarget": field_target,
                "content": content,
            },
        )
    body_slot = slots.get("layerB.body") or {}
    body_val = body_slot.get("value") if isinstance(body_slot.get("value"), dict) else {}
    html_body = {
        "html": str(body_val.get("html") or ""),
        "outline": body_val.get("outline") if isinstance(body_val.get("outline"), list) else [],
    }
    return {
        "independentFields": independent,
        "htmlBody": html_body,
        "richTextSections": [],
    }


def _default_layer_c(industry_name: str, headline: str) -> dict[str, Any]:
    product_label = headline.split(" ")[0] if headline else "产品"
    return {
        "apps": [
            {
                "appId": "cms.breadcrumb",
                "appName": "面包屑导航",
                "cmsAppKey": "breadcrumb",
                "templateVariant": "inline-light",
                "placement": "header",
                "design": {"separator": "/", "emphasis": "current", "density": "compact"},
                "dataBinding": {"source": "cms", "cmsAppKey": "breadcrumb"},
                "cmsData": {
                    "items": ["首页", "产品中心", industry_name or "产品", product_label],
                },
            },
            {
                "appId": "cms.inquiry-form",
                "appName": "在线询价",
                "cmsAppKey": "inquiry-form",
                "templateVariant": "split-form-industrial",
                "placement": "footer-cta",
                "design": {
                    "title": "获取报价与集成方案",
                    "subtitle": "留下需求，24 小时内工程师回电",
                    "layout": "split",
                    "primaryColor": "#e85d04",
                    "showProductPrefill": True,
                },
                "dataBinding": {"source": "cms", "cmsAppKey": "inquiry-form"},
                "cmsData": {
                    "fields": [
                        {"key": "name", "label": "您的姓名", "required": True},
                        {"key": "phone", "label": "联系电话", "required": True},
                        {"key": "company", "label": "公司名称", "required": False},
                        {
                            "key": "message",
                            "label": "需求描述",
                            "type": "textarea",
                            "placeholder": "负载、臂展、应用场景、交期",
                        },
                    ],
                    "submitLabel": "提交询价",
                },
            },
            {
                "appId": "cms.enterprise-profile",
                "appName": "企业概况",
                "cmsAppKey": "enterprise-profile",
                "templateVariant": "trust-bar-compact",
                "placement": "pre-footer",
                "design": {"headline": "关于制造商", "layout": "stats-inline", "showLogo": True},
                "dataBinding": {"source": "cms", "cmsAppKey": "enterprise-profile"},
                "cmsData": {
                    "companyName": "制造商信息（内容管理配置）",
                    "slogan": "专业工业装备与自动化解决方案",
                    "founded": "—",
                    "employees": "—",
                    "sites": "全国服务网络",
                    "certifications": ["ISO 9001"],
                },
            },
        ],
    }


def _default_layer_d() -> dict[str, Any]:
    return {
        "blocks": [
            {
                "blockId": "related-products",
                "templateVariant": "card-grid-3col",
                "placement": "post-content",
                "design": {
                    "title": "同系列与配套推荐",
                    "subtitle": "基于产品库关联规则自动展示",
                    "columns": 3,
                    "cardStyle": "elevated",
                    "showTag": True,
                    "showThumb": True,
                },
                "dataBinding": {"source": "product-relation", "rule": "same-series", "limit": 3},
                "items": [],
            },
        ],
    }


def build_page_draft(
    agent_result: dict[str, Any],
    page_spec: dict[str, Any] | None = None,
    *,
    draft_id: str | None = None,
) -> dict[str, Any]:
    """组装 ProductPageDraft v2，供 bridge 发 page_draft SSE。"""
    spec = page_spec if isinstance(page_spec, dict) else {}
    template_id = resolve_page_template_id(spec)
    slots = _build_slots(agent_result)
    title_slot = slots.get("layerA.title", {}).get("value") or {}
    headline = title_slot.get("headline", "") if isinstance(title_slot, dict) else ""
    stable_id = draft_id or agent_result.get("draftId")
    if not stable_id:
        stable_id = f"draft-{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"

    return {
        "version": DRAFT_VERSION,
        "draftId": stable_id,
        "templateId": template_id,
        "industryName": agent_result.get("industryName") or spec.get("industryName", ""),
        "productCategory": agent_result.get("productCategory") or spec.get("productCategory", ""),
        "draftTitle": agent_result.get("draftTitle", ""),
        "slots": slots,
        "generatableModules": spec.get("generatableModules") or spec.get("contentModules") or [],
        "coverage": agent_result.get("coverage"),
        "layerC": _default_layer_c(
            str(agent_result.get("industryName") or spec.get("industryName") or "产品"),
            str(headline),
        ),
        "layerD": _default_layer_d(),
        "meta": {
            "generationMode": agent_result.get("generationMode", "llm"),
            "generationPhase": agent_result.get("generationPhase", "final"),
            "generationError": agent_result.get("generationError"),
            "locale": "zh-CN",
        },
    }
