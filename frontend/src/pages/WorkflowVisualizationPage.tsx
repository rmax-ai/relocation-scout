import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workflowApi } from '../api/workflow';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import type { WorkflowStep, StepCategory } from '../types';

function StepIcon({ category }: { category: StepCategory }) {
  const styles: Record<StepCategory, { bg: string; label: string }> = {
    code: { bg: 'bg-blue-600', label: 'CODE' },
    agent: { bg: 'bg-purple-600', label: 'AGNT' },
    human: { bg: 'bg-amber-600', label: 'HUMN' },
  };
  const s = styles[category];
  return (
    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${s.bg} text-white text-xs font-bold shrink-0`}>
      {s.label}
    </span>
  );
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function formatDateTime(ts: string | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

function StepCard({ step, isActive }: { step: WorkflowStep; isActive: boolean }) {
  return (
    <div className={`relative flex gap-4 p-4 rounded-lg border transition-colors ${
      isActive
        ? 'bg-cyan-900/20 border-cyan-600'
        : step.status === 'completed'
        ? 'bg-slate-800/50 border-slate-700'
        : step.status === 'failed'
        ? 'bg-red-900/20 border-red-700'
        : step.status === 'skipped'
        ? 'bg-slate-800/30 border-slate-700/50'
        : 'bg-slate-800 border-slate-700'
    }`}>
      {/* Step number */}
      <div className="flex flex-col items-center">
        <StepIcon category={step.category} />
        <div className="flex-1 w-px bg-slate-700 my-2" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-mono font-medium text-slate-200">
            {step.name}
          </span>
          <StatusBadge status={step.status} />
          {isActive && (
            <span className="text-xs text-cyan-400 animate-pulse">● active</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400 mt-2">
          <div>
            Started: <span className="text-slate-300">{formatDateTime(step.started_at)}</span>
          </div>
          <div>
            Completed: <span className="text-slate-300">{formatDateTime(step.completed_at)}</span>
          </div>
          <div>
            Duration: <span className="text-slate-300">{formatDuration(step.duration_seconds)}</span>
          </div>
          <div>
            Retries: <span className="text-slate-300">{step.retry_count}</span>
          </div>
          <div className="col-span-2">
            Category: <span className="text-slate-300 uppercase">{step.category}</span>
          </div>
        </div>

        {step.failure_message && (
          <div className="mt-2 p-2 bg-red-900/30 border border-red-800 rounded text-xs text-red-300 font-mono">
            {step.failure_message}
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkflowVisualizationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: workflow, isLoading, error } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowApi.get(id!),
    enabled: !!id,
    refetchInterval: 5_000,
  });

  if (!id) {
    return <EmptyState title="No Search Selected" description="Select a search to view its workflow." />;
  }

  if (isLoading) {
    return <div className="text-slate-400">Loading workflow…</div>;
  }

  if (error) {
    return (
      <EmptyState
        title="Workflow Unavailable"
        description={error instanceof Error ? error.message : 'Could not load workflow.'}
      />
    );
  }

  if (!workflow) {
    return <EmptyState title="No Workflow Data" description="The search may not have started yet." />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Workflow</h2>
          <p className="text-sm text-slate-500">
            Search: <code className="text-cyan-400">{workflow.search_id}</code>
          </p>
        </div>
        <StatusBadge status={workflow.status} />
      </div>

      {/* Progress */}
      <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-slate-700 rounded-full h-2.5">
            <div
              className="bg-cyan-500 h-2.5 rounded-full transition-all"
              style={{ width: `${workflow.progress_percentage}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-300">
            {workflow.progress_percentage}%
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Current step: <span className="text-cyan-400 font-mono">{workflow.current_step || '—'}</span>
        </div>
      </section>

      {/* Step timeline */}
      <div className="space-y-3">
        {workflow.steps.map((step) => (
          <StepCard
            key={step.name}
            step={step}
            isActive={step.name === workflow.current_step && step.status === 'running'}
          />
        ))}
      </div>
    </div>
  );
}
