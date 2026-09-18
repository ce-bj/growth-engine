# -*- coding: utf-8 -*-
"""AgentScope 上下文压缩配置 — 放宽中文摘要字段长度限制。"""
from __future__ import annotations

import copy

from agentscope.agent._config import ContextConfig, SummarySchema


def build_context_config() -> ContextConfig:
    """默认 SummarySchema 各字段 maxLength=200~300，中文工作流易被压缩模型写爆。"""
    schema = copy.deepcopy(SummarySchema.model_json_schema())
    limits = {
        "task_overview": 600,
        "current_state": 800,
        "important_discoveries": 800,
        "next_steps": 800,
        "context_to_preserve": 600,
    }
    props = schema.get("properties") or {}
    for key, max_len in limits.items():
        if key in props and isinstance(props[key], dict):
            props[key]["maxLength"] = max_len
    schema["properties"] = props
    return ContextConfig(summary_schema=schema)
