# -*- coding: utf-8 -*-
"""HTTP + SSE 桥接：将 agents-workspace 下的 Python Agent 接到 demo-project 前端。"""
from __future__ import annotations

import asyncio
import base64
import contextlib
import importlib
import json
import os
import re
import sys
import time
import uuid
from pathlib import Path
from typing import Any, AsyncIterator
from urllib.parse import urlparse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# 优先用 demo-project 自带的 agents-workspace，没有再回退到上一级 outputs/
DEMO_PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUTS_ROOT = DEMO_PROJECT_ROOT.parent
_local_agents = DEMO_PROJECT_ROOT / "agents-workspace"
AGENTS_WORKSPACE = (
    _local_agents
    if (_local_agents / "ai_ops_assistant").is_dir()
    else OUTPUTS_ROOT / "agents-workspace"
)
for _path in (DEMO_PROJECT_ROOT, AGENTS_WORKSPACE, OUTPUTS_ROOT):
    if str(_path) not in sys.path:
        sys.path.insert(0, str(_path))

ENV_FILE = DEMO_PROJECT_ROOT / ".env.server"


def load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("#"):
            continue
        if "=" not in trimmed:
            continue
        key, value = trimmed.split("=", 1)
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        if key and (key not in os.environ or not str(os.environ.get(key, "")).strip()):
            os.environ[key] = value


load_env_file(ENV_FILE)

from langfuse_otel import (  # noqa: E402
    flush_langfuse_otel,
    get_langfuse_status,
    setup_langfuse_otel,
)
from session_log import TurnRecorder, ensure_log_dirs, sanitize_chat_request  # noqa: E402
from specialist_session import (  # noqa: E402
    append_message as specialist_append_message,
    enter as specialist_enter_session,
    exit as specialist_exit_session,
    get_active as get_active_specialist,
    is_exit_utterance,
    merge_artifacts as specialist_merge_artifacts,
)
from tool_narration import running_hint, summarize_tool_result  # noqa: E402

# AgentScope 2.x：先装 TracerProvider，再跑 Agent（配合 TracingMiddleware）
setup_langfuse_otel()

from agentscope.event import EventType  # noqa: E402
from agentscope.message import Base64Source, DataBlock, TextBlock, URLSource, UserMsg  # noqa: E402

# 主 Agent（Supervisor）；产品详情会话态仍挂在 Specialist 工具包上
_AGENT_MODULE = os.environ.get("PYTHON_AGENT_MODULE", "ai_ops_assistant")
_SPECIALIST_MODULE = os.environ.get(
    "PRODUCT_DETAIL_AGENT_MODULE",
    "b2b_portal_agent",
)
_image_ctx = importlib.import_module(f"{_SPECIALIST_MODULE}.tools.image_context")
SessionImage = _image_ctx.SessionImage
bind_session_images = _image_ctx.bind_session_images
reset_session_images = _image_ctx.reset_session_images
set_preanalysis = _image_ctx.set_preanalysis
normalize_pixel_data = _image_ctx.normalize_pixel_data
_draft_history = importlib.import_module(f"{_SPECIALIST_MODULE}.tools.draft_history")
bind_draft_session = _draft_history.bind_draft_session
hydrate_draft_history = _draft_history.hydrate_draft_history
push_draft_version = _draft_history.push_draft_version
format_draft_history_block = _draft_history.format_history_block
export_draft_history_for_client = _draft_history.export_history_for_client
_brief_session = importlib.import_module(f"{_SPECIALIST_MODULE}.tools.brief_session")
bind_brief_session = _brief_session.bind_brief_session
hydrate_generation_brief = _brief_session.hydrate_generation_brief
merge_client_brief = _brief_session.merge_client_brief
confirm_generation_brief = _brief_session.confirm_generation_brief
format_brief_block = _brief_session.format_brief_block
export_brief_for_client = _brief_session.export_brief_for_client
brief_gate_enabled = _brief_session.brief_gate_enabled
clear_generation_brief = _brief_session.clear_generation_brief
_tool_guard = importlib.import_module(f"{_SPECIALIST_MODULE}.tools.tool_guard")
bind_turn_guard = _tool_guard.bind_turn_guard
reset_turn_guard = _tool_guard.reset_turn_guard
_image_analysis = importlib.import_module(f"{_SPECIALIST_MODULE}.tools.image_analysis")
analyze_images_async = _image_analysis.analyze_images_async
_content_stream = importlib.import_module(f"{_SPECIALIST_MODULE}.tools.content_stream")
consume_tool_output_delta = _content_stream.consume_tool_output_delta

_agent_pkg = importlib.import_module(_AGENT_MODULE)
AGENT_NAME = _agent_pkg.AGENT_NAME
build_agent = _agent_pkg.build_agent
build_model = _agent_pkg.build_model

# 主 Agent 委托：注入本轮 UserMsg
_pending_msg = None
try:
    _pending_msg = importlib.import_module(f"{_AGENT_MODULE}.pending_msg")
except ModuleNotFoundError:
    _pending_msg = None

_GENERATE_CONFIRM_RE = re.compile(
    r"【用户已确认产品信息·允许 generate】|【用户已确认生成摘要·允许 generate】|"
    r"确认生成|先生成|开始生成|直接生成|开始吧|没问题|可以生成",
    re.IGNORECASE,
)
_SUBMIT_CLARIFICATION_RE = re.compile(
    r"【用户已提交澄清答案】|已完成关键澄清|submit_clarification",
    re.IGNORECASE,
)

_BRIEF_SLIM_KEYS = (
    "version",
    "briefId",
    "status",
    "recognition",
    "clarification",
    "generatableModules",
    "suggestedTopics",
    "gaps",
    "pageTemplateId",
)


def _slim_brief_for_sse(brief: dict[str, Any]) -> dict[str, Any]:
    return {
        k: brief.get(k)
        for k in _BRIEF_SLIM_KEYS
        if brief.get(k) is not None
    }


def _parse_brief_output(output: str) -> dict[str, Any] | None:
    raw = (output or "").strip()
    if not raw.startswith("{"):
        return None
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) and data.get("briefId") else None
    except (json.JSONDecodeError, TypeError):
        return None


