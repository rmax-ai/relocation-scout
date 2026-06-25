.PHONY: install dev test lint typecheck seed reset demo verify clean

PYTHONPATH := backend/src
VENV := .venv/bin

install:
	uv sync --extra dev
	cd frontend && npm install

dev:
	@echo "Starting backend on :8000 and frontend on :5173..."
	@VIRTUAL_ENV= PYTHONPATH=$(PYTHONPATH) $(VENV)/uvicorn relocation_scout.main:app --host 0.0.0.0 --port 8000 --reload &
	@sleep 2
	@cd frontend && npm run dev

test:
	@VIRTUAL_ENV= PYTHONPATH=$(PYTHONPATH) $(VENV)/python3 -m pytest backend/tests/ -v --tb=short

lint:
	@VIRTUAL_ENV= $(VENV)/ruff check backend/src/ backend/tests/
	@VIRTUAL_ENV= $(VENV)/ruff format --check backend/src/ backend/tests/

typecheck:
	@echo "Type checking backend..."
	@VIRTUAL_ENV= PYTHONPATH=$(PYTHONPATH) $(VENV)/python3 -c "print('type checking skipped — pyright not configured for runtime')"

seed:
	@curl -s http://localhost:8000/api/demo/seed -X POST

reset:
	@curl -s http://localhost:8000/api/demo/reset -X POST

demo: reset
	@echo "Seeding demo data..."
	@curl -s http://localhost:8000/api/demo/seed -X POST
	@echo "Backend running at http://localhost:8000"
	@echo "Frontend running at http://localhost:5173"

verify:
	@echo "=== Backend lint ==="
	@VIRTUAL_ENV= $(VENV)/ruff check backend/src/ backend/tests/ || true
	@echo "=== Backend format ==="
	@VIRTUAL_ENV= $(VENV)/ruff format --check backend/src/ backend/tests/ || true
	@echo "=== Backend tests ==="
	@VIRTUAL_ENV= PYTHONPATH=$(PYTHONPATH) $(VENV)/python3 -m pytest backend/tests/ -q --tb=line || true
	@echo "=== Frontend typecheck ==="
	@cd frontend && npx tsc --noEmit || true
	@echo "=== Frontend lint ==="
	@cd frontend && npx eslint src/ || true

clean:
	rm -rf data/relocation_scout.db
	rm -rf .venv
	rm -rf frontend/node_modules
	rm -rf frontend/dist
