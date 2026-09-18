# -*- coding: utf-8 -*-
"""组装 B2B 门户「产品详情页 Agent」（AgentScope 2.x）。"""
from __future__ import annotations

import asyncio
import os
from pathlib import Path

from agentscope.agent import Agent, ReActConfig
from agentscope.credential import DeepSeekCredential, OpenAICredential
from agentscope.event import EventType
from agentscope.message import DataBlock, TextBlock, URLSource, UserMsg
from agentscope.middleware import TracingMiddleware
from agentscope.model import DeepSeekChatModel, OpenAIChatModel
from agentscope.permission import PermissionContext, PermissionMode
from agentscope.state import AgentState
from agentscope.tool import FunctionTool, Toolkit

from .config import (
    ensure_api_bypass_proxy,
    get_api_key,
    get_base_url,
    get_effective_model_name,
    get_model_name,
    get_thinking_enable,
    is_deepseek_model,
)
from .context_config import build_context_config
from .prompts import SYSTEM_PROMPT
from .tools import (
    analyze_product_images,
    generate_product_content,
    lookup_content_spec,
    patch_page_draft,
    query_industry_page_spec,
    restore_page_draft,
    search_agent_industries,
)

AGENT_NAME = "产品详情页 Agent"
AGENT_DIR = Path(__file__).resolve().parent
SKILL_GENERATE = str(AGENT_DIR / "skills" / "product-generate")
SKILL_EDIT = str(AGENT_DIR / "skills" / "product-edit")
SKILL_PUBLISH_COMPAT = str(AGENT_DIR / "skills" / "product-publish")


def build_model(model_name: str | None = None) -> OpenAIChatModel | DeepSeekChatModel:
    """构建模型客户端。

    DeepSeek 系列默认走 ``DeepSeekChatModel`` 并开启 thinking，以便产出
    ``ThinkingBlock*`` 流式事件（见官方文档 message-and-event）。

    ``model_name`` 可覆盖 ``OPENAI_MODEL``（供前端按请求切换）。
    """
    base_url = get_base_url()
    ensure_api_bypass_proxy(base_url)
    effective = (model_name or get_effective_model_name()).strip()
    thinking_enable = get_thinking_enable()
    client_kwargs = {"timeout": 180.0}

    if is_deepseek_model(effective):
        return DeepSeekChatModel(
            credential=DeepSeekCredential(
                api_key=get_api_key(),
                base_url=base_url,
            ),
            model=effective,
            stream=True,
            parameters=DeepSeekChatModel.Parameters(thinking_enable=thinking_enable),
            client_kwargs=client_kwargs,
        )

    parameters = None
    if thinking_enable:
        parameters = OpenAIChatModel.Parameters(enable_thinking=True)

    return OpenAIChatModel(
        credential=OpenAICredential(
            api_key=get_api_key(),
            base_url=base_url,
        ),
        model=effective,
        stream=True,
        parameters=parameters,
        client_kwargs=client_kwargs,
    )


def build_agent(
    model: OpenAIChatModel | DeepSeekChatModel | None = None,
    *,
    permission_bypass: bool = True,
    enable_tracing: bool = True,
) -> Agent:
    """构建产品详情页 Agent，供主 Agent 委托或 bridge 直连。

    同一会话请复用同一 Agent 实例以保留 ``state.context`` 多轮记忆。
    嵌套委托时请传 ``enable_tracing=False``，避免 Langfuse 同步导出拖死嵌套流。
    """
    toolkit = Toolkit(
        tools=[
            FunctionTool(analyze_product_images),
            FunctionTool(lookup_content_spec),
            FunctionTool(query_industry_page_spec),
            FunctionTool(search_agent_industries),
            FunctionTool(generate_product_content),
            FunctionTool(patch_page_draft),
            FunctionTool(restore_page_draft),
        ],
        skills_or_loaders=[SKILL_GENERATE, SKILL_EDIT, SKILL_PUBLISH_COMPAT],
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
        react_config=ReActConfig(max_iters=20),
        middlewares=[TracingMiddleware()] if enable_tracing else [],
    )


async def _demo_stream(agent: Agent, user_msg: UserMsg) -> str:
    chunks: list[str] = []
    async for evt in agent.reply_stream(user_msg):
        if evt.type == EventType.TEXT_BLOCK_DELTA:
            print(evt.delta, end="", flush=True)
            chunks.append(evt.delta)
        elif evt.type == EventType.THINKING_BLOCK_DELTA:
            print(evt.delta, end="", flush=True)
        elif evt.type == EventType.TOOL_CALL_START:
            print(f"\n[工具] {evt.tool_call_name} …", flush=True)
        elif evt.type == EventType.TOOL_RESULT_END:
            print(f"[完成] {evt.tool_call_name}", flush=True)
    print()
    return "".join(chunks)


async def main() -> None:
    agent = build_agent()
    user_text = (
        "帮我发布这个产品，附件是实拍图。标题偏专业，先出详情页草稿，不要直接发布。"
    )
    demo_url = "https://cdn.example.com/uploads/industrial-valve-01.jpg"
    user_msg = UserMsg(
        name="user",
        content=[
            TextBlock(text=user_text),
            DataBlock(
                source=URLSource(url=demo_url, media_type="image/jpeg"),
            ),
        ],
    )

    print(f"=== {AGENT_NAME} ===\n")
    print(f"模型: {get_model_name()} @ {get_base_url()}\n")
    print(f"用户: {user_text}\n")
    print("助手: ", end="", flush=True)

    if os.environ.get("AGENT_REPLY_MODE", "stream") == "block":
        response = await agent.reply(user_msg)
        print(response.get_text_content())
    else:
        await _demo_stream(agent, user_msg)


if __name__ == "__main__":
    asyncio.run(main())
