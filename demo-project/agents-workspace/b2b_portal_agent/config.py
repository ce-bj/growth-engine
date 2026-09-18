# -*- coding: utf-8 -*-
"""模型与环境配置（OpenAI 兼容网关，与 demo-project 一致）。"""
from __future__ import annotations

import os
from contextvars import ContextVar
from urllib.parse import urlparse

DEFAULT_BASE_URL = "https://api.vveai.com/v1"
DEFAULT_MODEL = "qwen3.6-plus"

# 单轮对话由 bridge 绑定：前端右上角所选模型贯穿 Agent / 识图 / 内容生成
_request_model: ContextVar[str | None] = ContextVar("b2b_request_model", default=None)


def get_api_key() -> str:
    key = os.environ.get("OPENAI_API_KEY") or os.environ.get("VVEAI_API_KEY", "")
    if not key:
        raise ValueError("请设置环境变量 OPENAI_API_KEY 或 VVEAI_API_KEY")
    return key


def get_base_url() -> str:
    return os.environ.get("OPENAI_BASE_URL", DEFAULT_BASE_URL)


def get_model_name() -> str:
    raw = os.environ.get("OPENAI_MODEL", DEFAULT_MODEL).strip()
    # .env 误填逗号分隔列表时取第一个，避免整串传给 API
    if "," in raw:
        return raw.split(",")[0].strip() or DEFAULT_MODEL
    return raw or DEFAULT_MODEL


def bind_request_model(model_name: str | None) -> None:
    """Bridge 在每轮 SSE 开始时绑定前端所选模型。"""
    name = (model_name or "").strip()
    _request_model.set(name or None)


def reset_request_model() -> None:
    _request_model.set(None)


def get_effective_model_name() -> str:
    """当前请求实际使用的模型：优先前端选择，否则环境默认。"""
    bound = _request_model.get()
    if bound:
        return bound
    return get_model_name()


def get_vision_model_name() -> str:
    """识图专用模型：与对话模型解耦，默认走轻量多模态以提速。"""
    explicit = os.environ.get("VISION_MODEL", "").strip()
    if explicit:
        return explicit
    chat = get_effective_model_name().lower()
    if any(k in chat for k in ("vl", "vision", "4o", "gemini", "gpt-4")):
        return get_effective_model_name()
    default_fast = os.environ.get("VISION_MODEL_DEFAULT", "qwen-vl-plus").strip()
    return default_fast or get_effective_model_name()


def get_vision_timeout_sec() -> float:
    """视觉 API 单次 HTTP 超时（秒）。降低到 18s 以避免过长等待。"""
    raw = os.environ.get("VISION_TIMEOUT_SEC", "18").strip()
    try:
        return max(10.0, float(raw))
    except ValueError:
        return 18.0


def use_fast_vision_prompt() -> bool:
    """默认精简识图 prompt，减少 token 与延迟。"""
    raw = os.environ.get("VISION_PROMPT_MODE", "fast").strip().lower()
    return raw not in ("full", "detailed", "verbose")


def get_model_options() -> list[str]:
    """可选模型列表（逗号分隔），供前端下拉；未配置时仅返回默认模型。"""
    raw = os.environ.get("OPENAI_MODEL_OPTIONS", "").strip()
    if raw:
        options = [item.strip() for item in raw.split(",") if item.strip()]
        if options:
            return options
    return [get_model_name()]


def get_thinking_enable() -> bool:
    """是否开启模型思考链（对应 ThinkingBlock / reasoning_content 流式事件）。"""
    raw = os.environ.get("OPENAI_THINKING_ENABLE", "true").strip().lower()
    return raw not in ("0", "false", "no", "off")


def get_content_gen_batch_size() -> int:
    """富文本模块每批 LLM 请求数量（越大越少往返，但单次更慢）。"""
    raw = os.environ.get("CONTENT_GEN_BATCH_SIZE", "10").strip()
    try:
        size = int(raw)
    except ValueError:
        size = 10
    return max(3, min(size, 16))


def get_content_gen_model_name() -> str:
    """内容生成专用模型；未配置时与对话模型一致。"""
    explicit = os.environ.get("CONTENT_GEN_MODEL", "").strip()
    if explicit:
        return explicit
    return get_effective_model_name()


def is_deepseek_model(model_name: str | None = None) -> bool:
    name = (model_name or get_effective_model_name()).lower()
    return "deepseek" in name


def ensure_api_bypass_proxy(base_url: str | None) -> None:
    """避免系统 HTTP 代理导致连模型网关失败。"""
    if not base_url:
        return
    host = urlparse(base_url).hostname
    if not host:
        return
    for key in ("NO_PROXY", "no_proxy"):
        parts = [p.strip() for p in os.environ.get(key, "").split(",") if p.strip()]
        if host not in parts:
            os.environ[key] = ",".join([host, *parts])
