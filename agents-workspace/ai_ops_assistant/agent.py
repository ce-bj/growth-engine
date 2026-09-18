# -*- coding: utf-8 -*-
"""组装 AI 运营助手主 Agent（Supervisor · AgentScope 2.x）。"""
from __future__ import annotations

from pathlib import Path

from agentscope.agent import Agent, ReActConfig
from agentscope.middleware import TracingMiddleware
from agentscope.model import DeepSeekChatModel, OpenAIChatModel
from agentscope.permission import PermissionContext, PermissionMode
from agentscope.state import AgentState
from agentscope.tool import FunctionTool, Toolkit

from b2b_portal_agent.agent import build_model as _shared_build_model
from b2b_portal_agent.context_config import build_context_config

from .prompts import SYSTEM_PROMPT
from .tools import (
    delegate_marketing_page_agent,
    delegate_metrics_agent,
    delegate_product_detail_agent,
    delegate_site_content_agent,
    list_available_agents,
)

AGENT_NAME = "AI运营助手"
AGENT_DIR = Path(__file__).resolve().parent


def build_model(model_name: str | None = None) -> OpenAIChatModel | DeepSeekChatModel:
    return _shared_build_model(model_name)


def build_agent(
    model: OpenAIChatModel | DeepSeekChatModel | None = None,
    *,
    permission_bypass: bool = True,
) -> Agent:
    """构建主 Agent，供 demo-project bridge 调用。"""
    toolkit = Toolkit(
        tools=[
            # 业务委托优先；清单工具放最后，降低闲聊误触
            FunctionTool(delegate_product_detail_agent),
            FunctionTool(delegate_metrics_agent),
            FunctionTool(delegate_marketing_page_agent),
            FunctionTool(delegate_site_content_agent),
            FunctionTool(list_available_agents),
        ],
    )

    state = None
    if permission_bypass:
        state = AgentState(
            permission_context=PermissionContext(mode=PermissionMode.BYPASS),
        )

    return Agent(
        name=AGENT_NAME,
        system_prompt=SYSTEM_PROMPT,
        model=model or build_model(),
        toolkit=toolkit,
        state=state,
        context_config=build_context_config(),
        # 主 Agent 只做路由，迭代不必太深
        react_config=ReActConfig(max_iters=8),
        middlewares=[TracingMiddleware()],
    )