TOOL_TITLES = {
    "analyze_product_images": "图像智能分析",
    "lookup_content_spec": "行业内容规范查询",
    "query_industry_page_spec": "行业规范与模块查询",
    "search_agent_industries": "行业库搜索",
    "build_generation_brief": "生成前摘要与澄清",
    "generate_product_content": "详情页内容生成（AI）",
    "patch_page_draft": "详情页局部修订",
    "restore_page_draft": "恢复历史草稿版本",
    "list_available_agents": "列出子 Agent",
    "delegate_product_detail_agent": "委托·产品详情页 Agent",
    "get_snapshot": "增长诊断快照",
    "get_metric_detail": "指标切片查询",
    "get_page_content": "读取页面内容",
    "propose_hypothesis": "提议候选假设",
    "run_phase_a_golden_path_tool": "增长诊断金路径（已替换）",
    "delegate_metrics_agent": "委托·业务指标归因 Agent",
    "analyze": "数据分析包",
    "list_analysis_packs": "列出分析包",
    "lookup_cause_action_map": "根因→措施映射",
    "record_handoff_mock": "定界交接（Mock）",
    "delegate_marketing_page_agent": "委托·智能营销页（占位）",
    "delegate_site_content_agent": "委托·站点内容（占位）",
    "Skill": "产品详情页技能",
    "skill": "产品详情页技能",
}

DEFAULT_SESSION = "product-publish-demo"
BRIDGE_PORT = int(os.environ.get("AGENT_BRIDGE_PORT", "8790"))
SSE_PING_INTERVAL_SEC = float(os.environ.get("SSE_PING_INTERVAL_SEC", "15"))
IMAGE_ANALYSIS_TIMEOUT_SEC = float(os.environ.get("IMAGE_ANALYSIS_TIMEOUT_SEC", "20"))
IMAGE_ANALYSIS_FALLBACK_TIMEOUT_SEC = float(
    os.environ.get("IMAGE_ANALYSIS_FALLBACK_TIMEOUT_SEC", "10"),
)
FRONTEND_ORIGIN = os.environ.get("DEMO_FRONTEND_ORIGIN", "http://localhost:5174")
PUBLIC_DIR = DEMO_PROJECT_ROOT / "public"
LOCAL_MEDIA = {
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}

app = FastAPI(title="AI Ops Assistant Multi-Agent Bridge")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_agents: dict[str, Any] = {}
_agents_lock = asyncio.Lock()
SESSION_LOG_DIR = ensure_log_dirs()


class ImagePayload(BaseModel):
    url: str | None = None
    data: str | None = None
    media_type: str = "image/jpeg"
    name: str | None = None


class ConversationTurn(BaseModel):
    role: str = "assistant"
    text: str = ""


class ChatRequest(BaseModel):
    message: str = ""
    image_urls: list[str] = Field(default_factory=list)
    images: list[ImagePayload] = Field(default_factory=list)
    session_id: str = DEFAULT_SESSION
    model: str | None = None
    page_draft: dict[str, Any] | None = None
    draft_history: list[dict[str, Any]] = Field(default_factory=list)
    site_archives: str | None = None
    generation_brief: dict[str, Any] | None = None
    client_action: str | None = None
    conversation: list[ConversationTurn] = Field(default_factory=list)


def _resolve_client_action(req: ChatRequest) -> str:
    explicit = (req.client_action or "").strip().lower()
    if explicit:
        return explicit
    if _GENERATE_CONFIRM_RE.search(req.message or ""):
        return "confirm_generate"
    if _SUBMIT_CLARIFICATION_RE.search(req.message or ""):
        return "dialogue_confirmed"
    return ""


def _record_draft_version(
    page_draft: dict[str, Any] | None,
    *,
    label: str,
    source: str,
) -> list[dict[str, Any]]:
    if not page_draft:
        return []
    ver = push_draft_version(page_draft, label=label, source=source, skip_if_unchanged=True)
    if ver is None:
        return []
    return export_draft_history_for_client()


class StreamState:
    def __init__(self) -> None:
        self.tool_inputs: dict[str, str] = {}
        self.tool_outputs: dict[str, str] = {}
        self.tool_names: dict[str, str] = {}
        self.thinking_buffers: dict[str, str] = {}
        self.text_buffers: dict[str, str] = {}
        self.reasoning_seq = 0
        self.active_reasoning_id: str | None = None
        self.gen_progress_buffers: dict[str, str] = {}


def _map_gen_stream_events(
    events: list[dict[str, Any]],
    *,
    tool_call_id: str,
    tool_name: str,
) -> list[dict[str, Any]]:
    payloads: list[dict[str, Any]] = []
    for ev in events:
        et = ev.get("type")
        if et == "progress":
            payloads.append(
                {
                    "type": "tool_progress",
                    "id": tool_call_id,
                    "name": tool_name,
                    "title": TOOL_TITLES.get(tool_name, tool_name),
                    "phase": ev.get("phase"),
                    "completed": ev.get("completed"),
                    "total": ev.get("total"),
                    "message": ev.get("message"),
                },
            )
        elif et == "page_draft" and ev.get("draft"):
            payloads.append(
                {
                    "type": "page_draft",
                    "state": ev.get("draftState", "streaming"),
                    "draft": ev["draft"],
                },
            )
            if ev.get("message"):
                payloads.append(
                    {
                        "type": "tool_progress",
                        "id": tool_call_id,
                        "name": tool_name,
                        "title": TOOL_TITLES.get(tool_name, tool_name),
                        "phase": ev.get("draftState", "streaming"),
                        "message": ev.get("message"),
                    },
                )
        elif et == "module_stream":
            preview = str(ev.get("preview", "")).strip()
            payloads.append(
                {
                    "type": "tool_progress",
                    "id": tool_call_id,
                    "name": tool_name,
                    "title": TOOL_TITLES.get(tool_name, tool_name),
                    "phase": "module_stream",
                    "moduleId": ev.get("moduleId"),
                    "message": (
                        f"模块 #{ev.get('moduleId')} 流式生成中"
                        + (f"：{preview[:60]}…" if preview else "…")
                    ),
                },
            )
    return payloads


def close_reasoning_segment(state: StreamState) -> list[dict[str, Any]]:
    if not state.active_reasoning_id:
        return []
    block_id = state.active_reasoning_id
    content = state.thinking_buffers.pop(block_id, "")
    state.active_reasoning_id = None
    if not content.strip():
        return []
    return [
        {
            "type": "thinking_end",
            "id": block_id,
            "title": "推理过程",
            "content": content,
        },
    ]


