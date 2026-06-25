.PHONY: install dev test lint seed reset demo verify clean

PYTHONPATH := backend/src
VENV := .venv/bin

install:
	uv sync --extra dev
	cd frontend && npm install

dev:
	@echo "Starting backend on :8000 and frontend on :5173..."
	@AGENT_RUNTIME=mock PYTHONPATH=$(PYTHONPATH) $(VENV)/uvicorn relocation_scout.main:app --host 0.0.0.0 --port 8000 --reload &
	@sleep 2
	@cd frontend && npm run dev

test:
	@PYTHONPATH=$(PYTHONPATH) $(VENV)/python3 -m pytest backend/tests/ -v --tb=short

lint:
	@$(VENV)/ruff check backend/src/ backend/tests/ || true
	@echo "---"
	@$(VENV)/ruff format --check backend/src/ backend/tests/ || true

seed:
	@echo "Initializing database..."
	@curl -s -X POST http://localhost:8000/api/demo/seed 2>/dev/null || echo "Server not running — start with 'make dev' first"

reset:
	@curl -s -X POST http://localhost:8000/api/demo/reset 2>/dev/null || echo "Server not running"

demo: reset
	@echo "Starting Relocation Scout..."
	@echo ""
	@AGENT_RUNTIME=mock PYTHONPATH=$(PYTHONPATH) $(VENV)/uvicorn relocation_scout.main:app --host 0.0.0.0 --port 8000 &
	@sleep 3
	@echo "Backend:  http://localhost:8000"
	@echo "OpenAPI:  http://localhost:8000/docs"
	@echo ""
	@cd frontend && npm run dev -- --host 0.0.0.0

verify:
	@echo "=== Backend lint ==="
	@$(VENV)/ruff check backend/src/ backend/tests/ || true
	@echo "=== Backend format ==="
	@$(VENV)/ruff format --check backend/src/ backend/tests/ || true
	@echo "=== Backend tests ==="
	@PYTHONPATH=$(PYTHONPATH) $(VENV)/python3 -m pytest backend/tests/ -q --tb=line || true
	@echo "=== Frontend typecheck ==="
	@cd frontend && npx tsc --noEmit 2>&1 || true
	@echo "=== Frontend lint ==="
	@cd frontend && npx oxlint 2>&1 || true
	@echo "=== Frontend build ==="
	@cd frontend && npm run build 2>&1 || true

clean:
	rm -rf data/relocation_scout.db
	rm -rf .venv
	rm -rf frontend/node_modules
	rm -rf frontend/dist
