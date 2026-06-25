import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/audit';
import { EmptyState } from '../components/EmptyState';
import type { AuditActor } from '../types';

const actorColors: Record<AuditActor, string> = {
  system: 'text-blue-400',
  deterministic: 'text-emerald-400',
  agent: 'text-purple-400',
  human: 'text-amber-400',
  tool: 'text-red-400',
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function AuditLogPage() {
  const { id } = useParams<{ id: string }>();
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['audit', id, eventTypeFilter, actorFilter],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (eventTypeFilter) params.event_type = eventTypeFilter;
      if (actorFilter) params.actor = actorFilter;
      return auditApi.list(id!, Object.keys(params).length > 0 ? params : undefined);
    },
    enabled: !!id,
    refetchInterval: 10_000,
  });

  const { data: auditExport } = useQuery({
    queryKey: ['audit-export', id],
    queryFn: () => auditApi.export(id!),
    enabled: !!id,
  });

  if (!id) {
    return <EmptyState title="No Search Selected" description="Select a search to view its audit log." />;
  }

  if (isLoading) {
    return <div className="text-slate-400">Loading audit log…</div>;
  }

  if (error) {
    return (
      <EmptyState
        title="Audit Log Unavailable"
        description={error instanceof Error ? error.message : 'Could not load audit log.'}
      />
    );
  }

  const eventTypes = events ? [...new Set(events.map((e) => e.event_type))] : [];
  const actors = events ? [...new Set(events.map((e) => e.actor))] : [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-100">Audit Log</h2>
        {auditExport && (
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{auditExport.total} events</span>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(auditExport, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-${id}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs"
            >
              Export JSON
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <section className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Event Type</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All</option>
              {eventTypes.map((et) => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Actor</label>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All</option>
              {actors.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          {(eventTypeFilter || actorFilter) && (
            <button
              onClick={() => { setEventTypeFilter(''); setActorFilter(''); }}
              className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Event stream */}
      {events && events.length > 0 ? (
        <div className="space-y-1">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex gap-4 p-3 bg-slate-800/50 hover:bg-slate-800 border-b border-slate-800 text-sm transition-colors"
            >
              <div className="text-xs text-slate-500 font-mono shrink-0 w-36 text-right">
                {formatTimestamp(event.timestamp)}
              </div>
              <div className="text-xs font-mono" style={{ color: actorColors[event.actor] || 'text-slate-400' }}>
                [{event.actor.toUpperCase()}]
              </div>
              <div className="text-xs text-slate-500 font-mono w-28 shrink-0">
                {event.event_type}
              </div>
              <div className="text-xs text-slate-500 font-mono w-24 shrink-0">
                {event.workflow_step || '—'}
              </div>
              <div className="text-xs text-slate-300 flex-1">
                {event.message}
              </div>
              {event.entity_id && (
                <div className="text-xs text-slate-600 font-mono shrink-0 max-w-[120px] truncate" title={event.entity_id}>
                  {event.entity_type}:{event.entity_id.slice(0, 12)}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Audit Events"
          description="No audit events recorded yet."
        />
      )}
    </div>
  );
}
