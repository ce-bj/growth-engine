# -*- coding: utf-8 -*-
"""图像分析 — 视觉识图 + URL 启发式回退，输出与行业规范可对齐的字段。"""
from __future__ import annotations

import logging
from typing import Any

from .image_context import SessionImage, get_preanalysis, resolve_images_for_analysis, normalize_pixel_data
from .image_vision import analyze_images_with_vision

logger = logging.getLogger(__name__)


def _urls_blob(image_urls: list[str]) -> str:
    return " ".join(image_urls).lower()


def _has_pixel_data(images: list[SessionImage]) -> bool:
    return any(normalize_pixel_data(img.data) for img in images)


def _heuristic_from_user_message(user_message: str) -> dict[str, Any] | None:
    """无像素/视觉失败时，从用户文字推断行业（如包装厂商上传包装袋图）。"""
    msg = (user_message or "").strip()
    if not msg:
        return None

    rules: list[tuple[tuple[str, ...], dict[str, Any]]] = [
        (
            ("包装袋", "包装膜", "软包装", "拉链袋", "自立袋", "食品袋", "塑料袋"),
            {
                "industryName": "包装材料",
                "productCategory": "塑料包装袋",
                "industryType": "消费品食品",
                "visibleFeatures": ["密封包装", "印刷版面"],
                "visibleAttributes": {"包装形式": "袋装（待确认）"},
                "confidence": 0.35,
                "notes": "文字提及包装袋；上传图可能是袋内产品而非包装袋本身，须结合识图或向用户确认。",
            },
        ),
        (
            ("检查井", "模具", "钢模具", "收口井", "预制井"),
            {
                "industryName": "建筑模具",
                "productCategory": "混凝土检查井模具",
                "industryType": "机械设备",
                "visibleFeatures": ["钢制模具", "分体式结构"],
                "confidence": 0.5,
                "notes": "用户文字回退：消息含模具/检查井相关描述。",
            },
        ),
        (
            ("阀", "球阀", "闸阀", "蝶阀", "泵"),
            {
                "industryName": "泵阀设备",
                "productCategory": "工业阀门",
                "industryType": "机械设备",
                "visibleFeatures": ["阀体", "法兰接口"],
                "confidence": 0.5,
                "notes": "用户文字回退：消息含泵阀相关描述。",
            },
        ),
    ]

    for keywords, analysis in rules:
        if any(k in msg for k in keywords):
            return dict(analysis)
    return None


def _heuristic_from_urls(image_urls: list[str]) -> dict[str, Any]:
    """根据 URL/路径关键词推断行业（无像素时的回退）。"""
    blob = _urls_blob(image_urls)

    rules: list[tuple[tuple[str, ...], dict[str, Any]]] = [
        (
            ("pump", "泵", "valve", "阀", "法兰", "industrial", "ball-valve", "球阀"),
            {
                "industryName": "泵阀设备",
                "productCategory": "工业球阀",
                "industryType": "机械设备",
                "visibleFeatures": ["不锈钢阀体", "法兰接口", "手动扳手"],
                "visibleAttributes": {"材质": "不锈钢（外观推断）", "接口类型": "法兰"},
                "confidence": 0.55,
                "notes": "URL 关键词回退：泵/阀相关。",
            },
        ),
        (
            ("headphone", "earphone", "耳机", "earbuds", "audio"),
            {
                "industryName": "影音设备",
                "productCategory": "耳机",
                "industryType": "电子电气",
                "visibleFeatures": ["入耳式", "充电仓"],
                "visibleAttributes": {"佩戴方式": "入耳式"},
                "confidence": 0.55,
                "notes": "URL 关键词回退：耳机相关。",
            },
        ),
        (
            ("food", "食品", "snack", "饮料", "drink", "beverage"),
            {
                "industryName": "饮料",
                "productCategory": "碳酸饮料",
                "industryType": "消费品食品",
                "visibleFeatures": ["密封包装", "品牌标识"],
                "visibleAttributes": {"包装形式": "瓶装/罐装（待确认）"},
                "confidence": 0.5,
                "notes": "URL 关键词回退：食品/饮料相关。",
            },
        ),
        (
            ("package", "packaging", "bag", "包装", "包装袋", "薄膜"),
            {
                "industryName": "包装材料",
                "productCategory": "塑料包装袋",
                "industryType": "消费品食品",
                "visibleFeatures": ["密封包装", "印刷版面"],
                "visibleAttributes": {"包装形式": "袋装（待确认）"},
                "confidence": 0.48,
                "notes": "URL 关键词回退：包装相关。",
            },
        ),
    ]

    for keywords, analysis in rules:
        if any(k in blob for k in keywords):
            return analysis

    return {
        "industryName": "待确认",
        "productCategory": "待识别",
        "industryType": "",
        "visibleFeatures": [],
        "visibleAttributes": {},
        "extractedSpecifications": {},
        "confidence": 0.0,
        "relevantImageCount": 0,
        "irrelevantImageCount": 0,
        "notes": "未能从 URL 推断行业，且无可用图片像素。请结合用户文字或更换清晰产品图。",
        "userGuidance": "请上传产品实拍或规格表图片，并补充品类说明。",
    }


