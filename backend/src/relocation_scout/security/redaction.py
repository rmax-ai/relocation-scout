from __future__ import annotations

import re

# Simple patterns for potential PII in free text
_PII_PATTERNS = [
    (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "[EMAIL_REDACTED]"),
    (r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b", "[PHONE_REDACTED]"),
]


def redact_pii(text: str) -> str:
    """Redact potential PII from text for logging/safe display."""
    for pattern, replacement in _PII_PATTERNS:
        text = re.sub(pattern, replacement, text)
    return text


def redact_dict(data: dict) -> dict:
    """Redact PII from all string values in a dict."""
    result = {}
    for key, value in data.items():
        if isinstance(value, str):
            result[key] = redact_pii(value)
        elif isinstance(value, dict):
            result[key] = redact_dict(value)
        elif isinstance(value, list):
            result[key] = [redact_pii(v) if isinstance(v, str) else v for v in value]
        else:
            result[key] = value
    return result
