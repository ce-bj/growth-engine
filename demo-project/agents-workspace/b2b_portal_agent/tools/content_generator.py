# -*- coding: utf-8 -*-
"""按行业规范模块清单生成 layerA/layerB 可发布详情页文案。"""
from __future__ import annotations

import json
import logging
import re
import asyncio
import time
import uuid
from typing import Any

from .content_llm import generate_product_draft_with_llm
from .page_draft import build_page_draft, resolve_page_template_id, slots_to_llm_draft
from .brief_session import get_generation_brief
from .build_generation_brief import get_selected_topic_labels
from .tool_guard import check_generate_allowed

logger = logging.getLogger(__name__)


def _parse_json_maybe(value: str | dict[str, Any]) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    # 递归解包：LLM 可能双重/多重 JSON 编码（str → str → dict）
    for _ in range(4):
        if not isinstance(value, str):
            break
        try:
            parsed = json.loads(value)
        except (json.JSONDecodeError, TypeError, ValueError):
            break
        if isinstance(parsed, dict):
            return parsed
        value = parsed  # 可能解出 str，继续循环
    return {}


def _extract_content_modules(page_spec: str | dict[str, Any]) -> list[dict[str, Any]]:
    data = _parse_json_maybe(page_spec)
    modules = data.get("generatableModules") or data.get("contentModules")
    if isinstance(modules, list) and modules:
        return _enrich_modules_from_catalog(modules)

    nested = data.get("page_spec", {})
    if isinstance(nested, dict):
        modules = (
            nested.get("generatableModules")
            or nested.get("contentModules")
            or nested.get("required_modules")
        )
        if isinstance(modules, list):
            return _enrich_modules_from_catalog(modules)

    module_ids = data.get("contentModuleIds")
    if isinstance(module_ids, list) and module_ids:
        return _enrich_modules_from_catalog([{"id": mid} for mid in module_ids])

    return []


