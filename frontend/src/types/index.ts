// === Search Types ===
export interface SearchPreferences {
  max_rent: number;
  min_bedrooms: number;
  min_area: number;
  commute_destination: string;
  max_commute_minutes: number;
  preferred_neighbourhoods: string[];
  excluded_neighbourhoods: string[];
  priorities: {
    quiet: number;
    transport: number;
    green_space: number;
    affordability: number;
  };
  preferences_text: string;
}

export type SearchStatus =
  | 'created'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'waiting_approval';

export interface Search {
  id: string;
  name: string;
  preferences: SearchPreferences;
  status: SearchStatus;
  progress_percentage: number;
  current_step: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface SearchSummary {
  id: string;
  name: string;
  status: SearchStatus;
  progress_percentage: number;
  current_step: string;
  created_at: string;
}

// === Workflow Types ===
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type StepCategory = 'code' | 'agent' | 'human';

export interface WorkflowStep {
  name: string;
  status: StepStatus;
  category: StepCategory;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  retry_count: number;
  failure_message: string | null;
}

export interface WorkflowState {
  search_id: string;
  status: SearchStatus;
  current_step: string;
  progress_percentage: number;
  steps: WorkflowStep[];
  created_at: string;
  updated_at: string;
}

// === Listing Types ===
export type ListingStatus = 'pending' | 'passed' | 'rejected';

export interface ListedNeighbourhood {
  name: string;
  match_type: 'preferred' | 'excluded' | 'neutral';
  commute_minutes: number;
  transit_score: number;
  green_score: number;
  quiet_score: number;
}

export interface ListingScore {
  overall: number;
  commute: number;
  affordability: number;
  neighbourhood_fit: number;
  transport: number;
  quiet: number;
  green_space: number;
  breakdown: Record<string, number>;
}

export interface Listing {
  id: string;
  provider_id: string;
  title: string;
  address: string;
  neighbourhood: string;
  rent: number;
  bedrooms: number;
  area_sqm: number;
  commute_minutes: number;
  score: number;
  recommendation: string;
  status: ListingStatus;
  has_suspicious_content: boolean;
  suspicious_content_types: string[];
  created_at: string;
}

export interface ListingDetail extends Listing {
  source_fields: Record<string, unknown>;
  normalized_fields: Record<string, unknown>;
  score_breakdown: ListingScore;
  neighbourhood_evidence: Record<string, unknown>;
  strengths: string[];
  concerns: string[];
  provenance: string;
  prompt_injection_warning: string | null;
  description: string;
  url: string;
  provider: string;
  raw_data: Record<string, unknown>;
}

// === Shortlist Types ===
export interface ShortlistEntry {
  listing_id: string;
  listing: Listing;
  rank: number;
  score: number;
  commute_rating: string;
  affordability_rating: string;
  neighbourhood_fit_rating: string;
  explanation: string;
  evidence_links: string[];
}

// === Action / Approval Types ===
export type ActionStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'executing'
  | 'completed'
  | 'failed';

export type ActionType = 'email_realtor' | 'phone_call' | 'book_viewing' | 'send_inquiry';

export interface Action {
  id: string;
  search_id: string;
  action_type: ActionType;
  listing_id: string;
  listing_title: string;
  recipient: string;
  subject: string;
  body: string;
  risk_level: 'low' | 'medium' | 'high';
  status: ActionStatus;
  payload_hash: string;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  executed_at: string | null;
  failure_reason: string | null;
}

// === Audit Types ===
export type AuditActor = 'system' | 'deterministic' | 'agent' | 'human' | 'tool';

export interface AuditEvent {
  id: string;
  timestamp: string;
  event_type: string;
  actor: AuditActor;
  workflow_step: string;
  entity_type: string;
  entity_id: string;
  message: string;
  metadata: Record<string, unknown>;
}

export interface AuditExport {
  events: AuditEvent[];
  total: number;
  search_id: string;
}

// === Demo Types ===
export interface DemoFailures {
  malformed_agent_output: boolean;
  neighbourhood_agent_failure: boolean;
  commute_timeout: boolean;
  crash_before_email_send: boolean;
  crash_after_email_send: boolean;
  duplicate_workflow_steps: boolean;
  prompt_injection_fixture: boolean;
}

// === Metrics Types ===
export interface Metrics {
  searches_created: number;
  searches_completed: number;
  listings_found: number;
  actions_pending: number;
  actions_completed: number;
  workflow_steps_executed: number;
  agent_calls: number;
  avg_step_duration_ms: number;
  error_rate: number;
  uptime_seconds: number;
}

// === Health Types ===
export interface Health {
  status: string;
  version: string;
  agent_runtime: string;
  database: string;
  uptime_seconds: number;
}