TOOL_REASONING_ID = "reasoning-tools"


def ensure_tool_reasoning_segment(state: StreamState, title: str = "推理过程") -> list[dict[str, Any]]:
    """工具流期间合并为单一推理折叠块，避免左侧出现多个「深度思考」。"""
    if state.active_reasoning_id == TOOL_REASONING_ID:
        return []
    events = close_reasoning_segment(state)
    state.active_reasoning_id = TOOL_REASONING_ID
    state.thinking_buffers[TOOL_REASONING_ID] = ""
    events.append({"type": "thinking_start", "id": TOOL_REASONING_ID, "title": title})
    return events


def start_reasoning_segment(state: StreamState, title: str = "深度思考") -> list[dict[str, Any]]:
    return ensure_tool_reasoning_segment(state, title)


def append_reasoning_delta(state: StreamState, text: str) -> list[dict[str, Any]]:
    events = ensure_tool_reasoning_segment(state)
    block_id = state.active_reasoning_id
    if not block_id:
        return events
    state.thinking_buffers[block_id] = state.thinking_buffers.get(block_id, "") + text
    events.append({"type": "thinking_delta", "id": block_id, "title": "推理过程", "text": text})
    return events


def default_demo_image_urls() -> list[str]:
    return [
        f"{FRONTEND_ORIGIN.rstrip('/')}/images/valve-hero.svg",
        f"{FRONTEND_ORIGIN.rstrip('/')}/images/valve-angle.png",
    ]


def should_attach_demo_images(message: str, image_urls: list[str]) -> bool:
    if image_urls:
        return False
    text = message.strip()
    # 仅当用户明确提到有图时附带示例图，避免纯文字「产品发布」触发 localhost URL
    return bool(text) and any(kw in text for kw in ("实拍", "附件", "图片", "上传"))


def is_local_host(host: str | None) -> bool:
    if not host:
        return False
    if host in ("localhost", "127.0.0.1", "::1"):
        return True
    return host.startswith(("192.168.", "10.", "172."))


def data_block_from_url(url: str) -> DataBlock:
    """本地 / 局域网 URL 转 Base64，避免 vveai 无法拉取 localhost 导致 500。"""
    parsed = urlparse(url)
    if is_local_host(parsed.hostname):
        rel = parsed.path.lstrip("/")
        candidates = [
            PUBLIC_DIR / rel,
            PUBLIC_DIR / "images" / Path(rel).name,
        ]
        for local_path in candidates:
            if local_path.is_file():
                media_type = LOCAL_MEDIA.get(local_path.suffix.lower(), "image/jpeg")
                encoded = base64.b64encode(local_path.read_bytes()).decode("ascii")
                return DataBlock(
                    source=Base64Source(data=encoded, media_type=media_type),
                    name=local_path.name,
                )

    suffix = Path(parsed.path).suffix.lower()
    media_type = LOCAL_MEDIA.get(suffix, "image/jpeg")
    return DataBlock(
        source=URLSource(url=url, media_type=media_type),
    )


def _attachment_hint(mock_urls: list[str], images: list[ImagePayload]) -> str:
    if not mock_urls:
        return ""
    labels: list[str] = []
    for idx, url in enumerate(mock_urls):
        name = url.removeprefix("upload://")
        if idx < len(images) and images[idx].name:
            name = images[idx].name or name
        labels.append(name or f"图片{idx + 1}")
    joined = "、".join(labels)
    return (
        f"【本轮附件】共 {len(mock_urls)} 张图片：{joined}。"
        "系统将在本轮自动完成识图；若消息中已有【系统识图结果】，请直接使用，勿再索要实拍图。\n\n"
    )


def _format_preanalysis_block(result: dict[str, Any]) -> str:
    analysis = result.get("analysis") or {}
    industry = analysis.get("industryName", "待确认")
    category = analysis.get("productCategory", "待识别")
    mode = result.get("analysisMode", "vision")
    roles = analysis.get("imageRoleSummary") or {}
    role_bits = []
    if roles.get("product_photo"):
        role_bits.append(f"产品图×{roles['product_photo']}")
    if roles.get("spec_sheet"):
        role_bits.append(f"规格图×{roles['spec_sheet']}")
    if roles.get("irrelevant"):
        role_bits.append(f"无关图×{roles['irrelevant']}")
    role_line = "、".join(role_bits) if role_bits else "见 perImage"

    # 构建精简版结果，只保留 agent 澄清对话所需的关键字段
    # 避免完整 vision JSON（含 perImage 详细描述）导致消息过大、LLM 响应缓慢
    slim_result = {
        "image_urls": result.get("image_urls", []),
        "imageCount": result.get("imageCount", 0),
        "analysisMode": mode,
        "analysis": {
            "industryName": industry,
            "productCategory": category,
            "industryType": analysis.get("industryType", ""),
            "visibleFeatures": analysis.get("visibleFeatures", []),
            "visibleAttributes": analysis.get("visibleAttributes", {}),
            "likelyScenarios": analysis.get("likelyScenarios", []),
            "likelyAdvantages": analysis.get("likelyAdvantages", []),
            "extractedSpecifications": analysis.get("extractedSpecifications", {}),
            "confidence": analysis.get("confidence", 0),
            "notes": analysis.get("notes", ""),
            "userGuidance": analysis.get("userGuidance", ""),
            "imageRoleSummary": analysis.get("imageRoleSummary", {}),
        },
    }
    return (
        "【系统识图结果·本轮已自动完成】\n"
        f"- 模式：{mode}；行业/品类：{industry} / {category}；图片角色：{role_line}\n"
        "- 用户已上传附件，**禁止**再索要「产品实拍图」。请用下方 JSON 作为 analyze_product_images 的等价结果。\n"
        f"{json.dumps(slim_result, ensure_ascii=False, indent=2)}"
    )


