# -*- coding: utf-8 -*-
"""单轮 ReAct 工具调用护栏 — 防重复 patch / 回退时误用 revise。"""
from __future__ import annotations

import re
from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Any

_CONFIRM_GENERATE_RE = re.compile(
    r"【用户已确认产品信息·允许 generate】|【用户已确认生成摘要·允许 generate】|"
    r"confirm_generate|确认生成|先生成|开始生成|直接生成|开始吧|没问题|可以生成",
    re.IGNORECASE,
)

_ROLLBACK_RE = re.compile(
    r"回退|撤销|上一版|上个版本|前一版|恢复之前|还原|撤回|undo|revert|roll\s*back",
    re.IGNORECASE,
)


@dataclass
class TurnGuardState:
    user_message: str = ""
    rollback_intent: bool = False
    patch_keys: list[tuple[str, str]] = field(default_factory=list)
    revise_count: int = 0
    restore_count: int = 0


_turn_guard: ContextVar[TurnGuardState | None] = ContextVar("b2b_turn_guard", default=None)


def bind_turn_guard(user_message: str = "") -> None:
    msg = (user_message or "").strip()
    _turn_guard.set(
        TurnGuardState(
            user_message=msg,
            rollback_intent=bool(_ROLLBACK_RE.search(msg)),
        ),
    )


def reset_turn_guard() -> None:
    _turn_guard.set(None)


def _state() -> TurnGuardState | None:
    return _turn_guard.get()


def is_rollback_intent() -> bool:
    st = _state()
    return bool(st and st.rollback_intent)


def check_patch_allowed(edits: list[dict[str, Any]]) -> str | None:
    st = _state()
    if not st:
        return None
    if st.rollback_intent:
        return (
            "用户本轮要求回退/撤销上一版，禁止调用 patch_page_draft。"
            "请改用 restore_page_draft(version=-1)。"
        )
    for edit in edits:
        heading = str(
            edit.get("section_heading")
            or edit.get("sectionHeading")
            or edit.get("heading")
            or "",
        ).strip()
        action = str(edit.get("action") or "set").strip().lower()
        target = str(edit.get("target") or edit.get("fieldTarget") or "").strip()
        key = (heading or target or "(global)", action)
        if key in st.patch_keys:
            return (
                f"本轮已对「{key[0]}」执行过相同 patch（action={action}），"
                "请停止重复调用并向用户说明或改用 restore_page_draft。"
            )
        st.patch_keys.append(key)
    return None


def check_generate_allowed(mode: str, *, has_page_draft: bool = False) -> str | None:
    st = _state()
    mode = (mode or "create").strip().lower()

    if mode == "create" and not has_page_draft:
        from .brief_session import (
            brief_gate_enabled,
            confirm_generation_brief,
            is_brief_confirmed,
        )

        if brief_gate_enabled():
            confirmed = is_brief_confirmed()
            if not confirmed and st and _CONFIRM_GENERATE_RE.search(st.user_message or ""):
                confirm_generation_brief()
                confirmed = True
            if not confirmed:
                return (
                    "用户尚未在对话中确认行业/品类：须先完成一轮对话澄清，"
                    "待用户回复确认或发送「先生成」「确认生成」后再调用 generate_product_content。"
                )

    if not st:
        return None
    if mode == "revise" and st.rollback_intent:
        st.revise_count += 1
        if st.revise_count > 1:
            return (
                "用户要求回退/撤销时，禁止同轮多次 generate_product_content(mode=revise)。"
                "请调用 restore_page_draft(version=-1)。"
            )
        if st.revise_count == 1:
            return (
                "用户要求回退/撤销，禁止用 generate(revise) 代替版本恢复。"
                "请调用 restore_page_draft(version=-1)。"
            )
    return None


def check_restore_allowed() -> str | None:
    st = _state()
    if not st:
        return None
    st.restore_count += 1
    if st.restore_count > 1:
        return "本轮已执行过 restore_page_draft，请勿重复恢复；向用户确认当前预览即可。"
    return None
