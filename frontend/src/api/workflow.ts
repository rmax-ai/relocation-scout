import { api } from './client';
import type { StepCategory, StepStatus, WorkflowState, WorkflowStep } from '../types';

type BackendWorkflowState = {
  search_id: string;
  status: WorkflowState['status'];
  current_step: string | null;
  completed_steps: string[];
  retry_count: number;
  last_error: string | null;
  resumable: boolean;
  created_at: string;
  updated_at: string;
};

type BackendWorkflowStep = {
  step_name: string;
  status: StepStatus;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  retry_count: number;
  error_message: string | null;
};

const TOTAL_WORKFLOW_STEPS = 11;

function getStepCategory(stepName: string): StepCategory {
  if (
    stepName === 'generate_qualitative_evaluations' ||
    stepName === 'build_shortlist' ||
    stepName === 'draft_realtor_message'
  ) {
    return 'agent';
  }

  if (
    stepName === 'await_human_approval' ||
    stepName === 'execute_approved_action'
  ) {
    return 'human';
  }

  return 'code';
}

function toFrontendStep(step: BackendWorkflowStep): WorkflowStep {
  return {
    name: step.step_name,
    status: step.status,
    category: getStepCategory(step.step_name),
    started_at: step.started_at,
    completed_at: step.completed_at,
    duration_seconds: step.duration_ms === null ? null : Math.round(step.duration_ms / 1000),
    retry_count: step.retry_count,
    failure_message: step.error_message,
  };
}

function toProgressPercentage(workflow: BackendWorkflowState, steps: WorkflowStep[]): number {
  if (workflow.status === 'completed') {
    return 100;
  }

  if (steps.length > 0) {
    const completed = steps.filter((step) => step.status === 'completed').length;
    return Math.round((completed / TOTAL_WORKFLOW_STEPS) * 100);
  }

  return Math.round((workflow.completed_steps.length / TOTAL_WORKFLOW_STEPS) * 100);
}

export const workflowApi = {
  get: async (searchId: string) => {
    const workflow = await api.get<BackendWorkflowState>(`/api/searches/${searchId}/workflow`);

    let steps: WorkflowStep[] = [];
    try {
      const rawSteps = await api.get<BackendWorkflowStep[]>(`/api/searches/${searchId}/workflow/steps`);
      steps = rawSteps.map(toFrontendStep);
    } catch {
      steps = [];
    }

    return {
      search_id: workflow.search_id,
      status: workflow.status,
      current_step: workflow.current_step ?? '',
      progress_percentage: toProgressPercentage(workflow, steps),
      steps,
      created_at: workflow.created_at,
      updated_at: workflow.updated_at,
    } satisfies WorkflowState;
  },

  getSteps: (searchId: string) =>
    api.get(`/api/searches/${searchId}/workflow/steps`),

  retry: (searchId: string) =>
    api.post<WorkflowState>(`/api/searches/${searchId}/workflow/retry`),
};
