# -*- coding: utf-8 -*-
"""调用 LLM 生成 v2 产品详情：A 三字段 + B 单块 HTML。"""
from __future__ import annotations

import json
import logging
import re
from collections.abc import Callable
from typing import Any

from json_repair import repair_json
from agentscope.credential import DeepSeekCredential, OpenAICredential
from agentscope.message import Msg, TextBlock
from agentscope.model import DeepSeekChatModel, OpenAIChatModel

from .content_stream import dedupe_items_by_module_id, extract_items_from_partial_json

from ..config import (
    ensure_api_bypass_proxy,
    get_api_key,
    get_base_url,
    get_content_gen_model_name,
    is_deepseek_model,
)

logger = logging.getLogger(__name__)

FIELD_LABELS = {
    "layerA.title": "产品名称",
    "layerA.overview": "产品概述",
    "layerA.media": "产品图片说明",
    "layerB.body": "产品详情",
}

# B 层 HTML 须复用前端预览模板 industrial-robot-v1 的 ir-* 组件 class（见 demo-project CSS）
_LAYER_B_TEMPLATE_UI_RULES = """
## 页面模板 UI 规范（硬性 — 与右侧预览 industrial-robot-v1 对齐）

预览页 **已自带**「产品详情」总标题与外壳，B 层只输出**内层子章节**。

### 结构约定
- 根节点用 `<div>` 包裹多个 `<section class="ir-section">`（每个子章节一块）
- **禁止**再写「产品详情」总标题或重复 h1
- 每个子章节须含 `ir-section-head`：`ir-section-eyebrow`（英文短标签，如 SPECIFICATIONS / ADVANTAGES）+ `h2.ir-section-title`（中文章节名）
- `outline` 的 heading 必须与各 `h2.ir-section-title` 文案一致（level=2）；有 h3 子节可追加 level=3

### 组件 class 白名单（优先使用，少写内联 style）
| 场景 | 结构 |
|------|------|
| 参数/规格表 | `div.ir-spec-wrap` > `table.ir-spec-table`（须 thead + tbody） |
| 优势/特点（2～6 点） | `div.ir-feature-grid` > `div.ir-feature-card`（`data-index="01"`…）> `h4` + `p` |
| 应用场景（2～4 项） | `div.ir-scenario-grid` > `div.ir-scenario-card` > `h4` + `p`；可加 `span.ir-scenario-icon` |
| 认证/资质 | `div.ir-cert-row` > `div.ir-cert` > `span.ir-cert-icon`（✓ 等）+ 文案 |
| FAQ | `div.ir-faq` > `div.ir-faq-item` > `div.ir-faq-q` + `p.ir-faq-a` |
| 长文/工艺说明 | `div.ir-prose` > `p` / `ul` |

### 章节编排（对齐 industryHints.suggestedTopics）
- **必须**为 `industryHints.suggestedTopics`（或 `selectedTopics`）中的**每一条**各建一个 `ir-section` 子章节，不得整批省略
- 若用户消息含「【用户确认的详情章节】」，以该列表为准；否则以 `suggestedTopics` 全表为准
- 有识图/用户文字/知识库依据的：写**实质内容**（参数表、卡片、场景块等）
- 暂无依据的：**仍须建节**，先写 1～3 句该话题下行业常见应呈现的结构或占位说明，段末/表末/列表末标注「（待补充）」
- 禁止编造认证号、标准号、检测数据、销量；无依据处只用「（待补充）」，不要虚构数据
- 参数类用表格组件；卖点类用 feature-card；场景类用 scenario-card；FAQ/安装指南等用对应组件或 `ir-prose`
- 图片：`img` 的 src 仅用 `imageRef(0)` 形式，须写 alt

### 样式与安全
- **配色与版式由 class 承担**，禁止内联 `color` / `background-color`（勿写 style 设色）
- 允许 `style` 仅用于场景卡渐变变量：`style="--grad-a:#1a3a5c;--grad-b:#0a1628"`
- 禁止 script、iframe、on* 事件、外链图片

### 结构示例（仅示意，内容须按产品替换）
```html
<div>
  <section class="ir-section">
    <div class="ir-section-head">
      <div class="ir-section-eyebrow">SPECIFICATIONS</div>
      <h2 class="ir-section-title">核心参数</h2>
    </div>
    <div class="ir-spec-wrap">
      <table class="ir-spec-table">
        <thead><tr><th>参数项</th><th>规格</th></tr></thead>
        <tbody><tr><td>材质</td><td>304 不锈钢</td></tr></tbody>
      </table>
    </div>
  </section>
  <section class="ir-section">
    <div class="ir-section-head">
      <div class="ir-section-eyebrow">ADVANTAGES</div>
      <h2 class="ir-section-title">核心优势</h2>
    </div>
    <div class="ir-feature-grid">
      <div class="ir-feature-card" data-index="01"><h4>精密加工</h4><p>…</p></div>
      <div class="ir-feature-card" data-index="02"><h4>长效耐用</h4><p>…</p></div>
    </div>
  </section>
</div>
```
"""