def _preanalyze_payloads(
    state: StreamState,
    *,
    call_id: str,
    tool_input: str,
    output: str,
) -> list[dict[str, Any]]:
    """生成预识图工具的 SSE 事件（与 map_event 工具卡片格式一致）。"""
    tool_name = "analyze_product_images"
    title = TOOL_TITLES.get(tool_name, tool_name)
    summary = summarize_tool_result(tool_name, output)
    out: list[dict[str, Any]] = [{"type": "text_segment_break"}]
    out.extend(start_reasoning_segment(state, "推理过程"))
    out.extend(
        append_reasoning_delta(
            state,
            f"\n▶ **{title}**（系统自动）：{running_hint(tool_name, tool_input)}\n"
            f"  参数：{tool_input}\n",
        ),
    )
    out.append(
        {
            "type": "tool_call",
            "id": call_id,
            "name": tool_name,
            "title": title,
            "status": "running",
            "input": tool_input,
        },
    )
    out.extend(append_reasoning_delta(state, f"✓ {summary}\n"))
    out.append(
        {
            "type": "tool_result",
            "id": call_id,
            "name": tool_name,
            "title": title,
            "status": "done",
            "summary": summary,
            "output": output,
        },
    )
    return out


WINDOW_CTX_MARK = "【本会话窗口已有内容】"


def format_conversation_block(
    turns: list[ConversationTurn] | list[dict[str, Any]] | None,
    *,
    max_chars: int = 12000,
) -> str:
    """把前端会话窗口内容编进 UserMsg，覆盖系统固定话术与 Agent 回复。"""
    if not turns:
        return ""
    parts: list[str] = []
    for turn in turns:
        if isinstance(turn, ConversationTurn):
            role = (turn.role or "assistant").strip().lower()
            text = (turn.text or "").strip()
        elif isinstance(turn, dict):
            role = str(turn.get("role") or "assistant").strip().lower()
            text = str(turn.get("text") or "").strip()
        else:
            continue
        if not text:
            continue
        label = "用户" if role == "user" else "助手"
        parts.append(f"{label}：{text}")
    if not parts:
        return ""
    header = (
        f"{WINDOW_CTX_MARK}\n"
        "以下内容已经显示在当前会话窗口中（含系统固定话术、工具结果、结果卡片与此前回复），"
        "请作为上下文理解用户本轮指令。这些不是用户本轮新输入。\n\n"
    )
    footer = "\n【窗口上下文结束】\n\n"
    body = "\n\n".join(parts)
    budget = max(400, max_chars - len(header) - len(footer))
    if len(body) > budget:
        body = "…（更早的窗口内容已省略）\n\n" + body[-(budget - 24) :]
    return header + body + footer


def build_user_msg(
    message: str,
    image_urls: list[str],
    images: list[ImagePayload],
    preanalysis: dict[str, Any] | None = None,
    page_draft: dict[str, Any] | None = None,
    site_archives: str | None = None,
    client_action: str | None = None,
    conversation: list[ConversationTurn] | None = None,
) -> UserMsg:
    mock_urls: list[str] = []
    base_text = message or "请分析附件中的产品图"
    content: list[Any] = [TextBlock(text=base_text)]

    for img in images:
        if img.data:
            content.append(
                DataBlock(
                    source=Base64Source(
                        data=img.data,
                        media_type=img.media_type,
                    ),
                    name=img.name,
                ),
            )
            mock_urls.append(f"upload://{img.name or 'image'}")
        elif img.url:
            content.append(data_block_from_url(img.url))
            mock_urls.append(img.url)

    for url in image_urls:
        if url in mock_urls:
            continue
        content.append(data_block_from_url(url))
        mock_urls.append(url)

    if should_attach_demo_images(message, mock_urls):
        for url in default_demo_image_urls():
            if url in mock_urls:
                continue
            content.append(data_block_from_url(url))
            mock_urls.append(url)

    hint = _attachment_hint(mock_urls, images)
    preface = ""
    if preanalysis:
        preface = _format_preanalysis_block(preanalysis) + "\n\n"
    history_block = format_draft_history_block()
    draft_block = ""
    if page_draft:
        slots = page_draft.get("slots") if isinstance(page_draft, dict) else None
        slim = {
            "draftId": page_draft.get("draftId"),
            "templateId": page_draft.get("templateId"),
            "industryName": page_draft.get("industryName"),
            "productCategory": page_draft.get("productCategory"),
            "draftTitle": page_draft.get("draftTitle"),
            "slots": slots,
            "coverage": page_draft.get("coverage"),
        }
        draft_json = json.dumps(slim, ensure_ascii=False, indent=2)
        if len(draft_json) > 12000:
            draft_json = draft_json[:12000] + "\n…（草稿已截断）"
        draft_block = (
            "【当前详情页草稿（用户可能已在右侧手改）】\n"
            f"{draft_json}\n\n"
        )
    archive_block = ""
    if site_archives and str(site_archives).strip():
        archive_block = str(site_archives).strip() + "\n\n"
    brief_block = format_brief_block() if brief_gate_enabled() else ""
    conversation_block = ""
    if WINDOW_CTX_MARK not in base_text:
        conversation_block = format_conversation_block(conversation)
    action = (client_action or "").strip().lower()
    action_block = ""
    if action in ("confirm_generate", "dialogue_confirmed"):
        action_block = (
            "【用户已确认产品信息·允许 generate】\n"
            "请依次 lookup_content_spec → generate_product_content(mode=create)。"
            "**禁止**调用 build_generation_brief。\n\n"
        )
    elif action == "submit_clarification":
        action_block = (
            "【用户已在对话中完成澄清】\n"
            "请 lookup_content_spec → generate_product_content(mode=create)。\n\n"
        )
    elif action == "supplement_materials":
        action_block = "【用户选择补充资料】\n请引导上传图片/参数，勿急于 generate。\n\n"
    elif action == "update_brief":
        action_block = ""
    content[0] = TextBlock(
        text=(
            f"{preface}{history_block}{draft_block}{archive_block}{brief_block}"
            f"{conversation_block}{action_block}{hint}{base_text}"
        ),
    )

    return UserMsg(name="user", content=content)


def _config_module():
    """优先主 Agent 配置；Supervisor 会再导出 Specialist 的 bind/reset。"""
    return importlib.import_module(f"{_AGENT_MODULE}.config")


async def get_agent(session_id: str, model_name: str | None = None):
    config_mod = _config_module()
    effective = (model_name or config_mod.get_model_name()).strip()
    cache_key = f"{session_id}::{effective}"
    async with _agents_lock:
        if cache_key not in _agents:
            agent = build_agent(model=build_model(effective))
            # 对齐前端 session，写入 GenAI conversation.id → Langfuse session
            try:
                agent.state.session_id = session_id or DEFAULT_SESSION
            except Exception:  # noqa: BLE001
                pass
            _agents[cache_key] = agent
        return _agents[cache_key]


