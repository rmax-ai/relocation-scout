# Scripts

- `run_adk.py` — Start backend in ADK/Gemini live mode
- `run_adk.sh` — Shell wrapper for ADK mode
- `test_adk.sh` — Test ADK runtime directly

For demo/reset/failure injection, use the API endpoints directly or `make` targets:
- `make demo` — Full demo startup
- `make reset` — Reset database
- POST `/api/demo/failures` — Configure failure injection
