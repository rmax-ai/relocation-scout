FROM python:3.12-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml .
COPY backend/ backend/

RUN uv sync --no-dev

ENV PYTHONPATH=/app/backend/src

CMD ["uv", "run", "uvicorn", "relocation_scout.main:app", "--host", "0.0.0.0", "--port", "8000"]