def _format_topics_coverage_block(hints: dict[str, Any]) -> str:
    """将 lookup 返回的建议话题格式化为 B 层逐节覆盖清单。"""
    selected = hints.get("selectedTopics") if isinstance(hints.get("selectedTopics"), list) else []
    suggested = hints.get("suggestedTopics") if isinstance(hints.get("suggestedTopics"), list) else []
    topics = [str(t).strip() for t in (selected or suggested) if str(t).strip()]
    if not topics:
        return (
            "## 行业建议话题\n"
            "（未返回 suggestedTopics；按识图与用户需求自行编排，至少 4 个 ir-section）"
        )
    lines = "\n".join(f"{i + 1}. {label}" for i, label in enumerate(topics))
    source = "用户确认章节" if selected else "industryHints.suggestedTopics"
    return f"""## 行业建议话题（{source}，共 {len(topics)} 条 — 须逐条建节）
{lines}

硬性要求：
- 上表每一条 → 恰好一个 `ir-section`，`h2.ir-section-title` 与话题名一致或同义精简
- `outline` 须覆盖上表全部标题（level=2）
- 有依据写实质内容；无依据写结构占位 + 末尾「（待补充）」
"""


# ── 黑白灰色调安全网：剥离 LLM 生成的非灰阶 inline color ──
_HEX_COLOR_RE = re.compile(
    r"color\s*:\s*(#[0-9a-fA-F]{3,8})\b", re.IGNORECASE,
)
_NAMED_COLOR_RE = re.compile(
    r"color\s*:\s*(blue|red|green|orange|purple|pink|yellow|cyan|magenta|"
    r"teal|navy|crimson|coral|gold|indigo|violet|lime|aqua|maroon|"
    r"royalblue|tomato|salmon|turquoise|steelblue|darkblue|darkgreen|"
    r"darkred|lightblue|lightgreen)\b",
    re.IGNORECASE,
)
_GRAY_HEX = {
    "000", "111", "222", "333", "444", "555", "666", "777", "888", "999",
    "aaa", "bbb", "ccc", "ddd", "eee", "fff",
}


