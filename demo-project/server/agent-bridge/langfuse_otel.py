# -*- coding: utf-8 -*-
"""将 AgentScope TracingMiddleware 的 OTEL spans 导出到自托管 Langfuse。"""
from __future__ import annotations

import base64
import os
from typing import Any
from urllib.parse import urlparse

_STATUS: dict[str, Any] = {
    "enabled": False,
    "configured": False,
    "base_url": None,
    "otlp_url": None,
    "service_name": None,
    "error": None,
}


def get_langfuse_status() -> dict[str, Any]:
    return dict(_STATUS)


def _strip_quotes(value: str) -> str:
    text = (value or "").strip()
    if len(text) >= 2 and text[0] == text[-1] and text[0] in ("'", '"'):
        return text[1:-1].strip()
    return text


def _env(name: str, default: str = "") -> str:
    return _strip_quotes(os.environ.get(name, default))


def resolve_otlp_url(base_url: str, explicit: str = "") -> str:
    if explicit:
        return explicit.rstrip("/")
    root = (base_url or "").rstrip("/")
    if not root:
        return ""
    # OTLPSpanExporter 需要完整 traces 路径
    if root.endswith("/v1/traces"):
        return root
    if root.endswith("/api/public/otel"):
        return f"{root}/v1/traces"
    return f"{root}/api/public/otel/v1/traces"


def setup_langfuse_otel() -> dict[str, Any]:
    """在 Bridge 启动时调用一次：配置 TracerProvider → Langfuse OTLP HTTP。"""
    global _STATUS

    flag = _env("LANGFUSE_ENABLED", "true").lower()
    if flag in ("0", "false", "no", "off"):
        _STATUS = {
            "enabled": False,
            "configured": False,
            "base_url": None,
            "otlp_url": None,
            "service_name": None,
            "error": "disabled_by_env",
        }
        print("[langfuse] tracing disabled (LANGFUSE_ENABLED=false)")
        return get_langfuse_status()

    public_key = _env("LANGFUSE_PUBLIC_KEY")
    secret_key = _env("LANGFUSE_SECRET_KEY")
    base_url = _env("LANGFUSE_BASE_URL")
    otlp_url = resolve_otlp_url(base_url, _env("LANGFUSE_OTLP_URL"))
    service_name = _env("OTEL_SERVICE_NAME", "ai-ops-assistant-demo")

    if not public_key or not secret_key or not otlp_url:
        _STATUS = {
            "enabled": False,
            "configured": False,
            "base_url": base_url or None,
            "otlp_url": otlp_url or None,
            "service_name": service_name,
            "error": "missing_credentials_or_url",
        }
        print(
            "[langfuse] skip tracing: need LANGFUSE_PUBLIC_KEY, "
            "LANGFUSE_SECRET_KEY, LANGFUSE_BASE_URL (or LANGFUSE_OTLP_URL)",
        )
        return get_langfuse_status()

    parsed = urlparse(otlp_url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        _STATUS = {
            "enabled": False,
            "configured": False,
            "base_url": base_url,
            "otlp_url": otlp_url,
            "service_name": service_name,
            "error": "invalid_otlp_url",
        }
        print(f"[langfuse] invalid OTLP url: {otlp_url}")
        return get_langfuse_status()

    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
            OTLPSpanExporter,
        )
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import (
            BatchSpanProcessor,
            SimpleSpanProcessor,
        )
    except ImportError as exc:
        _STATUS = {
            "enabled": False,
            "configured": False,
            "base_url": base_url,
            "otlp_url": otlp_url,
            "service_name": service_name,
            "error": f"missing_otel_deps: {exc}",
        }
        print(f"[langfuse] OpenTelemetry deps missing: {exc}")
        return get_langfuse_status()

    auth = base64.b64encode(f"{public_key}:{secret_key}".encode("utf-8")).decode(
        "ascii",
    )
    headers = {
        "Authorization": f"Basic {auth}",
        "x-langfuse-ingestion-version": "4",
    }

    # 同步到环境变量，便于其它库读取
    os.environ.setdefault("OTEL_EXPORTER_OTLP_ENDPOINT", otlp_url.rsplit("/v1/traces", 1)[0])
    os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = (
        f"Authorization=Basic {auth},x-langfuse-ingestion-version=4"
    )
    os.environ.setdefault("OTEL_SERVICE_NAME", service_name)

    resource = Resource.create(
        {
            "service.name": service_name,
            "service.namespace": "ai-ops-assistant",
            "deployment.environment": _env("LANGFUSE_ENV", "local-demo"),
        },
    )
    provider = TracerProvider(resource=resource)
    # 短超时：Langfuse 不可达时避免拖死嵌套 reply_stream
    export_timeout = float(_env("LANGFUSE_EXPORT_TIMEOUT_SEC", "2") or "2")
    exporter = OTLPSpanExporter(
        endpoint=otlp_url,
        headers=headers,
        timeout=export_timeout,
    )

    # 本地 Demo：默认 batch，避免 SimpleSpanProcessor 同步卡在不可达的 Langfuse
    # 需要即时可见时再设 LANGFUSE_OTEL_PROCESSOR=simple
    processor_mode = _env("LANGFUSE_OTEL_PROCESSOR", "batch").lower()
    if processor_mode == "simple":
        provider.add_span_processor(SimpleSpanProcessor(exporter))
    else:
        provider.add_span_processor(
            BatchSpanProcessor(
                exporter,
                max_export_batch_size=16,
                schedule_delay_millis=5000,
                export_timeout_millis=int(export_timeout * 1000),
                max_queue_size=64,
            ),
        )

    trace.set_tracer_provider(provider)

    _STATUS = {
        "enabled": True,
        "configured": True,
        "base_url": base_url,
        "otlp_url": otlp_url,
        "service_name": service_name,
        "processor": processor_mode if processor_mode == "batch" else "simple",
        "error": None,
    }
    print(f"[langfuse] OTEL → {otlp_url} (service={service_name})")
    return get_langfuse_status()


def flush_langfuse_otel(timeout_millis: int | None = None) -> bool:
    """尽量在一轮对话结束后刷出 spans（短超时，避免拖死响应收尾）。"""
    if not _STATUS.get("enabled"):
        return False
    if timeout_millis is None:
        try:
            timeout_millis = int(_env("LANGFUSE_FLUSH_TIMEOUT_MS", "800") or "800")
        except ValueError:
            timeout_millis = 800
    try:
        from opentelemetry import trace

        provider = trace.get_tracer_provider()
        flush = getattr(provider, "force_flush", None)
        if callable(flush):
            return bool(flush(timeout_millis))
    except Exception as exc:  # noqa: BLE001
        print(f"[langfuse] force_flush failed: {exc}")
    return False
