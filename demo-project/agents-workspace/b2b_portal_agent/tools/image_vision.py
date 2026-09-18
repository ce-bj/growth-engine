# -*- coding: utf-8 -*-
"""多模态视觉模型识图 — 产品图 / 规格图 / 无关图分类与参数抽取。"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

from agentscope._utils._common import _json_loads_with_repair
from agentscope.credential import OpenAICredential
from agentscope.message import Base64Source, DataBlock, Msg, TextBlock, URLSource
from agentscope.model import OpenAIChatModel

from ..config import (
    ensure_api_bypass_proxy,
    get_api_key,
    get_base_url,
    get_vision_model_name,
    get_vision_timeout_sec,
    use_fast_vision_prompt,
)
from .image_context import SessionImage, normalize_pixel_data

logger = logging.getLogger(__name__)

VISION_PROMPT = """你是 B2B 数字门户的产品图片分析专家。运营人员上传的图片可能包含：
- 产品实拍（外观、结构、包装、使用场景）
- 规格资料（参数表、铭牌、合格证、技术图纸、尺寸图、成分表）
- 与产品无关的图片（风景、人物、表情包、无关截图等）

请**逐张**判断图片角色，并给出可用于详情页文案的汇总结论。

## 每张图片 imageRole（必选其一）
- product_photo：产品外观/结构实拍、包装、场景中的产品主体
- spec_sheet：参数表、铭牌、合格证、技术图纸、尺寸/成分表等
- irrelevant：与 B2B 产品发布明显无关
- unknown：无法判断

## 输出 JSON（仅 JSON，不要 markdown 代码块）
{
  "perImage": [
    {
      "index": 0,
      "label": "图片标签（文件名或序号）",
      "imageRole": "product_photo",
      "relevance": "high",
      "description": "画面简要描述",
      "visibleFeatures": ["可见特征"],
      "extractedSpecs": {"参数名": "值或待确认"},
      "confidence": 0.85
    }
  ],
  "aggregated": {
    "industryName": "行业名（如泵阀设备、饮料）；无法判断写「待确认」",
    "productCategory": "细分品类；无法判断写「待识别」",
    "industryType": "机械设备/消费品食品/电子电气等",
    "visibleFeatures": ["跨图合并去重后的特征"],
    "visibleAttributes": {"属性": "值"},
    "likelyScenarios": ["市政排水检查井", "预制混凝土构件施工"],
    "likelyAdvantages": ["分体式可拆卸", "钢制材质耐用", "尺寸精度高"],
    "extractedSpecifications": {"来自规格图的可信参数"},
    "confidence": 0.0,
    "relevantImageCount": 0,
    "irrelevantImageCount": 0,
    "notes": "综合分析说明",
    "userGuidance": "给运营人员的建议；若有无无关图请点名哪张、建议换图"
  }
}

规则：
- 看不清的参数不要编造，写「待确认」
- 若全部为 irrelevant，industryName 保持「待确认」，aggregated.confidence < 0.3
- industryName 使用常见 B2B 中文行业名（泵阀、紧固件、化工、食品、3C 等）
- likelyScenarios / likelyAdvantages 须贴合当前产品品类与可见特征，勿写空泛套话
- likelyScenarios：写**具体工程/行业使用场景**（如「市政排水检查井」），**禁止**写详情页章节名（如「应用场景/使用案例」）
- likelyAdvantages：写**可对外宣传的具体卖点**（如「分体式可拆卸」「密封性能好」），**禁止**写章节名（如「产品功能/性能介绍」）
- 若下方提供了「用户的原始消息」，**必须**结合用户自述的行业身份、产品用途等上下文来判断 industryName 和 productCategory，不要仅凭图片内容推断（例如用户是包装厂商，图片中的产品包装袋应归入包装行业而非袋中所装产品）
"""

VISION_PROMPT_FAST = """你是 B2B 产品图片分析专家。下方若有「用户本轮表述」，**必须优先结合用户文字和用户意图**判断 industryName/productCategory（例如包装厂上传的袋图归包装行业，勿把袋内产品当主体行业）。

