const demoSequence = `# 1) Reset demo state
curl -s -X POST http://localhost:8000/api/demo/reset
# {"status":"reset","message":"Database dropped and recreated"}

# 2) Create search
curl -s -X POST http://localhost:8000/api/searches \\
  -H "content-type: application/json" \\
  -d '{
    "name": "Demo search",
    "preferences": {
      "max_monthly_rent_eur": 2500,
      "minimum_bedrooms": 2,
      "minimum_area_m2": 60,
      "max_commute_minutes": 45,
      "destination_address": "Amsterdam Centraal",
      "preferred_neighbourhoods": ["West", "Oost"],
      "excluded_neighbourhoods": [],
      "priorities": {
        "quiet": 0.25,
        "transport": 0.25,
        "green_space": 0.25,
        "affordability": 0.25
      }
    }
  }'
# {"id":"<search_id>","status":"created",...}

# 3) Start workflow
curl -s -X POST http://localhost:8000/api/searches/<search_id>/start
# {"search_id":"<search_id>","status":"awaiting_approval","current_step":"create_pending_action",...}

# 4) Check workflow status
curl -s http://localhost:8000/api/searches/<search_id>/workflow
# {"search_id":"<search_id>","status":"awaiting_approval",...}

# 5) List pending actions
curl -s http://localhost:8000/api/searches/<search_id>/actions
# [{"action_id":"<action_id>","action_type":"send_realtor_email","status":"draft",...}]

# 6) Approve + execute action
curl -s -X POST http://localhost:8000/api/actions/<action_id>/approve \\
  -H "content-type: application/json" \\
  -d '{"approved_by":"demo_user","comment":"approved in demo"}'
# {"approval_id":"<approval_id>","decision":"approved",...}

curl -s -X POST http://localhost:8000/api/actions/<action_id>/execute
# {"status":"executed","result":{"email_id":"<email_id>","status":"sent",...}}

# 7) Confirm completed workflow
curl -s http://localhost:8000/api/searches/<search_id>/workflow
# {"search_id":"<search_id>","status":"completed",...}

# Optional: inspect step executions
curl -s http://localhost:8000/api/searches/<search_id>/workflow/steps
# []`;

export function DemoSequencePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-slate-100 mb-2">API Demo Sequence</h2>
      <p className="text-sm text-slate-400 mb-4">
        Run this script after starting the backend (`make dev` or `make demo`).
      </p>
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <pre className="text-xs text-slate-200 overflow-x-auto whitespace-pre">{demoSequence}</pre>
      </div>
    </div>
  );
}
