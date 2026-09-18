# -*- coding: utf-8 -*-
"""产品详情页发布工具 — 识图、查规范、按模块生成。"""
from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from typing import Any

from agentscope.message import TextBlock, ToolResultState
from agentscope.tool import ToolChunk

from .build_generation_brief import build_generation_brief_payload
from .content_generator import generate_structured_content_stream
from .content_stream import encode_stream_event
from .image_analysis import analyze_images_async
from .image_context import normalize_pixel_data
from .knowledge import lookup_spec, query_spec_with_context, search_industries
from .patch_page_draft import patch_page_draft_stream
from .restore_page_draft import restore_page_draft_stream


def _json_text(data: dict[str, Any]) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


def _coerce_image_urls(image_urls: list[str] | str | None) -> list[str]:
    if image_urls is None:
        return []
    if isinstance(image_urls, str):
        raw = image_urls.strip()
        if not raw or raw.lower() in ("[]", "null", "none"):
            return []
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(u) for u in parsed if u]
        except json.JSONDecodeError:
            return [raw]
        return []
    return [str(u) for u in image_urls if u]


async def analyze_product_images(
    image_urls: list[str] | str | None = None,
    user_message: str = "",
) -> ToolChunk:
    """分析用户上传的产品图/规格图，识别行业、品类、可见属性与规格参数。

    支持多图混合场景：产品实拍、参数表/铭牌、无关图片会分别标注 ``imageRole``。
    用户通过聊天附件上传时，``image_urls`` 可传 ``upload://文件名`` 或留空，
    工具会自动读取本轮会话绑定的图片像素。

    返回 ``analysis`` 可直接用于 ``lookup_content_spec``；``perImage`` 含每张图角色；
    若 ``analysis.hasIrrelevantImages`` 为 true，须向用户说明并引导换图。

    Args:
        image_urls: 可选。门户附件 URL、公网链接或 ``upload://文件名`` 列表。
        user_message: 用户的原始消息文字，用于辅助判断行业和产品定位（如用户身份、使用场景等）。
    """
    urls = _coerce_image_urls(image_urls)
    from .image_context import get_session_images

    session_imgs = get_session_images()
    explicit = session_imgs if session_imgs and any(
        normalize_pixel_data(img.data) for img in session_imgs
    ) else None
    result = await analyze_images_async(
        urls,
        user_message=user_message,
        explicit_images=explicit,
    )
    return ToolChunk(content=[TextBlock(text=_json_text(result))])


async def lookup_content_spec(
    industry: str,
    product_category: str = "",
) -> ToolChunk:
    """查询行业 A+B 内容规范 v2：generatableModules（4 项）+ industryHints。

    运营助手仅生成 A（名称/概述/图片说明）与 B（HTML 详情）。
    C/D 由模板预制，见返回中的 ``templatePrefab`` 与 ``doNotGenerate``。

    Args:
        industry: Agent 判断的行业名称，如「泵阀设备」「工业机器人」。
        product_category: 可选，更细的品类，如「工业泵」「人形机器人」。
    """
    result = lookup_spec(industry, product_category)
    return ToolChunk(content=[TextBlock(text=_json_text(result))])


async def query_industry_page_spec(
    industry: str,
    product_category: str,
    product_attributes: dict[str, Any] | str = "",
) -> ToolChunk:
    """（兼容别名）查询行业详情页内容规范，等价于 ``lookup_content_spec`` + 属性上下文。

    Args:
        industry: 行业名称。
        product_category: 产品品类。
        product_attributes: 图像分析 JSON 或对象，可含 productCategory 等字段。
    """
    result = query_spec_with_context(industry, product_category, product_attributes)
    return ToolChunk(content=[TextBlock(text=_json_text(result))])


async def search_agent_industries(query: str, limit: int = 20) -> ToolChunk:
    """在行业主库中搜索候选行业（200+ 条），识图不确定时辅助选型。

    Args:
        query: 搜索关键词，如「泵」「食品」「注塑」。
        limit: 返回条数上限，默认 20。
    """
    result = search_industries(query, limit=limit)
    return ToolChunk(content=[TextBlock(text=_json_text(result))])


async def _stream_tool_events(event_stream):
    async for event in event_stream:
        event_type = event.get("type")
        if event_type == "complete":
            result = event.get("result") or {}
            yield ToolChunk(
                content=[TextBlock(text=_json_text(result))],
                state=ToolResultState.SUCCESS,
                is_last=True,
            )
            return
        yield ToolChunk(
            content=[TextBlock(text=encode_stream_event(event))],
            state=ToolResultState.RUNNING,
            is_last=False,
        )


