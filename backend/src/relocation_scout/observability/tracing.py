from __future__ import annotations

import uuid
from typing import Any


class TraceContext:
    """Simple trace context for correlating events across a workflow run."""

    def __init__(self, trace_id: str | None = None):
        self.trace_id = trace_id or str(uuid.uuid4())
        self.spans: list[dict[str, Any]] = []

    def start_span(self, name: str) -> str:
        span_id = str(uuid.uuid4())[:8]
        self.spans.append({"span_id": span_id, "name": name, "status": "started"})
        return span_id

    def end_span(self, span_id: str):
        for span in self.spans:
            if span["span_id"] == span_id:
                span["status"] = "completed"


class MetricsCollector:
    """In-memory metrics collector for the PoC."""

    def __init__(self):
        self.counters: dict[str, int] = {}
        self.gauges: dict[str, float] = {}

    def increment(self, name: str, value: int = 1):
        self.counters[name] = self.counters.get(name, 0) + value

    def set_gauge(self, name: str, value: float):
        self.gauges[name] = value

    def snapshot(self) -> dict:
        return {
            "counters": dict(self.counters),
            "gauges": dict(self.gauges),
        }


metrics = MetricsCollector()
