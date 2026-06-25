import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchesApi } from '../api/searches';
import { workflowApi } from '../api/workflow';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

function formatDate(ts: string | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

export function SearchOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: search, isLoading, error } = useQuery({
    queryKey: ['search', id],
    queryFn: () => searchesApi.get(id!),
    enabled: !!id,
    refetchInterval: 10_000,
  });

  const resumeMutation = useMutation({
    mutationFn: () => searchesApi.resume(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', id] });
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => workflowApi.retry(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', id] });
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => searchesApi.reset(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', id] });
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
    },
  });

  if (isLoading) {
    return <div className="text-slate-400">Loading search…</div>;
  }

  if (error || !search) {
    return (
      <EmptyState
        title="Search Not Found"
        description={error instanceof Error ? error.message : 'Could not load search details.'}
        action={{ label: 'Create New Search', onClick: () => navigate('/') }}
      />
    );
  }

  const canResume = search.status === 'paused' || search.status === 'failed';
  const canRetry = search.status === 'failed';
  const canReset = search.status === 'completed' || search.status === 'failed';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">{search.name}</h2>
          <p className="text-sm text-slate-500">
            ID: <code className="text-cyan-400">{search.id}</code>
          </p>
        </div>
        <StatusBadge status={search.status} />
      </div>

      {/* Progress */}
      <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Progress
        </h3>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 bg-slate-700 rounded-full h-3">
            <div
              className="bg-cyan-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${search.progress_percentage}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-300 w-12 text-right">
            {search.progress_percentage}%
          </span>
        </div>
        <div className="text-sm text-slate-400">
          Current step: <span className="text-cyan-400 font-mono">{search.current_step || '—'}</span>
        </div>
      </section>

      {/* Timestamps */}
      <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Timestamps
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Created:</span>
            <br />
            <span className="text-slate-300">{formatDate(search.created_at)}</span>
          </div>
          <div>
            <span className="text-slate-500">Updated:</span>
            <br />
            <span className="text-slate-300">{formatDate(search.updated_at)}</span>
          </div>
          <div>
            <span className="text-slate-500">Completed:</span>
            <br />
            <span className="text-slate-300">{formatDate(search.completed_at)}</span>
          </div>
        </div>
      </section>

      {/* Preferences */}
      {search.preferences && (
        <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Preferences
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-slate-500">Max Rent:</span> ${search.preferences.max_rent}
            </div>
            <div>
              <span className="text-slate-500">Bedrooms:</span> {search.preferences.min_bedrooms}+
            </div>
            <div>
              <span className="text-slate-500">Min Area:</span> {search.preferences.min_area}m²
            </div>
            <div>
              <span className="text-slate-500">Max Commute:</span> {search.preferences.max_commute_minutes}min
            </div>
            <div>
              <span className="text-slate-500">Commute Dest:</span> {search.preferences.commute_destination}
            </div>
            <div>
              <span className="text-slate-500">Priorities:</span>{' '}
              {Object.entries(search.preferences.priorities)
                .map(([k, v]) => `${k}: ${v}%`)
                .join(', ')}
            </div>
            {search.preferences.preferred_neighbourhoods.length > 0 && (
              <div className="col-span-2">
                <span className="text-slate-500">Preferred:</span>{' '}
                {search.preferences.preferred_neighbourhoods.join(', ')}
              </div>
            )}
            {search.preferences.excluded_neighbourhoods.length > 0 && (
              <div className="col-span-2">
                <span className="text-slate-500">Excluded:</span>{' '}
                {search.preferences.excluded_neighbourhoods.join(', ')}
              </div>
            )}
          </div>
          {search.preferences.preferences_text && (
            <div className="mt-3 p-3 bg-slate-900/50 rounded text-sm text-slate-400 italic">
              {search.preferences.preferences_text}
            </div>
          )}
        </section>
      )}

      {/* Actions */}
      <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          {canResume && (
            <button
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded text-sm"
            >
              {resumeMutation.isPending ? 'Resuming…' : 'Resume Search'}
            </button>
          )}
          {canRetry && (
            <button
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white rounded text-sm"
            >
              {retryMutation.isPending ? 'Retrying…' : 'Retry Failed Step'}
            </button>
          )}
          {canReset && (
            <button
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:bg-slate-700 text-white rounded text-sm"
            >
              {resetMutation.isPending ? 'Resetting…' : 'Reset Search'}
            </button>
          )}
        </div>
      </section>

      {/* Navigation links */}
      <section className="bg-slate-800 rounded-lg border border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Related Views
        </h3>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/searches/${id}/workflow`}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
          >
            Workflow
          </Link>
          <Link
            to={`/searches/${id}/listings`}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
          >
            Listings
          </Link>
          <Link
            to={`/searches/${id}/shortlist`}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
          >
            Shortlist
          </Link>
          <Link
            to={`/searches/${id}/approvals`}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
          >
            Approvals
          </Link>
          <Link
            to={`/searches/${id}/audit`}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
          >
            Audit Log
          </Link>
        </div>
      </section>
    </div>
  );
}
