import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { actionsApi } from '../api/actions';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import type { Action, ActionStatus } from '../types';

function ActionTimeline({ action }: { action: Action }) {
  const steps: { status: ActionStatus; label: string; time: string | null }[] = [
    { status: 'draft', label: 'Draft', time: action.created_at },
    { status: 'pending', label: 'Pending', time: action.created_at },
    { status: 'approved', label: 'Approved', time: action.approved_at },
    { status: 'executing', label: 'Executing', time: action.executed_at },
    { status: 'completed', label: 'Completed', time: action.executed_at },
  ];

  const currentIndex = steps.findIndex((s) => s.status === action.status);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="flex items-center gap-1 text-xs">
      {steps.map((step, i) => {
        const isActive = i <= activeIndex && step.time;
        const isCurrent = step.status === action.status;
        return (
          <div key={step.status} className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full ${
                isCurrent
                  ? 'bg-cyan-400 ring-2 ring-cyan-400/30'
                  : isActive
                  ? 'bg-slate-500'
                  : 'bg-slate-700'
              }`}
            />
            {i < steps.length - 1 && (
              <div
                className={`w-6 h-px ${
                  i < activeIndex ? 'bg-slate-500' : 'bg-slate-700'
                }`}
              />
            )}
          </div>
        );
      })}
      <span className="ml-2 text-slate-400">{action.status.replace(/_/g, ' ')}</span>
    </div>
  );
}

export function ApprovalInboxPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editSubject, setEditSubject] = useState('');

  const { data: actions, isLoading, error } = useQuery({
    queryKey: ['actions', id],
    queryFn: () => actionsApi.list(id!),
    enabled: !!id,
    refetchInterval: 10_000,
  });

  const approveMutation = useMutation({
    mutationFn: (actionId: string) => actionsApi.approve(actionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actions', id] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (actionId: string) => actionsApi.reject(actionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actions', id] }),
  });

  const executeMutation = useMutation({
    mutationFn: (actionId: string) => actionsApi.execute(actionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actions', id] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ actionId, data }: { actionId: string; data: Record<string, unknown> }) =>
      actionsApi.update(actionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions', id] });
      setEditingId(null);
    },
  });

  if (!id) {
    return <EmptyState title="No Search Selected" description="Select a search to view its approval inbox." />;
  }

  if (isLoading) {
    return <div className="text-slate-400">Loading actions…</div>;
  }

  if (error) {
    return (
      <EmptyState
        title="Actions Unavailable"
        description={error instanceof Error ? error.message : 'Could not load actions.'}
      />
    );
  }

  if (!actions || actions.length === 0) {
    return (
      <EmptyState
        title="No Pending Actions"
        description="The approval inbox is empty. No actions require review yet."
      />
    );
  }

  const pendingActions = actions.filter((a) => a.status === 'pending');
  const otherActions = actions.filter((a) => a.status !== 'pending');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-100">
          Approval Inbox
          {pendingActions.length > 0 && (
            <span className="ml-2 text-sm font-normal text-amber-400">
              ({pendingActions.length} pending)
            </span>
          )}
        </h2>
        <span className="text-sm text-slate-500">{actions.length} total</span>
      </div>

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
            Pending Review
          </h3>
          <div className="space-y-4">
            {pendingActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onApprove={() => approveMutation.mutate(action.id)}
                onReject={() => rejectMutation.mutate(action.id)}
                onEdit={() => {
                  setEditingId(action.id);
                  setEditBody(action.body);
                  setEditSubject(action.subject);
                }}
                isEditing={editingId === action.id}
                editBody={editBody}
                editSubject={editSubject}
                setEditBody={setEditBody}
                setEditSubject={setEditSubject}
                onSave={() =>
                  updateMutation.mutate({
                    actionId: action.id,
                    data: { body: editBody, subject: editSubject },
                  })
                }
                onCancelEdit={() => setEditingId(null)}
                isPending={approveMutation.isPending || rejectMutation.isPending}
              />
            ))}
          </div>
        </section>
      )}

      {/* History */}
      {otherActions.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            History
          </h3>
          <div className="space-y-3">
            {otherActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onExecute={() => executeMutation.mutate(action.id)}
                compact
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

interface ActionCardProps {
  action: Action;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onExecute?: () => void;
  onSave?: () => void;
  onCancelEdit?: () => void;
  isEditing?: boolean;
  editBody?: string;
  editSubject?: string;
  setEditBody?: (v: string) => void;
  setEditSubject?: (v: string) => void;
  isPending?: boolean;
  compact?: boolean;
}

function ActionCard({ action, onApprove, onReject, onEdit, onExecute, onSave, onCancelEdit, isEditing, editBody, editSubject, setEditBody, setEditSubject, isPending, compact }: ActionCardProps) {
  const riskColor = action.risk_level === 'high' ? 'text-red-400' : action.risk_level === 'medium' ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className={`bg-slate-800 rounded-lg border border-slate-700 p-5 ${!compact ? 'border-l-2 border-l-cyan-600' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge status={action.status} />
            <span className="text-sm font-mono text-slate-300">{action.action_type.replace(/_/g, ' ')}</span>
            <span className={`text-xs font-medium ${riskColor}`}>
              {action.risk_level.toUpperCase()} RISK
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Listing: <span className="text-slate-400">{action.listing_title}</span>
          </p>
        </div>
        {!compact && (
          <ActionTimeline action={action} />
        )}
      </div>

      <div className="text-sm mb-2">
        <div className="text-slate-500 text-xs">To: <span className="text-slate-300">{action.recipient}</span></div>
        <div className="text-slate-500 text-xs">Subject: <span className="text-slate-300">{action.subject}</span></div>
      </div>

      {/* Body - editable if editing */}
      {isEditing ? (
        <div className="space-y-2 mb-3">
          <input
            type="text"
            value={editSubject}
            onChange={(e) => setEditSubject?.(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            placeholder="Subject"
          />
          <textarea
            value={editBody}
            onChange={(e) => setEditBody?.(e.target.value)}
            rows={4}
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          />
          <div className="flex gap-2">
            <button onClick={onSave} className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs">Save</button>
            <button onClick={onCancelEdit} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-900/50 rounded text-xs font-mono text-slate-400 mb-3 max-h-24 overflow-y-auto">
          {action.body}
        </div>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-3">
        <div>
          Payload hash: <code className="text-slate-400">{action.payload_hash.slice(0, 16)}…</code>
        </div>
        <div>
          Idempotency key: <code className="text-slate-400">{action.idempotency_key.slice(0, 24)}…</code>
        </div>
      </div>

      {/* Actions */}
      {!compact && onApprove && onReject && (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={isPending}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded text-xs"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            disabled={isPending}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white rounded text-xs"
          >
            Reject
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs"
            >
              Edit
            </button>
          )}
        </div>
      )}

      {onExecute && action.status === 'approved' && (
        <button
          onClick={onExecute}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs"
        >
          Execute
        </button>
      )}

      {action.failure_reason && (
        <div className="mt-2 p-2 bg-red-900/30 border border-red-800 rounded text-xs text-red-300">
          {action.failure_reason}
        </div>
      )}
    </div>
  );
}
