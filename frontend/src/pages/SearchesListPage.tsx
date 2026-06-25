import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchesApi } from '../api/searches';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export function SearchesListPage() {
  const navigate = useNavigate();
  const { data: searches, isLoading, error } = useQuery({
    queryKey: ['searches-list'],
    queryFn: searchesApi.list,
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return <div className="text-slate-400">Loading searches…</div>;
  }

  if (error) {
    return (
      <EmptyState
        title="Searches Unavailable"
        description={error instanceof Error ? error.message : 'Could not load searches.'}
      />
    );
  }

  if (!searches || searches.length === 0) {
    return (
      <EmptyState
        title="No Searches"
        description="Create your first search to get started."
        action={{ label: 'Create New Search', onClick: () => navigate('/') }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-100">Searches</h2>
        <Link
          to="/"
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-sm font-medium transition-colors"
        >
          New Search
        </Link>
      </div>

      <div className="space-y-3">
        {searches.map((search) => (
          <Link
            key={search.id}
            to={`/searches/${search.id}`}
            className="block bg-slate-800 rounded-lg border border-slate-700 p-5 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-slate-200">{search.name}</h3>
              <StatusBadge status={search.status} />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <code className="text-cyan-400">{search.id.slice(0, 12)}…</code>
              <span>
                Step: <span className="text-slate-400">{search.current_step || '—'}</span>
              </span>
              <span>
                Progress: <span className="text-slate-400">{search.progress_percentage}%</span>
              </span>
              <span>
                {new Date(search.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-cyan-500 h-1.5 rounded-full"
                style={{ width: `${search.progress_percentage}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
