# -*- coding: utf-8 -*-
"""工具调用结果摘要 — 用于思考区展示与 tool_result.summary。"""
from __future__ import annotations

import json
import re
from typing import Any


def _parse_json_maybe(raw: str) -> dict[str, Any]:
    if not raw or not str(raw).strip():
        return {}
    text = str(raw).strip()
    try:
        data = json.loads(text)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def running_hint(tool_name: str, tool_input: str = "") -> str:
    payload = _parse_json_maybe(tool_input)
    if tool_name in ("Skill", "skill"):
        skill = payload.get("skill", "product-generate")
        return f"读取 `{skill}` 技能说明，确认工作流与工具调用顺序。"
    if tool_name == "analyze_product_images":
        urls = payload.get("image_urls") or []
        n = len(urls) if isinstance(urls, list) else 0
        suffix = "（含会话附件像素）" if n == 0 else ""
        return f"视觉分析 {n or '本轮上传'} 张图片，识别产品/规格/无关图角色{suffix}。"
    if tool_name in ("lookup_content_spec", "query_industry_page_spec"):
        industry = payload.get("industry", "")
        category = payload.get("product_category", "")
        return f"查询「{industry} / {category}」的行业 A+B 内容模块与合规 guidance。"
    if tool_name == "search_agent_industries":
        query = payload.get("query", "")
        return f"在行业库中搜索「{query}」，辅助确认品类归属。"
    if tool_name == "build_generation_brief":
        return "汇总识别结果、四维度澄清、可勾选章节与待补充清单。"
    if tool_name == "generate_product_content":
        return "生成 A 三字段（名称/概述/图片说明）+ B 单块 HTML 详情。"
    if tool_name == "patch_page_draft":
        return "按章节/槽位局部修订当前草稿（不重写整页）。"
    if tool_name == "restore_page_draft":
        return "从版本栈恢复上一版或指定版本草稿。"
    if tool_name == "list_available_agents":
        return "仅在用户明确问能力范围时列出子 Agent（闲聊勿用）。"
    if tool_name == "get_snapshot":
        return "读取本期扫描、定位、下钻和假设核对结果。"
    if tool_name == "get_metric_detail":
        return "按指标切片取数，回答追问。"
    if tool_name == "get_page_content":
        return "读取异常页正文，用来写任务说明。"
    if tool_name == "propose_hypothesis":
        return "提出候选假设，写入待运营确认列表。"
    if tool_name == "run_phase_a_golden_path_tool":
        return "一键跑留资率跌→落地页→任务说明金路径。"
    if tool_name == "delegate_product_detail_agent":
        return "将任务委托给「产品详情页 Agent」生成或修改详情草稿。"
    if tool_name == "delegate_metrics_agent":
        return "将任务委托给「业务指标归因 Agent」做增长诊断。"
    if tool_name == "analyze":
        return "调用数据分析包，取回固定口径结果卡。"
    if tool_name == "list_analysis_packs":
        return "列出已实现的分析包。"
    if tool_name == "lookup_cause_action_map":
        return "查询根因→任务说明映射。"
    if tool_name == "record_handoff_mock":
        return "记录定界交接 Mock 状态。"
    if tool_name == "delegate_marketing_page_agent":
        return "尝试委托智能营销页 Agent（Demo 占位）。"
    if tool_name == "delegate_site_content_agent":
        return "尝试委托站点内容 Agent（Demo 占位）。"
    title = tool_name or "工具"
    return f"执行 {title}…"