def _is_gray_hex(hex_color: str) -> bool:
    """判断 hex 颜色是否为灰阶（R≈G≈B 或常见灰阶值）。"""
    h = hex_color.lstrip("#").lower()
    if len(h) in (3, 6):
        if len(h) == 3:
            h = h[0] * 2 + h[1] * 2 + h[2] * 2
        if h[:2] == h[2:4] == h[4:6]:
            return True  # R==G==B 即灰阶
        # 也允许常见的灰阶色如 #e2e8f0、#f8fafc 等（低饱和度浅色）
        r, g, b = int(h[:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        max_c, min_c = max(r, g, b), min(r, g, b)
        return (max_c - min_c) <= 30  # 饱和度 ≤ 30 视为灰阶
    return False


def _sanitize_inline_colors(html: str) -> str:
    """将 HTML 中的非灰阶 inline color 替换为安全灰色 #333333。"""
    def _replace_hex(m: re.Match) -> str:
        color = m.group(1)
        if _is_gray_hex(color):
            return m.group(0)
        return "color:#333333"

    result = _HEX_COLOR_RE.sub(_replace_hex, html)
    result = _NAMED_COLOR_RE.sub("color:#333333", result)
    return result


def build_content_model(*, stream: bool = False) -> OpenAIChatModel | DeepSeekChatModel:
    base_url = get_base_url()
    ensure_api_bypass_proxy(base_url)
    model_name = get_content_gen_model_name()
    client_kwargs = {"timeout": 180.0}

    if is_deepseek_model(model_name):
        return DeepSeekChatModel(
            credential=DeepSeekCredential(api_key=get_api_key(), base_url=base_url),
            model=model_name,
            stream=stream,
            parameters=DeepSeekChatModel.Parameters(thinking_enable=False, max_tokens=8192),
            client_kwargs=client_kwargs,
        )

    return OpenAIChatModel(
        credential=OpenAICredential(api_key=get_api_key(), base_url=base_url),
        model=model_name,
        stream=stream,
        parameters=OpenAIChatModel.Parameters(max_tokens=8192),
        client_kwargs=client_kwargs,
    )


def _context_block(
    *,
    spec: dict[str, Any],
    analysis: dict[str, Any],
    user_message: str,
    image_urls: list[str],
) -> str:
    hints = spec.get("industryHints") or {}
    return f"""## 行业与规范（v2）
- 行业：{spec.get("industryName", "")} / {spec.get("productCategory", "")}
- 行业大类：{spec.get("industryType", "")}
- 规范匹配：{spec.get("match", "")}

## 行业提示 industryHints
{json.dumps(hints, ensure_ascii=False, indent=2)}

## 识图与产品信息
{json.dumps(analysis, ensure_ascii=False, indent=2)}

## 用户图片（共 {len(image_urls)} 张，imageRef 用 0 起序号）
{json.dumps(image_urls, ensure_ascii=False)}

## 用户需求
{user_message}

## 写作要求
- 全程简体中文，B2B 专业风格，可直接发布
- 禁止编造无法确认的认证号、标准号、检测数据、销量
- B 层须为 industryHints.suggestedTopics **每一条**各建一节：有依据写实质内容，无依据写占位并标「（待补充）」
- B 层 HTML 须复用预览模板 ir-* 组件 class（生成 B 层时有完整 UI 规范）
"""


def _extract_json_object(text: str) -> dict[str, Any]:
    """解析 LLM 返回的 JSON；优先 repair，避免 agentscope ToolJSONDecodeError 误导。"""
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fence:
        cleaned = fence.group(1).strip()
    match = re.search(r"\{[\s\S]*\}", cleaned)
    raw = match.group(0) if match else cleaned
    last_err: Exception | None = None
    for candidate in (raw, repair_json(raw, stream_stable=True)):
        try:
            data = json.loads(candidate)
            if isinstance(data, dict):
                return data
            last_err = ValueError("LLM 返回的不是 JSON 对象")
        except (json.JSONDecodeError, TypeError) as exc:
            last_err = exc
    raise ValueError(f"LLM 返回 JSON 无法解析: {last_err}")


async def _complete_text(
    model: OpenAIChatModel | DeepSeekChatModel,
    prompt: str,
    *,
    on_token: Callable[[str, str], None] | None = None,
) -> str:
    messages = [Msg(name="user", role="user", content=[TextBlock(text=prompt)])]

    if not getattr(model, "stream", False):
        response = await model(messages)
        parts = [b.text for b in response.content if isinstance(b, TextBlock) and b.text]
        text = "".join(parts)
        if on_token and text:
            on_token(text, text)
        return text

    accumulated = ""
    stream_result = await model(messages)
    async for chunk in stream_result:
        for block in chunk.content:
            if isinstance(block, TextBlock) and block.text:
                accumulated += block.text
                if on_token:
                    on_token(accumulated, block.text)
    return accumulated


def _map_layer_a_items(
    items: list[dict[str, Any]],
    modules: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    by_id = {int(m["id"]): m for m in modules if m.get("id") is not None}
    result: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        module_id = item.get("moduleId", item.get("id"))
        if module_id is None:
            continue
        mod = by_id.get(int(module_id))
        if not mod:
            continue
        field_target = str(mod.get("fieldTarget", ""))
        content = item.get("content", "")
        if isinstance(content, dict):
            content = json.dumps(content, ensure_ascii=False)
        result.append(
            {
                "moduleId": int(module_id),
                "moduleName": mod.get("name", ""),
                "fieldLabel": FIELD_LABELS.get(field_target, mod.get("name", "")),
                "fieldTarget": field_target,
                "content": str(content).strip(),
            },
        )
    if len(result) < len(modules):
        raise ValueError(f"A 层字段映射不完整 {len(result)}/{len(modules)} 条")
    return result


async def _generate_layer_a(
    model: OpenAIChatModel | DeepSeekChatModel,
    *,
    context: str,
    modules: list[dict[str, Any]],
    on_module: Callable[[dict[str, Any]], None] | None = None,
) -> list[dict[str, Any]]:
    prompt = f"""你是 B2B 门户产品文案专家。为以下 **A 层三个字段** 生成可发布文案。

{context}

## 本批模块（moduleId 不可改）
{json.dumps(modules, ensure_ascii=False, indent=2)}

## 输出格式（仅 JSON，不要 markdown 代码块）
{{
  "items": [
    {{"moduleId": 1, "content": "产品名称一行标题"}},
    {{"moduleId": 0, "content": "2-4 句产品概述…"}},
    {{
      "moduleId": 5,
      "content": {{
        "caption": "图册总说明",
        "items": [{{"imageRef": "0", "alt": "图片描述", "caption": "可选小标题"}}]
      }}
    }}
  ]
}}

规则：
- items 长度必须等于 3，每个 moduleId 恰好一次
- layerA.title：一行 SEO 标题
- layerA.overview：2-4 句摘要
- layerA.media：content 为对象（非字符串），仅为已上传图写 alt；imageRef 用 "0","1"…；无图时 items 为空并 caption 写待补充
"""
    seen: set[int] = set()

    def _token_cb(acc: str, _delta: str) -> None:
        if not on_module:
            return
        for item in dedupe_items_by_module_id(extract_items_from_partial_json(acc)):
            mid = int(item["moduleId"])
            if mid in seen:
                continue
            seen.add(mid)
            on_module(item)

    text = await _complete_text(model, prompt, on_token=_token_cb)
    items: list[dict[str, Any]] = []
    parse_err: Exception | None = None
    try:
        data = _extract_json_object(text)
        raw_items = data.get("items") or []
        if isinstance(raw_items, list):
            items = [i for i in raw_items if isinstance(i, dict)]
        else:
            parse_err = ValueError("A 层返回 items 不是数组")
    except ValueError as exc:
        parse_err = exc

    if len(items) < len(modules):
        recovered = dedupe_items_by_module_id(extract_items_from_partial_json(text))
        if len(recovered) > len(items):
            items = recovered

    if len(items) < len(modules):
        hint = f"{parse_err}" if parse_err else "流式 JSON 不完整"
        raise ValueError(
            f"A 层字段仅生成 {len(items)}/{len(modules)} 条（{hint}）",
        ) from parse_err
    return _map_layer_a_items(items, modules)


def _parse_html_response(text: str) -> dict[str, Any]:
    """解析 LLM 返回的 HTML JSON 或裸 HTML，并剥离非灰阶 inline color。"""
    cleaned = text.strip()
    if cleaned.startswith("{"):
        try:
            data = _extract_json_object(cleaned)
            html = str(data.get("html") or "").strip()
            outline = data.get("outline")
            if html:
                return {
                    "html": _sanitize_inline_colors(html),
                    "outline": outline if isinstance(outline, list) else [],
                }
        except ValueError:
            pass
    fence = re.search(r"```(?:html)?\s*([\s\S]*?)```", cleaned)
    if fence:
        cleaned = fence.group(1).strip()
    if cleaned.startswith("<"):
        return {"html": _sanitize_inline_colors(cleaned), "outline": []}
    return {"html": _sanitize_inline_colors(f"<section><p>{cleaned}</p></section>"), "outline": []}


async def _generate_layer_b_html(
    model: OpenAIChatModel | DeepSeekChatModel,
    *,
    context: str,
    b_module: dict[str, Any],
    industry_hints: dict[str, Any] | None = None,
    on_html_delta: Callable[[str], None] | None = None,
) -> dict[str, Any]:
    topics_block = _format_topics_coverage_block(industry_hints or {})
    prompt = f"""你是 B2B 门户产品详情页 HTML 专家。生成**一整段**可直接发布的产品详情 HTML。

{context}

{topics_block}

## B 层模块
{json.dumps(b_module, ensure_ascii=False, indent=2)}

## 输出格式（仅 JSON，不要 markdown 代码块）
{{
  "html": "<div>…完整 HTML…</div>",
  "outline": [{{"heading": "核心参数", "level": 2}}, {{"heading": "核心优势", "level": 2}}]
}}

{_LAYER_B_TEMPLATE_UI_RULES}

## 生成规则补充
- `ir-section` 数量须与上文「行业建议话题」条数一致（每条话题一节）
- 至少使用 2 种不同 ir-* 组件（如 spec-table + feature-grid + scenario-grid）
- outline 与每个 `h2.ir-section-title` 一一对应，且覆盖全部建议话题
"""
    accumulated = ""

    def _on_token(acc: str, _delta: str) -> None:
        nonlocal accumulated
        accumulated = acc
        if on_html_delta:
            on_html_delta(acc)

    text = await _complete_text(model, prompt, on_token=_on_token)
    return _parse_html_response(text)


async def _revise_layer_b_html(
    model: OpenAIChatModel | DeepSeekChatModel,
    *,
    existing_html: str,
    user_message: str,
    b_module: dict[str, Any],
    industry_hints: dict[str, Any] | None = None,
    on_html_delta: Callable[[str], None] | None = None,
) -> dict[str, Any]:
    topics_block = _format_topics_coverage_block(industry_hints or {})
    prompt = f"""你是 B2B 门户产品详情页 HTML **修订**专家。在**现有 HTML** 上按用户要求修改，禁止重写用户未提及的章节。

## 现有 HTML（须最大限度保留未改章节的原样结构与文案）
{existing_html[:12000]}

## 用户修改要求
{user_message}

{topics_block}

## B 层模块说明
{json.dumps(b_module, ensure_ascii=False, indent=2)}

## 输出格式（仅 JSON，不要 markdown 代码块）
{{
  "html": "<div>…修改后的**完整** HTML…</div>",
  "outline": [{{"heading": "章节标题", "level": 2}}]
}}

{_LAYER_B_TEMPLATE_UI_RULES}

## 修订规则（硬性）
- **仅**修改用户点名的章节/段落/组件；其余 `ir-section` 内容与顺序保持不变
- 若用户要求补全行业话题/规范章节：对照上文话题清单，**补建缺失的 ir-section**（有依据写实质，无依据占位 +「（待补充）」）
- 若用户要求「更好看/更有设计感」，在保留文案前提下将裸标签改为对应 ir-* 组件 class
- 禁止内联 color/background-color；禁止 script、iframe、on* 事件属性
- 输出必须是完整 HTML 片段，不是 diff
"""
    accumulated = ""

    def _on_token(acc: str, _delta: str) -> None:
        nonlocal accumulated
        accumulated = acc
        if on_html_delta:
            on_html_delta(acc)

    text = await _complete_text(model, prompt, on_token=_on_token)
    return _parse_html_response(text)


def _should_revise_layer_a(user_message: str) -> bool:
    keys = ("标题", "名称", "概述", "overview", "title", "图片说明", "图册", "alt", "layerA")
    blob = user_message.lower()
    return any(k in user_message or k in blob for k in keys)


async def generate_product_draft_with_llm(
    *,
    spec: dict[str, Any],
    modules: list[dict[str, Any]],
    analysis: dict[str, Any],
    user_message: str,
    image_urls: list[str],
    on_progress: Callable[[dict[str, Any]], None] | None = None,
    mode: str = "create",
    existing_draft: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """v2：A 层 JSON 一批 + B 层 HTML 流式；revise 模式基于 existing_draft 修订。"""
    model = build_content_model(stream=True)
    context = _context_block(
        spec=spec,
        analysis=analysis,
        user_message=user_message,
        image_urls=image_urls,
    )

    a_mods = [m for m in modules if str(m.get("fieldTarget", "")).startswith("layerA.")]
    b_mods = [m for m in modules if str(m.get("fieldTarget", "")) == "layerB.body"]
    is_revise = (mode or "create").lower() == "revise" and existing_draft
    revise_a = is_revise and _should_revise_layer_a(user_message)

    run_a = a_mods and (not is_revise or revise_a)
    run_b = bool(b_mods)
    total_steps = (1 if run_a else 0) + (1 if run_b else 0)
    completed = 0

    def _emit(phase: str, message: str, **extra: Any) -> None:
        if on_progress:
            on_progress(
                {
                    "type": "progress",
                    "phase": phase,
                    "completed": completed,
                    "total": total_steps,
                    "message": message,
                    **extra,
                },
            )

    if is_revise:
        _emit("llm_start", "基于当前草稿修订…")
        independent_fields = list(existing_draft.get("independentFields") or [])
        html_body = dict(existing_draft.get("htmlBody") or {"html": "", "outline": []})
    else:
        _emit("llm_start", f"开始 AI 生成（A {len(a_mods)} 项 + B HTML）…")
        independent_fields = []
        html_body = {"html": "", "outline": []}

    if run_a:
        _emit("layerA", "正在修订 A 层字段…")

        def _on_a_module(item: dict[str, Any]) -> None:
            if on_progress:
                on_progress(
                    {
                        "type": "module_stream",
                        "fieldGroup": "layerA",
                        "moduleId": item.get("moduleId"),
                        "preview": str(item.get("content", ""))[:120],
                    },
                )

        independent_fields = await _generate_layer_a(
            model,
            context=context,
            modules=a_mods,
            on_module=_on_a_module,
        )
        completed += 1
        if on_progress:
            on_progress(
                {
                    "type": "progress",
                    "phase": "layerA_done",
                    "completed": completed,
                    "total": total_steps,
                    "message": "A 层字段已完成",
                    "partialDraft": {"independentFields": independent_fields},
                },
            )

    if run_b:
        _emit("layerB_html", "正在修订产品详情 HTML…" if is_revise else "正在生成产品详情 HTML…")
        b_module = b_mods[0]

        def _on_html_delta(acc: str) -> None:
            if on_progress:
                on_progress(
                    {
                        "type": "module_stream",
                        "fieldGroup": "layerB",
                        "moduleId": b_module.get("id"),
                        "preview": acc[:120],
                    },
                )
                partial = _parse_html_response(acc) if acc.strip() else {"html": acc, "outline": []}
                on_progress(
                    {
                        "type": "progress",
                        "phase": "layerB_streaming",
                        "completed": completed,
                        "total": total_steps,
                        "message": "产品详情 HTML 流式更新中…",
                        "partialDraft": {"htmlBody": partial},
                    },
                )

        if is_revise and str(html_body.get("html") or "").strip():
            html_body = await _revise_layer_b_html(
                model,
                existing_html=str(html_body.get("html") or ""),
                user_message=user_message,
                b_module=b_module,
                industry_hints=spec.get("industryHints") if isinstance(spec.get("industryHints"), dict) else {},
                on_html_delta=_on_html_delta,
            )
        else:
            html_body = await _generate_layer_b_html(
                model,
                context=context,
                b_module=b_module,
                industry_hints=spec.get("industryHints") if isinstance(spec.get("industryHints"), dict) else {},
                on_html_delta=_on_html_delta,
            )
        completed += 1
        if on_progress:
            on_progress(
                {
                    "type": "progress",
                    "phase": "layerB_done",
                    "completed": completed,
                    "total": total_steps,
                    "message": "B 层 HTML 已完成",
                    "partialDraft": {"htmlBody": html_body},
                },
            )

    _emit("llm_done", "内容修订完成" if is_revise else "A+B 内容生成完成")

    return {
        "independentFields": independent_fields,
        "htmlBody": html_body,
        "richTextSections": [],
    }
