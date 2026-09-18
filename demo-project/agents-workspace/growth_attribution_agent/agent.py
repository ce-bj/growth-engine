# -*- coding: utf-8 -*-
"""组装业务指标归因 Agent（AgentScope 2.x）。"""
from __future__ import annotations

from pathlib import Path

from agentscope.agent import Agent, ReActConfig
from agentscope.model import DeepSeekChatModel, OpenAIChatModel
from agentscope.permission import PermissionContext, PermissionMode
from agentscope.state import AgentState
from agentscope.tool import FunctionTool, Toolkit

from b2b_portal_agent.agent import build_model as _shared_build_model
from b2b_portal_agent.context_config import build_context_config

from .prompts import SYSTEM_PROMPT
from .tools import (
    get_metric_detail,
    get_page_content,
    get_snapshot,
    propose_hypothesis,
    record_handoff_mock,
)

AGENT_NAME = "业务指标归因 Agent"
AGENT_DIR = Path(__file__).resolve().parent
SKILL_DIR = str(AGENT_DIR / "skills" / "growth-diagnosis")


def build_model(model_name: str | None = None) -> OpenAIChatModel | DeepSeekChatModel:
    return _shared_build_model(model_name)


def build_agent(
    model: OpenAIChatModel | DeepSeekChatModel | None = None,
    *,
    permission_bypass: bool = True,
    enable_tracing: bool = False,
) -> Agent:
    """构建归因 Agent。

    被主 Agent 嵌套委托时请保持 ``enable_tracing=False``，
    避免与外层 Tracing + Langfuse Simple 导出互相拖死。
    """
    toolkit = Toolkit(
        tools=[
            FunctionTool(get_snapshot),
            FunctionTool(get_metric_detail),
            FunctionTool(get_page_content),
            FunctionTool(propose_hypothesis),
            FunctionTool(record_handoff_mock),
        ],
        skills_or_loaders=[SKILL_DIR],
    )

    state = None
    if permission_bypass:
        state = AgentState(
            permission_context=PermissionContext(mode=PermissionMode.BYPASS),
        )

    middlewares = []
    if enable_tracing:
        from agentscope.middleware import TracingMiddleware

        middlewares = [TracingMiddleware()]

    return Agent(
        name=AGENT_NAME,
        system_prompt=SYSTEM_PROMPT,
        model=model or build_model(),
        toolkit=toolkit,
        state=state,
        context_config=build_context_config(),
        react_config=ReActConfig(max_iters=8),
        middlewares=middlewares,
    )