def _pick_heuristic(
    image_urls: list[str],
    *,
    user_message: str = "",
) -> dict[str, Any]:
    url_result = _heuristic_from_urls(image_urls)
    msg_result = _heuristic_from_user_message(user_message)
    if msg_result and (url_result.get("confidence") or 0) <= (msg_result.get("confidence") or 0):
        return msg_result
    return url_result


def _normalize_aggregated(aggregated: dict[str, Any], per_image: list[dict[str, Any]]) -> dict[str, Any]:
    """补齐汇总字段，统计各角色数量。"""
    roles = [
        str(item.get("imageRole", "unknown"))
        for item in per_image
        if isinstance(item, dict)
    ]
    irrelevant = sum(1 for r in roles if r == "irrelevant")
    relevant = sum(1 for r in roles if r in ("product_photo", "spec_sheet"))

    out = dict(aggregated)
    out.setdefault("industryName", "待确认")
    out.setdefault("productCategory", "待识别")
    out.setdefault("industryType", "")
    out.setdefault("visibleFeatures", [])
    out.setdefault("likelyScenarios", [])
    out.setdefault("likelyAdvantages", [])
    out.setdefault("visibleAttributes", {})
    out.setdefault("extractedSpecifications", {})
    out.setdefault("confidence", 0.0)
    out.setdefault("notes", "")
    out.setdefault("userGuidance", "")
    out["irrelevantImageCount"] = out.get("irrelevantImageCount", irrelevant)
    out["relevantImageCount"] = out.get("relevantImageCount", relevant)
    out["hasIrrelevantImages"] = irrelevant > 0
    out["imageRoleSummary"] = {
        "product_photo": roles.count("product_photo"),
        "spec_sheet": roles.count("spec_sheet"),
        "irrelevant": roles.count("irrelevant"),
        "unknown": roles.count("unknown"),
    }
    return out


def _build_result(
    *,
    image_urls: list[str],
    images: list[SessionImage],
    analysis_mode: str,
    analysis: dict[str, Any],
    per_image: list[dict[str, Any]] | None = None,
    vision_error: str = "",
) -> dict[str, Any]:
    refs = [img.ref() for img in images] or image_urls
    result: dict[str, Any] = {
        "image_urls": image_urls or refs,
        "imageCount": len(images) or len(image_urls),
        "analysisMode": analysis_mode,
        "analysis": analysis,
    }
    if per_image is not None:
        result["perImage"] = per_image
    if vision_error:
        result["visionError"] = vision_error
    return result