def sse_line(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _parse_handoff_tool_output(output: str) -> dict[str, Any] | None:
    raw = (output or "").strip()
    if not raw.startswith("{"):
        return None
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None
    if isinstance(data, dict) and data.get("handoff") and data.get("specialistId"):
        return data
    return None


def _tag_payload(
    payload: dict[str, Any],
    *,
    speaker: str | None = None,
    handoff_id: str | None = None,
) -> dict[str, Any]:
    out = dict(payload)
    if speaker:
        out["speaker"] = speaker
    if handoff_id:
        out["handoff_id"] = handoff_id
    return out


async def _iter_specialist_stream(
    *,
    session_id: str,
    model_name: str | None,
    user_msg: UserMsg,
    active: dict[str, Any],
    emit: Any,
) -> AsyncIterator[str]:
    """顶层跑子 Agent（非嵌套工具），消息打 speaker/handoff_id。"""
    from ai_ops_assistant.session_registry import get_or_create_agent
    from growth_attribution_agent.agent import build_agent as build_metrics_agent
    from growth_attribution_agent.agent import build_model as build_metrics_model

    kind = active.get("kind") or "metrics_attribution_v2"
    specialist_id = active.get("specialist_id") or "metrics"
    handoff_id = active.get("handoff_id")
    speaker = f"specialist:{specialist_id}"

    def factory():
        return build_metrics_agent(
            model=build_metrics_model(model_name),
            enable_tracing=False,
        )

    specialist = await get_or_create_agent(
        kind=kind,
        session_id=session_id,
        model_name=model_name,
        factory=factory,
    )
    state = StreamState()
    text_bits: list[str] = []

    def emit_specialist(payload: dict[str, Any]) -> str:
        tagged = _tag_payload(payload, speaker=speaker, handoff_id=handoff_id)
        if tagged.get("type") == "text" and tagged.get("text"):
            text_bits.append(str(tagged["text"]))
        if tagged.get("type") == "tool_result" and tagged.get("output"):
            try:
                data = json.loads(tagged["output"])
            except json.JSONDecodeError:
                data = None
            if isinstance(data, dict) and (
                data.get("phase") == "A"
                or data.get("task_briefs")
                or data.get("root_cause")
            ):
                specialist_merge_artifacts(
                    session_id,
                    {
                        "attribution": {
                            "funnel_locate": data.get("funnel_locate"),
                            "anomaly_point": data.get("anomaly_point"),
                            "root_cause": data.get("root_cause"),
                            "task_briefs": data.get("task_briefs"),
                            "handoff": data.get("handoff"),
                            "change_list": data.get("change_list"),
                        },
                        "reportMarkdown": data.get("assistant_hint"),
                    },
                )
        return emit(tagged)

    async for chunk in _stream_agent_with_heartbeat(
        specialist,
        user_msg,
        state,
        emit_specialist,
    ):
        yield chunk

    if text_bits:
        specialist_append_message(session_id, "specialist", "".join(text_bits))


def _emit_exit_sse(emit: Any, transcript: dict[str, Any], *, reason: str) -> list[str]:
    # 退出只改外围框（specialist_exit），不在对话里播报「已退出某某 Agent」。
    return [
        emit(
            {
                "type": "specialist_exit",
                "handoff_id": transcript.get("handoff_id"),
                "reason": reason,
                "specialist": transcript.get("specialist"),
                "task_label": transcript.get("task_label"),
                "transcript": {
                    "summary_for_supervisor": transcript.get("summary_for_supervisor"),
                    "message_count": len(transcript.get("messages") or []),
                },
            },
        ),
    ]


def map_event(evt: Any, state: StreamState) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    etype = evt.type

    if etype == EventType.TEXT_BLOCK_START:
        state.text_buffers[evt.block_id] = ""
        out.append({"type": "text_start", "id": evt.block_id})
        return out

    if etype == EventType.TEXT_BLOCK_DELTA:
        if evt.delta:
            state.text_buffers[evt.block_id] = (
                state.text_buffers.get(evt.block_id, "") + evt.delta
            )
            out.append({"type": "text", "id": evt.block_id, "text": evt.delta})
        return out

    if etype == EventType.TEXT_BLOCK_END:
        out.append({"type": "text_end", "id": evt.block_id})
        return out

    if etype == EventType.THINKING_BLOCK_START:
        # 开启 agent 思考推理段落，实时展示思考过程
        out.extend(start_reasoning_segment(state, "深度思考"))
        return out

    if etype == EventType.THINKING_BLOCK_DELTA:
        # 流式输出 agent 的思考内容
        if evt.delta:
            out.extend(append_reasoning_delta(state, evt.delta))
        return out

    if etype == EventType.THINKING_BLOCK_END:
        # 思考段落结束（由下一个事件自动处理段落切换）
        return []

    if etype == EventType.MODEL_CALL_START:
        # 每次 LLM 调用都显示进度，让用户知道 agent 正在工作
        out.extend(start_reasoning_segment(state, "推理过程"))
        # 根据当前状态显示不同的进度提示
        if state.tool_names:
            # 已经调用过工具，现在是后续推理
            out.extend(
                append_reasoning_delta(
                    state,
                    "\n▶ 根据工具结果生成回复…\n",
                ),
            )
        else:
            # 首次调用 LLM
            out.extend(
                append_reasoning_delta(
                    state,
                    "分析用户消息，规划工具调用与回复结构…\n",
                ),
            )
        return out

    if etype == EventType.TOOL_CALL_START:
        out.append({"type": "text_segment_break"})
        state.tool_inputs[evt.tool_call_id] = ""
        state.tool_outputs[evt.tool_call_id] = ""
        state.tool_names[evt.tool_call_id] = evt.tool_call_name
        tool_name = evt.tool_call_name
        title = TOOL_TITLES.get(tool_name, tool_name)
        if not state.active_reasoning_id:
            out.extend(start_reasoning_segment(state, "推理过程"))
        out.extend(
            append_reasoning_delta(
                state,
                f"\n▶ **{title}**：{running_hint(tool_name)}\n",
            ),
        )
        out.append(
            {
                "type": "tool_call",
                "id": evt.tool_call_id,
                "name": tool_name,
                "title": title,
                "status": "running",
            },
        )
        return out

    if etype == EventType.TOOL_CALL_DELTA:
        state.tool_inputs[evt.tool_call_id] = (
            state.tool_inputs.get(evt.tool_call_id, "") + evt.delta
        )
        return out

    if etype == EventType.TOOL_CALL_END:
        tool_input = state.tool_inputs.get(evt.tool_call_id, "").strip()
        name = state.tool_names.get(evt.tool_call_id, "")
        payload: dict[str, Any] = {
            "type": "tool_call",
            "id": evt.tool_call_id,
            "name": name,
            "title": TOOL_TITLES.get(name, name),
            "status": "running",
        }
        if tool_input:
            payload["input"] = tool_input
            if not state.active_reasoning_id:
                out.extend(start_reasoning_segment(state, "推理过程"))
            out.extend(
                append_reasoning_delta(
                    state,
                    f"  参数：{tool_input[:200]}{'…' if len(tool_input) > 200 else ''}\n",
                ),
            )
        out.append(payload)
        return out

    if etype == EventType.TOOL_RESULT_TEXT_DELTA:
        tool_id = evt.tool_call_id
        name = state.tool_names.get(tool_id, "")
        pending = state.gen_progress_buffers.get(tool_id, "")
        clean, stream_events, pending = consume_tool_output_delta(pending, evt.delta)
        if pending:
            state.gen_progress_buffers[tool_id] = pending
        else:
            state.gen_progress_buffers.pop(tool_id, None)
        out.extend(
            _map_gen_stream_events(
                stream_events,
                tool_call_id=tool_id,
                tool_name=name,
            ),
        )
        if clean:
            state.tool_outputs[tool_id] = state.tool_outputs.get(tool_id, "") + clean
        return out

    if etype == EventType.TOOL_RESULT_END:
        name = state.tool_names.get(evt.tool_call_id, "")
        output = state.tool_outputs.pop(evt.tool_call_id, "")
        state.tool_inputs.pop(evt.tool_call_id, None)
        state.tool_names.pop(evt.tool_call_id, None)
        summary = summarize_tool_result(name, output)
        if not state.active_reasoning_id:
            out.extend(start_reasoning_segment(state, "推理过程"))
        out.extend(append_reasoning_delta(state, f"✓ {summary}\n"))
        payload: dict[str, Any] = {
            "type": "tool_result",
            "id": evt.tool_call_id,
            "name": name,
            "title": TOOL_TITLES.get(name, name),
            "status": "done",
            "summary": summary,
        }
        tool_output_for_chat = output
        if name == "build_generation_brief":
            parsed_brief = _parse_brief_output(output) or export_brief_for_client()
            if parsed_brief:
                slim_brief = _slim_brief_for_sse(parsed_brief)
                out.append({"type": "generation_brief", "brief": slim_brief})
                tool_output_for_chat = json.dumps(slim_brief, ensure_ascii=False, indent=2)
        _draft_tools = (
            "generate_product_content",
            "patch_page_draft",
            "restore_page_draft",
            "delegate_product_detail_agent",
        )
        if name in _draft_tools and output:
            try:
                parsed = json.loads(output)
                page_draft = parsed.get("pageDraft")
                if page_draft:
                    gen_mode = parsed.get("generationMode") or (
                        page_draft.get("meta") or {}
                    ).get("generationMode")
                    ok_modes = ("llm", "revise", "patch", "patch_partial", "restore")
                    if gen_mode in ok_modes:
                        history = _record_draft_version(
                            page_draft,
                            label=str(parsed.get("restoredLabel") or gen_mode),
                            source=name,
                        )
                        if history:
                            out.append({"type": "draft_history", "history": history})
                    out.append({
                        "type": "page_draft",
                        "state": "final" if gen_mode in ok_modes else (gen_mode or "ready"),
                        "draft": page_draft,
                    })
                preview = parsed.get("displayPreview", "")
                if (
                    preview
                    or name in ("patch_page_draft", "restore_page_draft", "delegate_product_detail_agent")
                    or parsed.get("generationMode")
                    or parsed.get("delegatedTo")
                ):
                    slim: dict[str, Any] = {
                        "draftTitle": parsed.get("draftTitle"),
                        "industryName": parsed.get("industryName"),
                        "coverage": parsed.get("coverage"),
                        "generationMode": parsed.get("generationMode"),
                        "delegatedTo": parsed.get("delegatedTo"),
                        "assistantSummary": parsed.get("assistantSummary"),
                        "ok": parsed.get("ok"),
                        "status": parsed.get("status"),
                        "message": parsed.get("message"),
                        "generationError": parsed.get("generationError"),
                        "complianceHint": parsed.get("complianceHint"),
                        "note": "完整正文已同步至右侧预览，聊天区仅保留摘要。",
                    }
                    if name == "patch_page_draft":
                        slim["patchApplied"] = parsed.get("patchApplied")
                        slim["patchErrors"] = parsed.get("patchErrors")
                    if name == "restore_page_draft":
                        slim["restoredFromVersion"] = parsed.get("restoredFromVersion")
                        slim["restoredLabel"] = parsed.get("restoredLabel")
                    tool_output_for_chat = json.dumps(
                        slim,
                        ensure_ascii=False,
                        indent=2,
                    )
            except (json.JSONDecodeError, TypeError):
                pass
        if tool_output_for_chat:
            payload["output"] = tool_output_for_chat
        out.append(payload)
        return out

    if etype == EventType.REPLY_END:
        out.extend(close_reasoning_segment(state))
        return out

    if etype == EventType.EXCEED_MAX_ITERS:
        out.append(
            {
                "type": "error",
                "message": "Agent 超过最大推理轮次，请简化问题后重试。",
            },
        )
        return out

    return out


async def _stream_agent_with_heartbeat(
    agent: Any,
    user_msg: UserMsg,
    state: StreamState,
    emit: Any,
) -> AsyncIterator[str]:
    queue: asyncio.Queue[tuple[str, Any]] = asyncio.Queue()

    async def _producer() -> None:
        try:
            async for evt in agent.reply_stream(user_msg):
                await queue.put(("evt", evt))
        except Exception as exc:  # noqa: BLE001
            await queue.put(("err", exc))
        finally:
            await queue.put(("done", None))

    producer = asyncio.create_task(_producer())
    try:
        while True:
            try:
                kind, item = await asyncio.wait_for(queue.get(), timeout=SSE_PING_INTERVAL_SEC)
            except asyncio.TimeoutError:
                yield emit({"type": "ping", "stage": "agent_working", "ts": time.time()})
                continue
            if kind == "done":
                break
            if kind == "err":
                raise item
            for payload in map_event(item, state):
                yield emit(payload)
    finally:
        if not producer.done():
            producer.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await producer


def _explicit_images_from_request(req: ChatRequest) -> list[SessionImage]:
    """从请求体构建带规范化 base64 的会话图片列表。"""
    explicit: list[SessionImage] = []
    for img in req.images:
        explicit.append(
            SessionImage(
                name=img.name or "image",
                data=normalize_pixel_data(img.data or ""),
                media_type=img.media_type or "image/jpeg",
                url=img.url or "",
            ),
        )
    return explicit


def _preanalyze_image_refs(req: ChatRequest) -> list[str]:
    refs: list[str] = []
    for img in req.images:
        if img.name:
            refs.append(f"upload://{img.name}")
        elif img.url:
            refs.append(img.url)
    refs.extend(req.image_urls or [])
    return refs


async def _preanalyze_fallback(req: ChatRequest, refs: list[str]) -> dict[str, Any]:
    """识图超时/异常：直接回退到文字启发式，不再二次重试视觉模型。

    原逻辑会再试一次视觉（FALLBACK_TIMEOUT_SEC），但实测中视觉模型若20s内无响应，
    再试10s也大概率失败，反而浪费了agent产生文本的宝贵时间。
    """
    explicit = _explicit_images_from_request(req)
    return await analyze_images_async(
        refs,
        user_message=req.message,
        explicit_images=explicit or None,
        skip_vision=True,
    )


async def stream_agent_events(req: ChatRequest) -> AsyncIterator[str]:
    has_images = bool(req.images or req.image_urls)
    resolved_action = _resolve_client_action(req)
    has_client_action = bool(resolved_action)
    session_id = req.session_id or DEFAULT_SESSION
    recorder = TurnRecorder(session_id, sanitize_chat_request(req))

    def emit(payload: dict[str, Any]) -> str:
        recorder.record_payload(payload)
        return sse_line(payload)

    if not req.message.strip() and not has_images and not has_client_action:
        yield emit({"type": "error", "message": "message、图片或卡片操作不能为空"})
        yield emit({"type": "done"})
        recorder.save()
        return

    try:
        yield emit({"type": "ping", "stage": "connected", "ts": time.time()})
        bind_draft_session(session_id)
        bind_brief_session(session_id)
        hydrate_draft_history(req.draft_history)
        if brief_gate_enabled():
            if req.generation_brief:
                merge_client_brief(req.generation_brief, client_action=resolved_action)
            elif resolved_action == "confirm_generate":
                confirm_generation_brief()
        else:
            clear_generation_brief()
        bind_turn_guard(req.message)
        if req.page_draft:
            _record_draft_version(req.page_draft, label="本轮入参", source="user")
        bind_session_images(
            [img.model_dump() for img in req.images],
            req.image_urls,
        )
        _config_mod = _config_module()
        _config_mod.bind_request_model(req.model)

        preanalysis: dict[str, Any] | None = None
        if has_images:
            pre_image_refs = _preanalyze_image_refs(req)
            explicit_images = _explicit_images_from_request(req)

            pre_status = StreamState()
            for payload in start_reasoning_segment(pre_status, "推理过程"):
                yield emit(payload)
            for payload in append_reasoning_delta(
                pre_status,
                "▶ 正在分析产品图片（多模态识图）…\n",
            ):
                yield emit(payload)

            pre_task = asyncio.create_task(
                analyze_images_async(
                    pre_image_refs,
                    user_message=req.message,
                    explicit_images=explicit_images or None,
                ),
            )
            deadline = time.monotonic() + IMAGE_ANALYSIS_TIMEOUT_SEC
            try:
                while not pre_task.done():
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        pre_task.cancel()
                        with contextlib.suppress(asyncio.CancelledError, Exception):
                            await pre_task
                        print(f"[preanalyze] timed out after {IMAGE_ANALYSIS_TIMEOUT_SEC}s")
                        preanalysis = await _preanalyze_fallback(req, pre_image_refs)
                        set_preanalysis(preanalysis)
                        break
                    wait = min(SSE_PING_INTERVAL_SEC, remaining)
                    try:
                        preanalysis = await asyncio.wait_for(
                            asyncio.shield(pre_task),
                            timeout=wait,
                        )
                        set_preanalysis(preanalysis)
                        break
                    except asyncio.TimeoutError:
                        yield emit(
                            {"type": "ping", "stage": "image_analysis", "ts": time.time()},
                        )
                        for payload in append_reasoning_delta(
                            pre_status,
                            "  识图仍在进行，请稍候…\n",
                        ):
                            yield emit(payload)
                if preanalysis is None and pre_task.done():
                    preanalysis = pre_task.result()
                    set_preanalysis(preanalysis)
            except Exception as exc:  # noqa: BLE001
                print(f"[preanalyze] failed: {exc}")
                preanalysis = await _preanalyze_fallback(req, pre_image_refs)
                set_preanalysis(preanalysis)

            if preanalysis:
                call_id = f"preanalyze-{uuid.uuid4().hex[:12]}"
                names = [img.name or "image" for img in req.images if img.name]
                tool_input = json.dumps(
                    {"image_urls": [f"upload://{n}" for n in names] or []},
                    ensure_ascii=False,
                )
                output = json.dumps(preanalysis, ensure_ascii=False, indent=2)
                for payload in _preanalyze_payloads(
                    pre_status,
                    call_id=call_id,
                    tool_input=tool_input,
                    output=output,
                ):
                    yield emit(payload)

            for payload in close_reasoning_segment(pre_status):
                yield emit(payload)

        agent = await get_agent(session_id, req.model)
        user_msg = build_user_msg(
            req.message,
            req.image_urls,
            req.images,
            preanalysis=preanalysis,
            page_draft=req.page_draft,
            site_archives=req.site_archives,
            client_action=resolved_action or req.client_action,
            conversation=req.conversation,
        )
        if _pending_msg is not None:
            _pending_msg.bind_pending_turn(
                user_msg,
                session_id=session_id,
                model_name=req.model,
            )
        state = StreamState()

        # ── Handoff：退出 / 托管中直聊 / 主 Agent 后进托管 ──
        active = get_active_specialist(session_id)
        want_exit = resolved_action == "specialist_exit" or (
            bool(active) and is_exit_utterance(req.message)
        )

        if want_exit:
            reason = (
                "user_close"
                if resolved_action == "specialist_exit"
                else "user_say_exit"
            )
            transcript = specialist_exit_session(session_id, reason=reason)
            if transcript:
                for line in _emit_exit_sse(emit, transcript, reason=reason):
                    yield line
            else:
                yield emit(
                    {
                        "type": "text",
                        "id": f"no-handoff-{uuid.uuid4().hex[:6]}",
                        "text": "当前没有进行中的子 Agent 托管，我仍在主助手模式。",
                        "speaker": "supervisor",
                    },
                )
            yield emit({"type": "done"})
            return

        if active:
            if (req.message or "").strip():
                specialist_append_message(session_id, "user", req.message)
            async for chunk in _iter_specialist_stream(
                session_id=session_id,
                model_name=req.model,
                user_msg=user_msg,
                active=active,
                emit=emit,
            ):
                yield chunk
            yield emit({"type": "done"})
            return

        pending_handoff: dict[str, Any] = {}

        def emit_watch(payload: dict[str, Any]) -> str:
            if (
                payload.get("type") == "tool_result"
                and payload.get("name") == "delegate_metrics_agent"
            ):
                parsed = _parse_handoff_tool_output(str(payload.get("output") or ""))
                if parsed:
                    pending_handoff.clear()
                    pending_handoff.update(parsed)
            if payload.get("type") in ("text", "text_start", "text_end") and not payload.get(
                "speaker",
            ):
                payload = _tag_payload(payload, speaker="supervisor")
            ptype = payload.get("type")
            pname = payload.get("name") or ""
            speaker = payload.get("speaker") or "supervisor"
            # 无感转交：路由工具与转交话不进对话，身份只走外围框
            if pname == "delegate_metrics_agent" and ptype in (
                "tool_call",
                "tool_result",
                "tool_progress",
            ):
                return ""
            if pending_handoff and speaker == "supervisor" and ptype in (
                "text",
                "text_start",
                "text_end",
                "thinking_start",
                "thinking_delta",
                "thinking_end",
            ):
                return ""
            return emit(payload)

        async for chunk in _stream_agent_with_heartbeat(
            agent,
            user_msg,
            state,
            emit_watch,
        ):
            yield chunk

        if pending_handoff:
            seed = (req.message or "").strip()
            entered = specialist_enter_session(
                session_id,
                specialist_id=str(pending_handoff.get("specialistId") or "metrics"),
                task_label=str(pending_handoff.get("taskLabel") or "增长诊断"),
                instruction=str(pending_handoff.get("instruction") or ""),
                seed_user_text=seed,
            )
            yield emit(
                {
                    "type": "specialist_enter",
                    "handoff_id": entered["handoff_id"],
                    "specialist": {
                        "id": entered["specialist_id"],
                        "name": entered["specialist_name"],
                    },
                    "task_label": entered["task_label"],
                },
            )
            # 推荐：进态后首句用户原话自动转发给子 Agent
            async for chunk in _iter_specialist_stream(
                session_id=session_id,
                model_name=req.model,
                user_msg=user_msg,
                active=entered,
                emit=emit,
            ):
                yield chunk

        if brief_gate_enabled():
            client_brief = export_brief_for_client()
            if client_brief and client_brief.get("briefId"):
                yield emit({
                    "type": "generation_brief",
                    "brief": _slim_brief_for_sse(client_brief),
                })

        yield emit({"type": "done"})
    except ValueError as exc:
        yield emit({"type": "error", "message": str(exc)})
        yield emit({"type": "done"})
    except Exception as exc:  # noqa: BLE001
        yield emit({"type": "error", "message": f"{type(exc).__name__}: {exc}"})
        yield emit({"type": "done"})
    finally:
        reset_session_images()
        reset_turn_guard()
        if _pending_msg is not None:
            try:
                _pending_msg.reset_pending_turn()
            except Exception:  # noqa: BLE001
                pass
        try:
            _config_module().reset_request_model()
        except Exception:  # noqa: BLE001
            pass
        try:
            log_path = recorder.save()
            if log_path:
                print(f"[session-log] {recorder.turn_id} -> {log_path}")
        except Exception as exc:  # noqa: BLE001
            print(f"[session-log] write failed: {exc}")
        try:
            flush_langfuse_otel()
        except Exception as exc:  # noqa: BLE001
            print(f"[langfuse] flush failed: {exc}")


@app.get("/health")
async def health():
    from b2b_portal_agent.config import (
        get_model_name,
        get_model_options,
        get_thinking_enable,
        get_vision_model_name,
        get_vision_timeout_sec,
    )
    from session_log import DEFAULT_LOG_DIR, _enabled

    has_key = bool(os.environ.get("OPENAI_API_KEY") or os.environ.get("VVEAI_API_KEY"))
    return {
        "status": "ok" if has_key else "missing_api_key",
        "agent": AGENT_NAME,
        "agent_module": _AGENT_MODULE,
        "outputs_root": str(OUTPUTS_ROOT),
        "agents_workspace": str(AGENTS_WORKSPACE),
        "has_api_key": has_key,
        "model": get_model_name(),
        "model_options": get_model_options(),
        "thinking_enable": get_thinking_enable(),
        "vision_model": get_vision_model_name(),
        "vision_timeout_sec": get_vision_timeout_sec(),
        "image_analysis_timeout_sec": IMAGE_ANALYSIS_TIMEOUT_SEC,
        "brief_gate_enabled": brief_gate_enabled(),
        "session_log": {
            "enabled": _enabled(),
            "dir": str(DEFAULT_LOG_DIR),
        },
        "langfuse": get_langfuse_status(),
    }


@app.post("/api/chat")
async def chat(req: ChatRequest):
    return StreamingResponse(
        stream_agent_events(req),
        media_type="text/event-stream; charset=utf-8",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    )


if __name__ == "__main__":
    import uvicorn

    print(f"Agent bridge: {AGENT_NAME} ({_AGENT_MODULE})")
    print(f"PYTHONPATH roots: {OUTPUTS_ROOT}, {AGENTS_WORKSPACE}")
    print(f"Listening on http://0.0.0.0:{BRIDGE_PORT}")
    uvicorn.run(app, host="0.0.0.0", port=BRIDGE_PORT, log_level="info")
