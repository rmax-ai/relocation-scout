from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from relocation_scout.persistence.models import SentEmailRecord


class MockEmailService:
    """Mock email service that persists to the database."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self._sent_count = 0
        self._fail_next = False  # For failure injection

    def set_fail_next(self, fail: bool = True):
        self._fail_next = fail

    async def send_email(self, recipient: str, subject: str, body: str, action_id: str) -> dict:
        """Send a mock email. Returns the sent record."""
        if self._fail_next:
            self._fail_next = False
            raise RuntimeError("Simulated email send failure")

        record = SentEmailRecord(
            id=str(uuid.uuid4()),
            action_id=action_id,
            recipient=recipient,
            subject=subject,
            body=body,
            sent_at=datetime.now(),
        )
        self.session.add(record)
        await self.session.flush()
        self._sent_count += 1

        return {
            "email_id": record.id,
            "recipient": recipient,
            "subject": subject,
            "sent_at": record.sent_at.isoformat(),
            "status": "sent",
        }