def _coerce_session_images(images: list[SessionImage] | None) -> list[SessionImage]:
    if not images:
        return []
    return [
        SessionImage(
            name=img.name,
            data=normalize_pixel_data(img.data),
            media_type=img.media_type,
            url=img.url,
        )
        for img in images
    ]


async def analyze_images_async(
    image_urls: list[str] | None = None,
    *,
    user_message: str = "",
    explicit_images: list[SessionImage] | None = None,
    skip_vision: bool = False,
) -> dict[str, Any]:
    """分析产品图片：优先视觉模型，失败时回退 URL/文字启发式。

    ``explicit_images`` 由调用方直接传入像素数据，绕过 ContextVar，
    确保在 asyncio.create_task 等场景下不丢失图片 base64。
    ``skip_vision=True`` 时跳过视觉 API（用于识图超时后的快速回退）。
    """
    cached = get_preanalysis()
    if cached is not None:
        out = dict(cached)
        out["analysisMode"] = f"{out.get('analysisMode', 'vision')}+cached"
        return out

    urls = [str(u).strip() for u in (image_urls or []) if str(u).strip()]

    if explicit_images:
        resolved = _coerce_session_images(explicit_images)
        logger.info(
            "[preanalyze] using %d explicit images (pixel=%d, remote=%d)",
            len(resolved),
            sum(1 for img in resolved if normalize_pixel_data(img.data)),
            sum(1 for img in resolved if img.url.startswith(("http://", "https://"))),
        )
    else:
        resolved = _coerce_session_images(resolve_images_for_analysis(urls))
        logger.info(
            "[preanalyze] resolved %d images from ContextVar (pixel=%d, remote=%d)",
            len(resolved),
            sum(1 for img in resolved if normalize_pixel_data(img.data)),
            sum(1 for img in resolved if img.url.startswith(("http://", "https://"))),
        )
    refs = [img.ref() for img in resolved] or urls

    has_pixels = _has_pixel_data(resolved)
    has_remote = any(img.url.startswith(("http://", "https://")) for img in resolved)

    if skip_vision:
        heuristic = _pick_heuristic(refs, user_message=user_message)
        return _build_result(
            image_urls=refs,
            images=resolved,
            analysis_mode="text_heuristic",
            analysis=heuristic,
        )

    if resolved and (has_pixels or has_remote):
        try:
            vision = await analyze_images_with_vision(resolved, user_message=user_message)
            per_image = vision.get("perImage") or []
            aggregated = _normalize_aggregated(
                vision.get("aggregated") or {},
                per_image if isinstance(per_image, list) else [],
            )
            return _build_result(
                image_urls=refs,
                images=resolved,
                analysis_mode="vision",
                analysis=aggregated,
                per_image=per_image if isinstance(per_image, list) else [],
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Vision analysis failed, falling back: %s", exc)
            heuristic = _pick_heuristic(refs, user_message=user_message)
            heuristic["notes"] = (
                f"视觉识图失败（{exc}），已回退启发式。"
                + (" " + heuristic.get("notes", ""))
            ).strip()
            return _build_result(
                image_urls=refs,
                images=resolved,
                analysis_mode="url_heuristic",
                analysis=heuristic,
                vision_error=str(exc),
            )

    heuristic = _pick_heuristic(refs, user_message=user_message)
    return _build_result(
        image_urls=refs,
        images=resolved,
        analysis_mode="url_heuristic" if refs else "empty",
        analysis=heuristic,
    )


def analyze_images(
    image_urls: list[str],
    *,
    user_message: str = "",
) -> dict[str, Any]:
    """同步包装（URL/文字启发式；有像素时请用 analyze_images_async）。"""
    urls = [str(u).strip() for u in image_urls if str(u).strip()]
    resolved = _coerce_session_images(resolve_images_for_analysis(urls))
    refs = [img.ref() for img in resolved] or urls
    return _build_result(
        image_urls=refs,
        images=resolved,
        analysis_mode="url_heuristic",
        analysis=_pick_heuristic(refs, user_message=user_message),
    )
