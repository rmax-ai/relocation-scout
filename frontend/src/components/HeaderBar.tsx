import { useQuery } from '@tanstack/react-query';
import { healthApi } from '../api/health';
import { StatusBadge } from './StatusBadge';

export function HeaderBar() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.get,
    refetchInterval: 30_000,
  });

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-cyan-400 tracking-tight">
          Relocation Scout
        </h1>
        <span className="text-xs text-slate-500">Operations Console</span>
      </div>
      <div className="flex items-center gap-4 text-xs">
        {health ? (
          <>
            <StatusBadge status={health.status} />
            <span className="text-slate-400">
              Agent: <span className="text-slate-300">{health.agent_runtime}</span>
            </span>
            <span className="text-slate-400">
              DB: <span className="text-slate-300">{health.database}</span>
            </span>
            <span className="text-slate-400">
              v{health.version}
            </span>
          </>
        ) : (
          <span className="text-red-400">Backend unreachable</span>
        )}
      </div>
    </header>
  );
}