async def build_generation_brief(
    page_spec: str,
    image_analysis: str = "",
    user_message: str = "",
) -> ToolChunk:
    """构建「生成前摘要」：识别结果、四维度澄清、可勾选章节、待补充清单。

    须在 ``lookup_content_spec`` 之后、``generate_product_content`` 之前调用。
    返回 ``status``：
    - ``needs_clarification``：须先完成澄清卡片
    - ``awaiting_confirm``：展示摘要卡，等待用户点「先生成」
    - ``confirmed``：仅当前端 ``client_action=confirm_generate`` 后由 Bridge 写入

    Args:
        page_spec: ``lookup_content_spec`` 完整 JSON。
        image_analysis: 识图结果 JSON。
        user_message: 用户本轮文字需求。
    """
    from .brief_session import get_generation_brief

    brief = build_generation_brief_payload(
        page_spec,
        image_analysis or "{}",
        user_message=user_message,
        existing_brief=get_generation_brief(),
    )
    return ToolChunk(content=[TextBlock(text=_json_text(brief))])


async def generate_product_content(
    page_spec: str,
    image_analysis: str,
    user_message: str,
    mode: str = "create",
    current_draft: str = "",
    selected_topics: str = "",
) -> AsyncGenerator[ToolChunk, None]:
    """按 v2 规范生成或修订产品详情：A 三字段 + B 单块 HTML。

  流式返回：占位/当前稿 → A 层 → B HTML → 最终 JSON（``pageDraft.version=2``）。

    Args:
        page_spec: ``lookup_content_spec`` 完整 JSON。
        image_analysis: 识图结果 JSON（修订时可传简版或 ``{}``）。
        user_message: 用户本轮需求或修改意见。
        mode: ``create`` 首发全量生成；``revise`` 基于 ``current_draft`` 修订（大段 B 层重写）。
        current_draft: ``mode=revise`` 时必填，传【当前详情页草稿】完整 JSON 或 ``pageDraft``。
        selected_topics: 可选 JSON 数组字符串，用户勾选的 B 层章节；缺省读会话 GenerationBrief。
    """
    draft_arg = current_draft.strip() if current_draft else None
    topics: list[str] = []
    if selected_topics and str(selected_topics).strip():
        try:
            parsed = json.loads(selected_topics)
            if isinstance(parsed, list):
                topics = [str(t) for t in parsed if t]
        except json.JSONDecodeError:
            topics = [selected_topics.strip()]
    async for chunk in _stream_tool_events(
        generate_structured_content_stream(
            page_spec,
            image_analysis,
            user_message,
            mode=mode,
            current_draft=draft_arg,
            selected_topics=topics or None,
        ),
    ):
        yield chunk


async def patch_page_draft(
    current_draft: str,
    edits: str,
    page_spec: str = "",
) -> AsyncGenerator[ToolChunk, None]:
    """局部修订详情页草稿（不重写整页 HTML）。

    适用于改某一 h2 章节文字/颜色、改 A 层单字段等**小范围**修改。
    ``edits`` 为 JSON 数组，每项示例：

    - B 层改文字+颜色：``{"target":"layerB.body","section_heading":"产品介绍","action":"replace_text","text":"你好","color":"#e53e3e"}``
    - B 层改 HTML：``{"target":"layerB.body","section_heading":"产品介绍","action":"replace_section_html","html":"<p style=\\"color:red\\">…</p>"}``
    - A 层：``{"target":"layerA.title","action":"set","value":"新标题"}``

    Args:
        current_draft: 【当前详情页草稿】完整 JSON（含 ``slots``、``draftId``）。
        edits: JSON 数组字符串，见上。
        page_spec: 可选，lookup 结果 JSON（用于覆盖率元数据）。
    """
    async for chunk in _stream_tool_events(
        patch_page_draft_stream(current_draft, edits, page_spec=page_spec or None),
    ):
        yield chunk


async def restore_page_draft(
    version: int = -1,
    page_spec: str = "",
) -> AsyncGenerator[ToolChunk, None]:
    """恢复详情页草稿到历史版本（回退/撤销）。

    ``version=-1`` 表示**上一版**（当前版的前一快照）。用户说「回退」「撤销」「上一版」时**必须**调用本工具，
    **禁止**用 ``patch_page_draft`` 或 ``generate_product_content(mode=revise)`` 模拟撤销。

    Args:
        version: 目标版本号，默认 ``-1`` 为上一版。
        page_spec: 可选，lookup 结果 JSON（用于覆盖率元数据）。
    """
    async for chunk in _stream_tool_events(
        restore_page_draft_stream(version, page_spec=page_spec or None),
    ):
        yield chunk


__all__ = [
    "analyze_product_images",
    "build_generation_brief",
    "lookup_content_spec",
    "query_industry_page_spec",
    "search_agent_industries",
    "generate_product_content",
    "patch_page_draft",
    "restore_page_draft",
]
