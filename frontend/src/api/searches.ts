import { api } from './client';
import type { Search, SearchPreferences, SearchSummary } from '../types';

type BackendPriorityWeights = {
  quiet: number;
  transport: number;
  green_space: number;
  affordability: number;
};

type BackendSearchPreferences = {
  max_monthly_rent_eur: number;
  minimum_bedrooms: number;
  minimum_area_m2: number | null;
  destination_address: string;
  max_commute_minutes: number;
  preferred_neighbourhoods: string[];
  excluded_neighbourhoods: string[];
  priorities: BackendPriorityWeights;
  free_text_preferences: string | null;
};

type BackendSearch = {
  id: string;
  name: string;
  status: Search['status'];
  created_at: string;
  updated_at: string;
  preferences: BackendSearchPreferences;
};

type BackendWorkflowStatus = {
  status: string;
  current_step: string | null;
  completed_steps: string[];
};

type CreateSearchRequest = {
  name: string;
  preferences: SearchPreferences;
};

const TOTAL_WORKFLOW_STEPS = 11;

function normalizePriorities(priorities: SearchPreferences['priorities']): BackendPriorityWeights {
  return {
    quiet: priorities.quiet / 100,
    transport: priorities.transport / 100,
    green_space: priorities.green_space / 100,
    affordability: priorities.affordability / 100,
  };
}

function denormalizePriorities(priorities: BackendPriorityWeights): SearchPreferences['priorities'] {
  return {
    quiet: Math.round(priorities.quiet * 100),
    transport: Math.round(priorities.transport * 100),
    green_space: Math.round(priorities.green_space * 100),
    affordability: Math.round(priorities.affordability * 100),
  };
}

function toBackendPreferences(preferences: SearchPreferences): BackendSearchPreferences {
  return {
    max_monthly_rent_eur: preferences.max_rent,
    minimum_bedrooms: preferences.min_bedrooms,
    minimum_area_m2: preferences.min_area,
    destination_address: preferences.commute_destination,
    max_commute_minutes: preferences.max_commute_minutes,
    preferred_neighbourhoods: preferences.preferred_neighbourhoods,
    excluded_neighbourhoods: preferences.excluded_neighbourhoods,
    priorities: normalizePriorities(preferences.priorities),
    free_text_preferences: preferences.preferences_text || null,
  };
}

function toFrontendPreferences(preferences: BackendSearchPreferences): SearchPreferences {
  return {
    max_rent: preferences.max_monthly_rent_eur,
    min_bedrooms: preferences.minimum_bedrooms,
    min_area: preferences.minimum_area_m2 ?? 0,
    commute_destination: preferences.destination_address,
    max_commute_minutes: preferences.max_commute_minutes,
    preferred_neighbourhoods: preferences.preferred_neighbourhoods,
    excluded_neighbourhoods: preferences.excluded_neighbourhoods,
    priorities: denormalizePriorities(preferences.priorities),
    preferences_text: preferences.free_text_preferences ?? '',
  };
}

function mapSearchStatus(
  workflowStatus: string | null | undefined,
  fallbackStatus: Search['status'],
): Search['status'] {
  if (!workflowStatus) {
    return fallbackStatus;
  }

  if (workflowStatus === 'failed') {
    return 'failed';
  }

  if (workflowStatus === 'completed') {
    return 'completed';
  }

  if (workflowStatus === 'awaiting_approval') {
    return 'waiting_approval';
  }

  if (workflowStatus === 'created') {
    return 'created';
  }

  return 'running';
}

function toProgressPercentage(
  workflow: BackendWorkflowStatus | null,
  status: Search['status'],
): number {
  if (status === 'completed') {
    return 100;
  }

  if (!workflow) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((workflow.completed_steps.length / TOTAL_WORKFLOW_STEPS) * 100),
  );
}

function toFrontendSearch(search: BackendSearch): Search {
  return {
    id: search.id,
    name: search.name,
    status: search.status,
    created_at: search.created_at,
    updated_at: search.updated_at,
    preferences: toFrontendPreferences(search.preferences),
    progress_percentage: search.status === 'completed' ? 100 : 0,
    current_step: '',
    completed_at: search.status === 'completed' ? search.updated_at : null,
  };
}

function mergeWorkflowIntoSearch(
  search: Search,
  workflow: BackendWorkflowStatus | null,
): Search {
  const status = mapSearchStatus(workflow?.status, search.status);
  return {
    ...search,
    status,
    progress_percentage: toProgressPercentage(workflow, status),
    current_step: workflow?.current_step ?? '',
    completed_at: status === 'completed' ? search.updated_at : null,
  };
}

async function getWorkflowStatus(searchId: string): Promise<BackendWorkflowStatus | null> {
  try {
    return await api.get<BackendWorkflowStatus>(`/api/searches/${searchId}/workflow`);
  } catch {
    return null;
  }
}

function toFrontendSearchSummary(search: Search): SearchSummary {
  return {
    id: search.id,
    name: search.name,
    status: search.status,
    progress_percentage: search.progress_percentage,
    current_step: search.current_step,
    created_at: search.created_at,
  };
}

export const searchesApi = {
  list: async () =>
    Promise.all(
      (await api.get<BackendSearch[]>('/api/searches')).map(async (search) => {
        const workflow = await getWorkflowStatus(search.id);
        return toFrontendSearchSummary(mergeWorkflowIntoSearch(toFrontendSearch(search), workflow));
      }),
    ),

  get: async (id: string) => {
    const search = await api.get<BackendSearch>(`/api/searches/${id}`);
    const workflow = await getWorkflowStatus(id);
    return mergeWorkflowIntoSearch(toFrontendSearch(search), workflow);
  },

  create: async ({ name, preferences }: CreateSearchRequest) => {
    const search = await api.post<BackendSearch>('/api/searches', {
      name,
      preferences: toBackendPreferences(preferences),
    });
    return toFrontendSearch(search);
  },

  start: (id: string) => api.post<Search>(`/api/searches/${id}/start`),

  resume: (id: string) => api.post<Search>(`/api/searches/${id}/resume`),

  reset: (id: string) => api.post<Search>(`/api/searches/${id}/reset`),
};
