# -*- coding: utf-8 -*-
"""页面推荐问：只生成 3～5 个可点击问题，不进入主 Agent，也不调用工具。"""
from __future__ import annotations

import json
import urllib.request

from b2b_portal_agent.config import get_api_key, get_base_url, get_effective_model_name

_SYSTEM = """你是 AI 运营助手里的推荐问 Agent，只做一件事：根据用户当前所在的后台页面，写 3 到 5 个可以直接发送的问题。
规则：
- 每行一个问题，不要编号，不要标题，不要解释
- 每个问题都要带上当前页面正在看的对象，用页面名称或页面说明里的词
- 不要只复述能力名称，例如不要只写「帮我发布产品」
- 问题要能直接发给运营助手去做，并落在用户列出的能力里
- 用运营同事会说的话，一句一件事
- 不要调用任何工具，不要输出 Markdown"""


def complete_page_questions(user_text: str) -> str:
    base = get_base_url().rstrip("/")
    url = f"{base}/chat/completions"
    payload = {
        "model": get_effective_model_name().split(",")[0].strip(),
        "temperature": 0.3,
        "max_tokens": 180,
        "enable_thinking": False,
        "messages": [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": (user_text or "").strip()},
        ],
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {get_api_key()}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        data = json.loads(response.read().decode("utf-8"))
    message = (data.get("choices") or [{}])[0].get("message") or {}
    content = message.get("content") or ""
    if isinstance(content, list):
        content = "".join(
            part.get("text", "") for part in content if isinstance(part, dict)
        )
    text = str(content).strip()
    if not text:
        raise ValueError("推荐问没有生成出来")
    return text
