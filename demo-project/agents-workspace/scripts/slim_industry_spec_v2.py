#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""将 industry-content-spec.json 瘦身至 v2：保留 industryHints，移除多 B 子模块。"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

SPECS_DIR = Path(__file__).resolve().parents[1] / "b2b_portal_agent" / "knowledge" / "industry_specs"
SPEC_PATH = SPECS_DIR / "industry-content-spec.json"
FALLBACK_PATH = SPECS_DIR / "industry-type-fallback.json"
BACKUP_SUFFIX = ".v1.bak"

V2_MODULE_IDS = [1, 0, 5, 100]
HTML_LAYOUT_NOTE = (
    "章节顺序与是否使用表格/列表由 AI 按布局合理性实时决定，知识库不预制 htmlOutline"
)
DEFAULT_COMPLIANCE = [
    "不得编造 CE/ISO 等认证号与检测数据",
    "无法从图片或用户输入确认的参数须标注「待补充」或「待核对官方规格」",
]

DEFAULT_TOPICS_BY_TYPE: dict[str, list[str]] = {
    "材料化工": ["成分与规格", "应用领域", "性能特点", "储存与运输", "安全与合规"],
    "机械设备": ["核心参数", "产品特点", "应用场景", "安装与维护", "安全须知"],
    "电子电气": ["技术参数", "功能特点", "接口与兼容性", "应用场景", "认证与标准"],
    "消费品食品": ["成分与营养", "规格包装", "食用/使用方法", "储存条件", "注意事项"],
    "家居建材": ["材质与规格", "产品特点", "适用空间", "安装说明", "保养维护"],
    "服务类": ["服务范围", "服务流程", "交付标准", "适用客户", "常见问题"],
    "其他": ["产品概述", "核心参数", "应用场景", "使用说明", "注意事项"],
}


def _topics_from_modules(modules: list[dict]) -> list[str]:
    topics: list[str] = []
    for mod in modules:
        if not isinstance(mod, dict):
            continue
        ft = str(mod.get("fieldTarget") or "")
        layer = mod.get("layer") or ("B" if ft.startswith("layerB") else "A")
        if layer != "B" and not ft.startswith("layerB"):
            continue
        name = str(mod.get("name") or "").strip()
        if name and name not in topics:
            topics.append(name)
    return topics[:10]


def _compliance_from_modules(modules: list[dict]) -> list[str]:
    lines = list(DEFAULT_COMPLIANCE)
    for mod in modules:
        name = str(mod.get("name") or "")
        guidance = str(mod.get("guidance") or "").strip()
        if any(k in name for k in ("认证", "检测", "安全", "合规")) and guidance:
            snippet = guidance[:120]
            if snippet not in lines:
                lines.append(snippet)
    return lines[:6]


def _build_hints(row: dict) -> dict:
    modules = row.get("contentModules") if isinstance(row.get("contentModules"), list) else []
    industry_type = str(row.get("industryType") or "其他")
    topics = _topics_from_modules(modules) or DEFAULT_TOPICS_BY_TYPE.get(
        industry_type,
        DEFAULT_TOPICS_BY_TYPE["其他"],
    )
    return {
        "compliance": _compliance_from_modules(modules),
        "suggestedTopics": topics,
        "tone": "B2B 专业、简体中文",
        "htmlLayoutNote": HTML_LAYOUT_NOTE,
    }


def _slim_row(row: dict) -> dict:
    out = dict(row)
    legacy_modules = out.get("contentModules") if isinstance(out.get("contentModules"), list) else []
    if not isinstance(out.get("industryHints"), dict):
        out["industryHints"] = _build_hints(out)
    out["contentModuleIds"] = V2_MODULE_IDS
    out["contentModules"] = []
    out["_v1LegacyModuleCount"] = len(legacy_modules)
    return out


def _slim_file(path: Path) -> None:
    if not path.is_file():
        print(f"skip missing: {path}")
        return
    backup = path.with_suffix(path.suffix + BACKUP_SUFFIX)
    if not backup.is_file():
        shutil.copy2(path, backup)
        print(f"backup: {backup}")

    data = json.loads(path.read_text(encoding="utf-8"))
    if "industries" in data:
        data["industries"] = [_slim_row(r) for r in data.get("industries", [])]
        data["version"] = "2.0.0"
        data["scopeNote"] = "v2：行业条目不再展开 B 子模块，由 generatableModules + industryHints 驱动"
    if "templates" in data:
        for key, tpl in data.get("templates", {}).items():
            if isinstance(tpl, dict):
                data["templates"][key] = _slim_row(tpl)
        data["version"] = "2.0.0"

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"slimmed: {path}")


def main() -> None:
    _slim_file(SPEC_PATH)
    _slim_file(FALLBACK_PATH)
    print("done")


if __name__ == "__main__":
    main()