def summarize_tool_result(tool_name: str, output: str = "") -> str:
    if not output or not str(output).strip():
        return "工具已执行，未返回可读结果。"

    raw = str(output).strip()

    if tool_name in ("Skill", "skill"):
        lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
        title = lines[0].lstrip("# ").strip() if lines else "产品发布技能"
        return f"已加载技能「{title}」：识图 → 查规范 → 生成内容 → 预览确认（本期不含正式发布）。"

    if tool_name == "analyze_product_images":
        data = _parse_json_maybe(raw)
        analysis = data.get("analysis", data)
        industry = analysis.get("industryName") or analysis.get("industry", "—")
        category = analysis.get("productCategory") or analysis.get("product_category", "—")
        conf = analysis.get("confidence")
        mode = data.get("analysisMode", "")
        mode_txt = "视觉识图" if mode == "vision" else (
            "文字回退" if mode == "text_heuristic" else (
                "URL 回退" if mode == "url_heuristic" else ""
            )
        )
        conf_txt = f"，置信度 {conf:.0%}" if isinstance(conf, (int, float)) else ""
        roles = analysis.get("imageRoleSummary") or {}
        role_bits = []
        if roles.get("product_photo"):
            role_bits.append(f"产品图 {roles['product_photo']}")
        if roles.get("spec_sheet"):
            role_bits.append(f"规格图 {roles['spec_sheet']}")
        if roles.get("irrelevant"):
            role_bits.append(f"无关图 {roles['irrelevant']}")
        role_txt = f"（{ '、'.join(role_bits)}）" if role_bits else ""
        prefix = f"{mode_txt}：" if mode_txt else ""
        guidance = analysis.get("userGuidance", "")
        extra = f" {guidance[:80]}" if analysis.get("hasIrrelevantImages") and guidance else ""
        return f"{prefix}识图结论：行业 **{industry}**，品类 **{category}**{conf_txt}{role_txt}。{extra}".strip()

    if tool_name in ("lookup_content_spec", "query_industry_page_spec"):
        data = _parse_json_maybe(raw)
        match = data.get("match", "—")
        industry = data.get("industryName", "—")
        category = data.get("productCategory", "—")
        modules = data.get("generatableModules") or data.get("contentModules") or []
        topics = (data.get("industryHints") or {}).get("suggestedTopics") or []
        topic_txt = f"，建议话题 {len(topics)} 项" if topics else ""
        return (
            f"规范命中 **{match}**：{industry} / {category}；"
            f"v2 可生成项 {len(modules)} 个（A×3 + B HTML）{topic_txt}。"
        )

    if tool_name == "search_agent_industries":
        data = _parse_json_maybe(raw)
        count = data.get("count", len(data.get("industries") or []))
        query = data.get("query", "")
        if count == 0:
            return f"行业库搜索「{query}」无直接命中，将依赖文字描述或模糊匹配继续。"
        names = [
            str(i.get("industryName", ""))
            for i in (data.get("industries") or [])[:3]
            if i.get("industryName")
        ]
        hint = "、".join(names) if names else "—"
        return f"行业库找到 {count} 条候选（如 {hint}）。"

    if tool_name == "build_generation_brief":
        data = _parse_json_maybe(raw)
        status = data.get("status", "—")
        rec = data.get("recognition") or {}
        industry = rec.get("industryName", "—")
        category = rec.get("productCategory", "—")
        gaps = len(data.get("gaps") or [])
        topics = len(data.get("suggestedTopics") or [])
        status_txt = {
            "needs_clarification": "待澄清",
            "awaiting_confirm": "待确认",
            "confirmed": "已确认可生成",
        }.get(str(status), str(status))
        return (
            f"生成摘要 **{status_txt}**：{industry} / {category}；"
            f"推荐章节 {topics} 项，待补充 {gaps} 项。"
        )

    if tool_name == "generate_product_content":
        data = _parse_json_maybe(raw)
        mode = data.get("generationMode", "—")
        cov = data.get("coverage") or {}
        filled = cov.get("generatableFilled")
        total = cov.get("generatableTotal", 4)
        ratio = cov.get("required", {}).get("ratio") or (
            f"{filled}/{total}" if filled is not None else "—"
        )
        b_ok = "B HTML 已就绪" if cov.get("layerBHtmlPresent") else "B HTML 未完成"
        industry = data.get("industryName", "—")
        mode_txt = {
            "llm": "LLM 生成",
            "revise": "修订",
            "patch": "局部修订",
            "patch_partial": "部分修订",
            "fallback": "占位降级",
        }.get(str(mode), str(mode))
        err = data.get("generationError") or ""
        missing = cov.get("missing") or []
        extra = ""
        if mode == "fallback":
            extra = f" 原因：{(err or data.get('complianceHint', ''))[:120]}"
        elif missing:
            extra = f" 缺失：{', '.join(str(m) for m in missing[:3])}"
        return f"「{industry}」详情草稿（{mode_txt}），覆盖 {ratio}，{b_ok}。{extra}".strip()

    if tool_name == "patch_page_draft":
        data = _parse_json_maybe(raw)
        applied = data.get("patchApplied") or []
        errors = data.get("patchErrors") or []
        industry = data.get("industryName", "—")
        if applied:
            heads = [
                str(a.get("section_heading") or a.get("target") or "")
                for a in applied[:3]
            ]
            hint = "、".join(h for h in heads if h) or f"{len(applied)} 处"
            err = f" 警告：{'; '.join(errors[:2])}" if errors else ""
            return f"「{industry}」已局部修订：{hint}。{err}".strip()
        return f"局部修订失败：{'; '.join(str(e) for e in errors[:3]) or '未知原因'}"

    if tool_name == "restore_page_draft":
        data = _parse_json_maybe(raw)
        mode = data.get("generationMode", "")
        if mode == "restore":
            ver = data.get("restoredFromVersion")
            label = data.get("restoredLabel") or ""
            return f"已恢复至历史版本 v{ver}（{label}）。".strip()
        err = data.get("generationError") or "恢复失败"
        return f"版本恢复失败：{err}"

    if tool_name == "delegate_product_detail_agent":
        data = _parse_json_maybe(raw)
        if data.get("ok"):
            title = data.get("draftTitle") or "详情草稿"
            mode = data.get("generationMode") or "done"
            return f"产品详情页 Agent 已完成（{mode}）：{title}。"
        return data.get("message") or "产品详情页委托未完成。"

    if tool_name == "delegate_metrics_agent":
        data = _parse_json_maybe(raw)
        if data.get("handoff"):
            name = data.get("specialistName") or "业务指标归因 Agent"
            return f"已发起会话托管 →「{name}」（子 Agent 将直接与用户对话）。"
        if data.get("ok"):
            return "业务指标归因委托已完成。"
        return data.get("message") or "归因委托未完成。"

    if tool_name == "get_snapshot":
        data = _parse_json_maybe(raw)
        loc = (data.get("locate") or {}).get("loss_point") or "—"
        hyps = data.get("hypotheses") or []
        passed = [h.get("id") for h in hyps if h.get("result") == "pass"]
        tasks = data.get("tasks") or []
        return (
            f"诊断快照：落点 {loc}；"
            f"命中假设 {', '.join(passed) or '无'}；"
            f"任务 {len(tasks)} 条。"
        )

    if tool_name == "get_page_content":
        data = _parse_json_maybe(raw)
        if data.get("ok"):
            return f"已读取页面「{data.get('label') or data.get('page_path')}」。"
        return f"未读到页面：{data.get('reason') or data.get('page_path')}"

    if tool_name == "get_metric_detail":
        data = _parse_json_maybe(raw)
        ref = data.get("ref") or "指标"
        n = len(data.get("slices") or ([] if data.get("slice") is None else [data.get("slice")]))
        return f"已取 {ref} 的 {n} 个切片。"

    if tool_name == "propose_hypothesis":
        data = _parse_json_maybe(raw)
        name = (data.get("payload") or {}).get("name") or "候选假设"
        return f"已提交待确认：{name}"

    if tool_name == "run_phase_a_golden_path_tool":
        data = _parse_json_maybe(raw)
        rc = data.get("root_cause") or {}
        briefs = data.get("task_briefs") or []
        stage = (data.get("funnel_locate") or {}).get("stage") or "—"
        return (
            f"金路径完成：定段 {stage}；"
            f"根因 {rc.get('根因是') or '—'}（{rc.get('置信度') or '—'}）；"
            f"任务 {len(briefs)} 条。"
        )

    if tool_name == "analyze":
        data = _parse_json_maybe(raw)
        pack = data.get("pack_id") or "pack"
        headline = ((data.get("summary") or {}).get("headline")) or data.get("data_status")
        return f"分析包 {pack}：{headline}"

    if tool_name == "lookup_cause_action_map":
        data = _parse_json_maybe(raw)
        hits = data.get("hits") or []
        if hits:
            return f"命中 {len(hits)} 条根因→措施映射：{hits[0].get('cause_name')}"
        return "未命中标准映射，需标新原因待人审。"

    if tool_name == "record_handoff_mock":
        data = _parse_json_maybe(raw)
        rec = data.get("recorded") or {}
        return f"已记录交接状态：{rec.get('status')}（{rec.get('task_type')}）"

    if tool_name in (
        "delegate_marketing_page_agent",
        "delegate_site_content_agent",
    ):
        data = _parse_json_maybe(raw)
        return data.get("message") or f"{data.get('delegatedTo', tool_name)} 尚未接入。"

    if tool_name == "list_available_agents":
        data = _parse_json_maybe(raw)
        agents = data.get("agents") or []
        ready = sum(1 for a in agents if a.get("status") == "ready")
        return f"子 Agent 清单：已接入 {ready} 个，共 {len(agents)} 个（含占位）。"

    if tool_name == "list_analysis_packs":
        data = _parse_json_maybe(raw)
        packs = data.get("packs") or []
        return f"Phase A 分析包 {len(packs)} 个已就绪。"

    preview = re.sub(r"\s+", " ", raw)
    if len(preview) > 160:
        preview = preview[:160] + "…"
    return preview