def _enrich_modules_from_catalog(modules: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Agent 常截断 page_spec 导致缺 fieldTarget；从全库 module-catalog 补全。"""
    from ..knowledge.lookup import get_module_catalog

    catalog = {
        int(row["id"]): row
        for row in get_module_catalog().get("modules", [])
        if row.get("id") is not None
    }
    enriched: list[dict[str, Any]] = []
    for mod in modules:
        if not isinstance(mod, dict):
            continue
        mid = mod.get("id")
        base = dict(catalog.get(int(mid), {})) if mid is not None else {}
        merged = {**base, **mod}
        if merged.get("fieldTarget"):
            enriched.append(merged)
    return enriched


def _apply_vision_overrides(
    spec_data: dict[str, Any],
    analysis: dict[str, Any],
    user_message: str,
) -> dict[str, Any]:
    """识图/用户语义优先于 fuzzy 误命中（如人形机器人误匹配扫地机）。"""
    spec = dict(spec_data)
    blob = " ".join(
        [
            str(analysis.get("industryName", "")),
            str(analysis.get("productCategory", "")),
            str(analysis.get("industry", "")),
            user_message,
        ],
    ).lower()
    humanoid = any(
        k in blob
        for k in ("人形", "unitree", "宇树", "双足", "humanoid", "g1", "h1")
    )
    if humanoid:
        spec["industryName"] = analysis.get("industryName") or "工业机器人"
        spec["productCategory"] = analysis.get("productCategory") or "人形机器人"
        spec["pageTemplateId"] = "industrial-robot-v1"
    elif analysis.get("industryName"):
        spec.setdefault("industryName", analysis.get("industryName"))
    if analysis.get("productCategory"):
        spec.setdefault("productCategory", analysis.get("productCategory"))
    return spec


def _analysis_context(image_analysis: str | dict[str, Any]) -> dict[str, Any]:
    data = _parse_json_maybe(image_analysis)
    analysis = data.get("analysis", data)
    if not isinstance(analysis, dict):
        return {}
    return analysis


def _stub_for_shape(
    module: dict[str, Any],
    *,
    analysis: dict[str, Any],
    user_message: str,
    image_urls: list[str],
) -> Any:
    """LLM 失败时的降级占位。"""
    shape = module.get("outputShape", "text")
    name = module.get("name", "模块")
    industry = analysis.get("industryName") or analysis.get("industry", "该产品")
    category = analysis.get("productCategory") or analysis.get("product_category", "")
    field_target = str(module.get("fieldTarget", ""))

    if shape == "title" or field_target == "layerA.title":
        return f"{category or industry}产品（待填入品牌与型号）"

    if shape == "overview" or field_target == "layerA.overview":
        return (
            f"{industry}{category}产品概述待生成。"
            f"（依据：{user_message[:60]}）"
        )

    if shape == "image_meta" or field_target == "layerA.media":
        items = [
            {"imageRef": str(i), "alt": f"{category or industry}产品图{i + 1}（待补充）"}
            for i in range(max(len(image_urls), 1))
        ]
        return json.dumps(
            {"caption": "产品图册（待补充说明）", "items": items[: len(image_urls) or 1]},
            ensure_ascii=False,
        )

    if shape == "html_richtext" or field_target == "layerB.body":
        return (
            '<section><p style="color:#64748b;">产品详情正在生成中，请稍候…</p>'
            f"<p>行业：{industry} / {category}</p></section>"
        )

    return f"【{name}】待补充"


LAYER_B_PLACEHOLDER_MARKERS = ("产品详情正在生成中", "请稍候")


def _is_valid_layer_b_html(html: str) -> bool:
    """B 层正式 HTML：含 h2 且非占位文案。"""
    text = str(html or "").strip()
    if not text or "<h2" not in text.lower():
        return False
    return not any(marker in text for marker in LAYER_B_PLACEHOLDER_MARKERS)


def _assemble_from_llm(
    draft: dict[str, Any],
    modules: list[dict[str, Any]],
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    layer_a: dict[str, Any] = {}
    layer_b: dict[str, Any] = {}
    module_outputs: dict[str, Any] = {}

    for field in draft.get("independentFields") or []:
        if not isinstance(field, dict):
            continue
        name = field.get("moduleName", "独立字段")
        module_outputs[name] = {"fieldGroup": "layerA", **field}
        target = field.get("fieldTarget", "")
        content = field.get("content", "")
        if target == "layerA.title":
            layer_a["title"] = content
        elif target == "layerA.overview":
            layer_a["overview"] = content
        elif target == "layerA.media":
            layer_a["media"] = content

    html_body = draft.get("htmlBody") or {}
    if html_body.get("html"):
        layer_b["body"] = html_body
        module_outputs["产品详情"] = {"fieldGroup": "layerB", "fieldTarget": "layerB.body", **html_body}

    return layer_a, layer_b, module_outputs


def _coverage_stats_v2(
    draft: dict[str, Any],
    modules: list[dict[str, Any]],
) -> dict[str, Any]:
    missing: list[str] = []
    filled = 0
    layer_a_ok = True
    b_html = str((draft.get("htmlBody") or {}).get("html") or "").strip()

    for mod in modules:
        target = str(mod.get("fieldTarget", ""))
        name = str(mod.get("name", target))
        if target.startswith("layerA."):
            hit = any(
                str(f.get("fieldTarget")) == target and str(f.get("content", "")).strip()
                for f in (draft.get("independentFields") or [])
                if isinstance(f, dict)
            )
            if hit:
                filled += 1
            else:
                missing.append(name)
                layer_a_ok = False
        elif target == "layerB.body":
            if _is_valid_layer_b_html(b_html):
                filled += 1
            else:
                missing.append(name)

    total = len(modules) or 4
    b_ready = _is_valid_layer_b_html(b_html)
    return {
        "generatableTotal": total,
        "generatableFilled": filled,
        "layerAComplete": layer_a_ok,
        "layerBHtmlPresent": b_ready,
        "missing": missing,
        "required": {"filled": filled, "total": total, "ratio": f"{filled}/{total}"},
    }


def format_display_preview(result: dict[str, Any]) -> str:
    """生成运营摘要（v2：A 三字段 + B HTML 摘要）。"""
    industry = result.get("industryName", "产品")
    lines = [f"已为您生成**{industry}**详情页草稿（v2），请确认：", ""]

    for field in result.get("independentFields") or []:
        label = field.get("fieldLabel") or field.get("moduleName", "字段")
        lines.append(f"**{label}**")
        lines.append(str(field.get("content", "")).strip()[:300])
        lines.append("")

    html = str((result.get("htmlBody") or {}).get("html") or "")
    if html:
        lines.append("**产品详情（HTML）**")
        lines.append(html[:400] + ("…" if len(html) > 400 else ""))
        lines.append("")

    cov = result.get("coverage") or {}
    lines.append("---")
    lines.append(
        f"可生成项覆盖：**{cov.get('generatableFilled', '—')}/{cov.get('generatableTotal', 4)}**。"
        "完整内容已同步右侧预览，请核对后提出修改意见。",
    )
    return "\n".join(lines).strip()


def _fallback_draft(
    modules: list[dict[str, Any]],
    *,
    analysis: dict[str, Any],
    user_message: str,
    image_urls: list[str],
) -> dict[str, Any]:
    independent: list[dict[str, Any]] = []
    html_placeholder = ""

    label_map = {
        "layerA.title": "产品名称",
        "layerA.overview": "产品概述",
        "layerA.media": "产品图片说明",
    }

    for module in modules:
        field_target = str(module.get("fieldTarget", ""))
        content = _stub_for_shape(
            module,
            analysis=analysis,
            user_message=user_message,
            image_urls=image_urls,
        )
        if field_target.startswith("layerA."):
            independent.append(
                {
                    "moduleId": module.get("id"),
                    "moduleName": module.get("name"),
                    "fieldLabel": label_map.get(field_target, module.get("name")),
                    "fieldTarget": field_target,
                    "content": (
                        json.dumps(content, ensure_ascii=False)
                        if isinstance(content, dict)
                        else str(content)
                    ),
                },
            )
        elif field_target == "layerB.body":
            html_placeholder = str(content)

    return {
        "independentFields": independent,
        "htmlBody": {"html": html_placeholder, "outline": []},
        "richTextSections": [],
    }


def _build_result_payload(
    *,
    spec_data: dict[str, Any],
    modules: list[dict[str, Any]],
    analysis: dict[str, Any],
    user_message: str,
    draft: dict[str, Any],
    generation_mode: str,
    generation_error: str = "",
    generation_phase: str = "final",
    draft_id: str | None = None,
) -> dict[str, Any]:
    layer_a, layer_b, module_outputs = _assemble_from_llm(draft, modules)
    coverage = _coverage_stats_v2(draft, modules)
    result = {
        "draftTitle": (
            f"{spec_data.get('industryName', analysis.get('industryName', '产品'))}"
            f"详情页草稿"
        ),
        "generationMode": generation_mode,
        "generationPhase": generation_phase,
        "generationError": generation_error or None,
        "match": spec_data.get("match"),
        "industryName": spec_data.get("industryName", analysis.get("industryName")),
        "productCategory": spec_data.get("productCategory", analysis.get("productCategory")),
        "industryType": spec_data.get("industryType", analysis.get("industryType")),
        "independentFields": draft.get("independentFields", []),
        "htmlBody": draft.get("htmlBody", {}),
        "richTextSections": draft.get("richTextSections", []),
        "layerA": layer_a,
        "layerB": layer_b,
        "modules": module_outputs,
        "coverage": coverage,
        "doNotGenerate": spec_data.get("doNotGenerate", []),
        "complianceHint": (
            "文案由 LLM 按 v2 规范生成（A 三字段 + B HTML）；资质、标准号须人工核对。"
            if generation_mode == "llm"
            else (
                "已基于当前草稿局部修订，未改动部分保持原样。"
                if generation_mode == "patch"
                else (
                    "已基于当前草稿按意见修订；未提及的 A 层字段已保留。"
                    if generation_mode == "revise"
                    else (
                        f"LLM 生成失败（{generation_error[:200]}），已降级为占位草稿，请重试。"
                        if generation_error
                        else "占位草稿已就绪，AI 正在生成正式文案。"
                    )
                )
            )
        ),
        "userMessageRef": user_message[:300],
    }
    result["displayPreview"] = format_display_preview(result)
    result["pageTemplateId"] = resolve_page_template_id(spec_data)
    result["draftId"] = draft_id
    result["pageDraft"] = build_page_draft(result, spec_data, draft_id=draft_id)
    return result


async def generate_structured_content_stream(
    page_spec: str | dict[str, Any],
    image_analysis: str | dict[str, Any],
    user_message: str,
    mode: str = "create",
    current_draft: str | dict[str, Any] | None = None,
    selected_topics: list[str] | None = None,
):
    """两阶段生成或 revise 修订；yield 进度 / page_draft / 最终结果。"""
    gen_mode = (mode or "create").strip().lower()
    existing_page: dict[str, Any] | None = None
    if current_draft:
        existing_page = (
            current_draft
            if isinstance(current_draft, dict)
            else _parse_json_maybe(current_draft)
        )
        # 防御：LLM 可能传入完整工具结果（含 pageDraft 嵌套）
        if not existing_page.get("slots") and isinstance(existing_page.get("pageDraft"), dict):
            existing_page = existing_page["pageDraft"]
        if isinstance(existing_page.get("slots"), str):
            existing_page["slots"] = _parse_json_maybe(existing_page["slots"])
        if not existing_page.get("slots"):
            existing_page = None
    guard_err = check_generate_allowed(gen_mode, has_page_draft=bool(existing_page))
    if guard_err:
        yield {
            "type": "complete",
            "result": {
                "generationMode": "revise_failed" if gen_mode == "revise" else "fallback",
                "generationError": guard_err,
                "complianceHint": guard_err,
            },
        }
        return
    analysis = _analysis_context(image_analysis)
    spec_data = _apply_vision_overrides(
        _parse_json_maybe(page_spec),
        analysis,
        user_message,
    )
    brief = get_generation_brief()
    topic_labels = selected_topics or get_selected_topic_labels(brief)
    if topic_labels:
        hints = dict(spec_data.get("industryHints") or {})
        hints["selectedTopics"] = topic_labels
        spec_data = {**spec_data, "industryHints": hints}
        user_message = (
            f"{user_message}\n\n【用户确认的详情章节】{', '.join(topic_labels)}"
        ).strip()
    modules = _extract_content_modules(spec_data)
    if modules:
        spec_data = {**spec_data, "generatableModules": modules, "contentModules": modules}
    image_urls: list[str] = []
    raw_urls = _parse_json_maybe(image_analysis).get("image_urls")
    if isinstance(raw_urls, list):
        image_urls = [str(u) for u in raw_urls]

    run_draft_id = (
        str(existing_page.get("draftId"))
        if existing_page and existing_page.get("draftId")
        else f"draft-{int(time.time() * 1000)}-{uuid.uuid4().hex[:8]}"
    )
    total_modules = len(modules)

    if gen_mode == "revise" and existing_page:
        draft = slots_to_llm_draft(existing_page)
        yield {
            "type": "progress",
            "phase": "revise",
            "completed": 0,
            "total": total_modules,
            "message": "正在基于当前草稿修订…",
        }
        revise_seed = _build_result_payload(
            spec_data=spec_data,
            modules=modules,
            analysis=analysis,
            user_message=user_message,
            draft=draft,
            generation_mode="revise_partial",
            generation_phase="streaming",
            draft_id=run_draft_id,
        )
        yield {
            "type": "page_draft",
            "draft": revise_seed["pageDraft"],
            "draftState": "streaming",
            "message": "已加载当前草稿，正在按修改意见更新…",
        }
    else:
        placeholder = _fallback_draft(
            modules,
            analysis=analysis,
            user_message=user_message,
            image_urls=image_urls,
        )
        yield {
            "type": "progress",
            "phase": "placeholder",
            "completed": 0,
            "total": total_modules,
            "message": "正在生成占位草稿，先打开右侧预览…",
        }
        placeholder_result = _build_result_payload(
            spec_data=spec_data,
            modules=modules,
            analysis=analysis,
            user_message=user_message,
            draft=placeholder,
            generation_mode="placeholder",
            generation_phase="placeholder",
            draft_id=run_draft_id,
        )
        yield {
            "type": "page_draft",
            "draft": placeholder_result["pageDraft"],
            "draftState": "placeholder",
            "message": "占位草稿已就绪，AI 正在逐块生成正式文案…",
        }
        draft = {
            "independentFields": list(placeholder.get("independentFields") or []),
            "htmlBody": dict(placeholder.get("htmlBody") or {}),
            "richTextSections": [],
        }

    generation_mode = "revise" if gen_mode == "revise" and existing_page else "llm"
    generation_error = ""

    progress_queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()

    def _on_llm_progress(event: dict[str, Any]) -> None:
        progress_queue.put_nowait(event)

    llm_task = asyncio.create_task(
        generate_product_draft_with_llm(
            spec=spec_data,
            modules=modules,
            analysis=analysis,
            user_message=user_message,
            image_urls=image_urls,
            on_progress=_on_llm_progress,
            mode=gen_mode if existing_page else "create",
            existing_draft=draft if gen_mode == "revise" and existing_page else None,
        ),
    )

    def _merge_partial(partial: dict[str, Any]) -> None:
        if partial.get("independentFields"):
            by_id = {
                int(f.get("moduleId", -1)): f
                for f in draft.get("independentFields", [])
                if isinstance(f, dict)
            }
            for field in partial["independentFields"]:
                if isinstance(field, dict) and field.get("moduleId") is not None:
                    by_id[int(field["moduleId"])] = field
            draft["independentFields"] = list(by_id.values())
        if partial.get("htmlBody"):
            draft["htmlBody"] = {**draft.get("htmlBody", {}), **partial["htmlBody"]}
        if partial.get("richTextSections"):
            draft["richTextSections"] = partial["richTextSections"]

    while not llm_task.done() or not progress_queue.empty():
        try:
            event = await asyncio.wait_for(progress_queue.get(), timeout=0.25)
        except asyncio.TimeoutError:
            continue
        partial = event.pop("partialDraft", None)
        if isinstance(partial, dict):
            _merge_partial(partial)
            partial_result = _build_result_payload(
                spec_data=spec_data,
                modules=modules,
                analysis=analysis,
                user_message=user_message,
                draft=draft,
                generation_mode="llm_partial",
                generation_phase="streaming",
                draft_id=run_draft_id,
            )
            yield {
                "type": "page_draft",
                "draft": partial_result["pageDraft"],
                "draftState": "streaming",
                "message": event.get("message", "正在更新预览…"),
            }
        yield event

    try:
        llm_draft = await llm_task
        draft = llm_draft
        if gen_mode == "revise" and existing_page:
            generation_mode = "revise"
        else:
            generation_mode = "llm"
    except Exception as exc:
        generation_error = f"{type(exc).__name__}: {exc}"
        logger.warning("LLM content generation failed, keeping placeholder: %s", exc)
        generation_mode = "fallback"

    while not progress_queue.empty():
        yield progress_queue.get_nowait()

    final_result = _build_result_payload(
        spec_data=spec_data,
        modules=modules,
        analysis=analysis,
        user_message=user_message,
        draft=draft,
        generation_mode=generation_mode,
        generation_error=generation_error,
        generation_phase="final",
        draft_id=run_draft_id,
    )
    final_message = (
        "详情页已按意见修订"
        if generation_mode == "revise"
        else (
            "详情页正式文案已生成"
            if generation_mode == "llm"
            else (
                "内容生成未完成，当前为占位草稿，请重试"
                if generation_mode == "fallback"
                else "详情页草稿已更新"
            )
        )
    )
    yield {
        "type": "page_draft",
        "draft": final_result["pageDraft"],
        "draftState": "final" if generation_mode == "llm" else generation_mode,
        "message": final_message,
    }
    yield {"type": "complete", "result": final_result}


async def generate_structured_content_async(
    page_spec: str | dict[str, Any],
    image_analysis: str | dict[str, Any],
    user_message: str,
) -> dict[str, Any]:
    """按 contentModules 调用 LLM 生成可发布文案（消费流式生成器）。"""
    result: dict[str, Any] | None = None
    async for event in generate_structured_content_stream(
        page_spec,
        image_analysis,
        user_message,
    ):
        if event.get("type") == "complete":
            result = event.get("result")
    if result is None:
        raise RuntimeError("内容生成未返回 complete 事件")
    return result


def generate_structured_content(
    page_spec: str | dict[str, Any],
    image_analysis: str | dict[str, Any],
    user_message: str,
) -> dict[str, Any]:
    """同步包装（供非 async 场景）；优先在 async 工具路径中调用 async 版本。"""
    import asyncio

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        raise RuntimeError("请使用 generate_structured_content_async")

    return asyncio.run(
        generate_structured_content_async(page_spec, image_analysis, user_message),
    )
