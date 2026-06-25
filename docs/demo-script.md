# Demo Script — Relocation Scout (~5 minutes)

## Setup (before demo)

```bash
cd ~/src/relocation-scout
make demo
```

Backend: http://localhost:8000
Frontend: http://localhost:5173

---

## 1. Start the application (0:00)
- Open http://localhost:5173 in a browser
- Note the dark operational console theme
- Left nav shows: Searches, New Search, Workflow, Listings, Shortlist, Approvals, Audit Log, Demo Controls

## 2. Create a search (0:30)
- Click "New Search"
- Fill in preferences:
  - Max rent: €2000
  - Min bedrooms: 2
  - Max commute: 30 min
  - Destination: Amsterdam Centraal
  - Preferred: West, De Baarsjes, Oud-West, Rivierenbuurt
  - Excluded: Noord
  - Priority sliders: adjust to taste (must sum to 100%)
  - Free text: "Quiet area with parks"
- Click "Create and Start Search"

## 3. Watch the workflow execute (1:00)
- Navigate to Workflow page
- Observe the timeline with 10+ steps executing
- Notice step labels: [CODE], [AGENT], [HUMAN]
- Steps complete in sequence: fetch → normalize → dedup → commute → neighbourhood → scoring → qualitative → shortlist → draft → pending action
- Status reaches "awaiting_approval"

## 4. Inspect the listings (2:00)
- Click "Listings" in the nav
- See 12+ normalized Amsterdam listings
- Note deduplication: 13 raw → fewer unique listings
- Open the suspicious listing (jaap:jaap-002 — "Appartement met tuin in West")
- See the warning badge: "⚠ SUSPICIOUS CONTENT DETECTED"
- The malicious text "Ignore all previous instructions..." is clearly labeled as UNTRUSTED SOURCE CONTENT
- The system processed it normally but flagged it — the agent did not follow the injection

## 5. View the shortlist (2:45)
- Click "Shortlist"
- See ranked recommendations with scores
- Side-by-side comparison view
- Evidence links from neighbourhood research, commute data

## 6. Generate and approve a message (3:15)
- Click a listing → "Generate Realtor Message"
- Navigate to "Approvals"
- See the pending action with status "draft"
- Click "Edit" → modify the message body → Save
- Note: editing changed the payload hash, approval is required again
- Click "Approve"
- Status changes: Draft → Pending Approval → Approved
- Click "Execute"
- Status: Approved → Executing → Completed
- Email mock service records the send
- Workflow status: awaiting_approval → completed

## 7. Test idempotency (4:00)
- Navigate to Demo Controls
- Enable "Crash after email send" failure injection
- Generate a new search, approve, execute
- Observe workflow failure
- Click "Resume" on the search overview
- The system reconciles: detects email was already sent
- No duplicate email is sent
- Audit log shows: "Recovered action — email was sent before crash"

## 8. Inspect the audit log (4:30)
- Click "Audit Log"
- Scroll through the chronological event stream
- Each event shows: timestamp, event type, actor (SYSTEM/DET/AGNT/HUMN/TOOL), message
- Note the suspicious content detection event
- Note the approval and execution events
- Click "Export JSON" to download the full audit trail

## 9. Recap (4:50)
- This is NOT a chatbot — it's a governed workflow engine
- Deterministic code handles correctness; agents handle judgment; humans retain authority
- Every architectural claim from the thesis is demonstrated:
  - ✅ Separation of execution responsibilities
  - ✅ Structured contracts (Pydantic at every boundary)
  - ✅ Persistent workflow state (SQLite)
  - ✅ Idempotent external actions
  - ✅ Prompt-injection defense
  - ✅ Human approval gateway
  - ✅ Crash recovery with reconciliation
  - ✅ Comprehensive audit trail