逐张判断 imageRole（product_photo/spec_sheet/irrelevant/unknown），输出**纯 JSON**（无 markdown）：
{"perImage":[{"index":0,"label":"","imageRole":"product_photo","description":"","visibleFeatures":[],"extractedSpecs":{},"confidence":0.85}],
"aggregated":{"industryName":"","productCategory":"","industryType":"","visibleFeatures":[],"likelyScenarios":[],"likelyAdvantages":[],"extractedSpecifications":{},"confidence":0.0,"notes":"","userGuidance":""}}
规则：看不清写待确认；likelyScenarios/Advantages 写具体卖点与场景，禁止写章节标题。"""


def _vision_prompt() -> str:
    return VISION_PROMPT_FAST if use_fast_vision_prompt() else VISION_PROMPT


def build_vision_model() -> OpenAIChatModel:
    """视觉调用统一走 OpenAI 多模态格式（主 Agent 即使用 DeepSeek formatter 也可识图）。"""
    base_url = get_base_url()
    ensure_api_bypass_proxy(base_url)
    return OpenAIChatModel(
        credential=OpenAICredential(api_key=get_api_key(), base_url=base_url),
        model=get_vision_model_name(),
        stream=False,
        parameters=OpenAIChatModel.Parameters(max_tokens=2048),
        client_kwargs={"timeout": get_vision_timeout_sec()},
    )


def _data_block_for_image(img: SessionImage) -> DataBlock | None:
    payload = normalize_pixel_data(img.data)
    if payload:
        return DataBlock(
            source=Base64Source(data=payload, media_type=img.media_type),
            name=img.name,
        )
    if img.url and img.url.startswith(("http://", "https://")):
        return DataBlock(
            source=URLSource(url=img.url, media_type=img.media_type or "image/jpeg"),
            name=img.name,
        )
    return None


def _extract_json_object(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fence:
        cleaned = fence.group(1).strip()
    match = re.search(r"\{[\s\S]*\}", cleaned)
    raw = match.group(0) if match else cleaned
    data = _json_loads_with_repair(raw)
    if not isinstance(data, dict):
        raise ValueError("视觉模型返回的不是 JSON 对象")
    return data


async def analyze_images_with_vision(
    images: list[SessionImage],
    *,
    user_message: str = "",
) -> dict[str, Any]:
    """调用多模态模型分析一批图片。"""
    pixel_images = [img for img in images if _data_block_for_image(img)]
    if not pixel_images:
        raise ValueError("没有可送入视觉模型的图片像素或公网 URL")

    labels = [img.name or f"image-{idx}" for idx, img in enumerate(pixel_images)]
    logger.info(
        "Vision analyze: model=%s timeout=%ss images=%d prompt=%s user_msg_len=%d",
        get_vision_model_name(),
        get_vision_timeout_sec(),
        len(pixel_images),
        "fast" if use_fast_vision_prompt() else "full",
        len((user_message or "").strip()),
    )
    intro_parts: list[str] = [_vision_prompt()]
    user_text = (user_message or "").strip()
    if user_text:
        intro_parts.append(
            f"\n\n## 用户本轮表述（识图时必须结合此上下文，勿忽视）\n{user_text}\n"
        )
    intro_parts.append(
        f"\n共 {len(pixel_images)} 张图片，标签依次为："
        f"{json.dumps(labels, ensure_ascii=False)}。"
    )
    intro = "".join(intro_parts)
    content: list[Any] = [TextBlock(text=intro)]
    for img in pixel_images:
        block = _data_block_for_image(img)
        if block:
            content.append(block)

    model = build_vision_model()
    response = await model([Msg(name="user", role="user", content=content)])
    parts: list[str] = []
    for block in response.content:
        if isinstance(block, TextBlock) and block.text:
            parts.append(block.text)
    raw_text = "".join(parts)
    if not raw_text.strip():
        raise ValueError("视觉模型返回空内容")

    parsed = _extract_json_object(raw_text)
    per_image = parsed.get("perImage") or []
    aggregated = parsed.get("aggregated") or {}
    if not isinstance(per_image, list):
        per_image = []
    if not isinstance(aggregated, dict):
        aggregated = {}

    for idx, item in enumerate(per_image):
        if isinstance(item, dict) and not item.get("label") and idx < len(labels):
            item["label"] = labels[idx]

    return {
        "perImage": per_image,
        "aggregated": aggregated,
        "visionModel": get_vision_model_name(),
        "analyzedCount": len(pixel_images),
    }
