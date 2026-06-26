from __future__ import annotations

import pytest

from relocation_scout.config import settings
from relocation_scout.main import validate_runtime_configuration


async def test_validate_runtime_skips_in_mock_mode(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "agent_runtime", "mock")
    monkeypatch.setattr(settings, "google_api_key", None)
    await validate_runtime_configuration()


async def test_validate_runtime_requires_google_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "agent_runtime", "adk")
    monkeypatch.setattr(settings, "google_api_key", None)

    with pytest.raises(ValueError, match="GOOGLE_API_KEY required"):
        await validate_runtime_configuration()


async def test_validate_runtime_checks_google_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "agent_runtime", "adk")
    monkeypatch.setattr(settings, "google_api_key", "bad-key")

    async def fake_verify(_api_key: str) -> None:
        raise RuntimeError("invalid key")

    monkeypatch.setattr("relocation_scout.main.verify_google_api_key", fake_verify)

    with pytest.raises(RuntimeError, match="invalid key"):
        await validate_runtime_configuration()


async def test_validate_runtime_accepts_valid_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "agent_runtime", "adk")
    monkeypatch.setattr(settings, "google_api_key", "test-key")
    called_with: list[str] = []

    async def fake_verify(api_key: str) -> None:
        called_with.append(api_key)

    monkeypatch.setattr("relocation_scout.main.verify_google_api_key", fake_verify)
    await validate_runtime_configuration()
    assert called_with == ["test-key"]
