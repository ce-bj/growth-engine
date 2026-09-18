# -*- coding: utf-8 -*-
"""当前会话上传图片的线程/协程上下文，供识图工具读取像素数据。"""
from __future__ import annotations

import re
from contextvars import ContextVar
from dataclasses import dataclass
from typing import Any


def normalize_pixel_data(data: str) -> str:
    """剥离 data URL 前缀与空白，供多模态 API 使用。"""
    raw = str(data or "").strip()
    if raw.startswith("data:") and "," in raw:
        raw = raw.split(",", 1)[1]
    return re.sub(r"\s+", "", raw)


@dataclass
class SessionImage:
    """单张待分析图片。"""

    name: str
    data: str = ""
    media_type: str = "image/jpeg"
    url: str = ""

    def ref(self) -> str:
        if self.url:
            return self.url
        return f"upload://{self.name or 'image'}"


_session_images: ContextVar[list[SessionImage]] = ContextVar(
    "b2b_session_images",
    default=[],
)

_preanalysis: ContextVar[dict[str, Any] | None] = ContextVar(
    "b2b_preanalysis",
    default=None,
)


def bind_session_images(
    images: list[dict[str, Any]] | None = None,
    image_urls: list[str] | None = None,
) -> None:
    """Bridge 在每轮对话开始前绑定本轮用户上传的图片。"""
    bound: list[SessionImage] = []
    seen_refs: set[str] = set()

    for raw in images or []:
        name = str(raw.get("name") or "image").strip() or "image"
        data = normalize_pixel_data(str(raw.get("data") or ""))
        media_type = str(raw.get("media_type") or "image/jpeg").strip() or "image/jpeg"
        url = str(raw.get("url") or "").strip()
        ref = url or f"upload://{name}"
        if ref in seen_refs:
            continue
        seen_refs.add(ref)
        bound.append(SessionImage(name=name, data=data, media_type=media_type, url=url))

    for url in image_urls or []:
        url = str(url).strip()
        if not url or url in seen_refs:
            continue
        seen_refs.add(url)
        name = url.rsplit("/", 1)[-1] if "/" in url else url
        if name.startswith("upload://"):
            name = name.removeprefix("upload://")
        bound.append(SessionImage(name=name or "image", url=url))

    _session_images.set(bound)


def get_session_images() -> list[SessionImage]:
    return list(_session_images.get())


def reset_session_images() -> None:
    _session_images.set([])
    _preanalysis.set(None)


def set_preanalysis(result: dict[str, Any]) -> None:
    _preanalysis.set(result)


def get_preanalysis() -> dict[str, Any] | None:
    return _preanalysis.get()


def resolve_images_for_analysis(image_urls: list[str] | None = None) -> list[SessionImage]:
    """合并工具入参 URL 与会话上下文，得到可分析的图片列表。"""
    session = get_session_images()
    if not session:
        return [
            SessionImage(
                name=url.rsplit("/", 1)[-1].removeprefix("upload://") or "image",
                url=url,
            )
            for url in (image_urls or [])
            if str(url).strip()
        ]

    urls = [str(u).strip() for u in (image_urls or []) if str(u).strip()]
    if not urls:
        return session

    by_ref = {img.ref(): img for img in session}
    by_name = {img.name: img for img in session if img.name}

    resolved: list[SessionImage] = []
    seen: set[str] = set()
    for url in urls:
        if url in seen:
            continue
        seen.add(url)
        if url in by_ref:
            resolved.append(by_ref[url])
            continue
        name = url.removeprefix("upload://")
        if name in by_name:
            resolved.append(by_name[name])
            continue
        resolved.append(
            SessionImage(
                name=name.rsplit("/", 1)[-1] or "image",
                url=url,
            ),
        )

    for img in session:
        if img.ref() not in seen:
            resolved.append(img)

    return resolved
