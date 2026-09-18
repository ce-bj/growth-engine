# -*- coding: utf-8 -*-
"""行业内容规范查询 — 对接 knowledge/industry_specs 查表。"""
from __future__ import annotations

import json
from typing import Any

from ..knowledge.lookup import lookup_content_spec as _lookup
from ..knowledge.lookup import search_agent_industries as _search


def _parse_attributes(product_attributes: dict[str, Any] | str) -> dict[str, Any]:
    if isinstance(product_attributes, dict):
        return product_attributes
    if isinstance(product_attributes, str) and product_attributes.strip():
        try:
            parsed = json.loads(product_attributes)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            return {"raw": product_attributes}
    return {}


def lookup_spec(
    industry: str,
    product_category: str = "",
) -> dict[str, Any]:
    return _lookup(industry, product_category)


def query_spec_with_context(
    industry: str,
    product_category: str,
    product_attributes: dict[str, Any] | str,
) -> dict[str, Any]:
    attrs = _parse_attributes(product_attributes)
    category = product_category.strip()
    if not category:
        category = str(
            attrs.get("productCategory")
            or attrs.get("product_category")
            or "",
        ).strip()

    spec = _lookup(industry, category)
    return {
        "industryName": spec.get("industryName", industry),
        "productCategory": spec.get("productCategory", category),
        "productAttributes": attrs,
        **spec,
    }


def search_industries(query: str, limit: int = 20) -> dict[str, Any]:
    hits = _search(query, limit=limit)
    return {
        "query": query,
        "count": len(hits),
        "industries": hits,
    }
