import type { SearchStatus, StepStatus, ActionStatus } from '../types';

const statusColors: Record<string, string> = {
  created: 'bg-slate-600 text-slate-200',
  running: 'bg-blue-600 text-white',
  paused: 'bg-amber-600 text-white',
  completed: 'bg-emerald-600 text-white',
  failed: 'bg-red-600 text-white',
  waiting_approval: 'bg-purple-600 text-white',
  pending: 'bg-slate-700 text-slate-300',
  approved: 'bg-emerald-600 text-white',
  rejected: 'bg-red-600 text-white',
  executing: 'bg-blue-600 text-white',
  draft: 'bg-slate-600 text-slate-200',
  skipped: 'bg-slate-700 text-slate-400',
};

interface StatusBadgeProps {
  status: SearchStatus | StepStatus | ActionStatus | string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const color = statusColors[status] || 'bg-slate-700 text-slate-300';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {label || status.replace(/_/g, ' ')}
    </span>
  );
}
