import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '../api/listings';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export function ListingsPage() {
  const { id } = useParams<{ id: string }>();
  const [filters, setFilters] = useState({
    status: '',
    recommendation: '',
    neighbourhood: '',
    minRent: '',
    maxRent: '',
    suspicious: '',
  });

  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['listings', id, filters],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.recommendation) params.recommendation = filters.recommendation;
      if (filters.neighbourhood) params.neighbourhood = filters.neighbourhood;
      if (filters.suspicious) params.has_suspicious_content = filters.suspicious;
      return listingsApi.list(id!, Object.keys(params).length > 0 ? params : undefined);
    },
    enabled: !!id,
  });

  if (!id) {
    return <EmptyState title="No Search Selected" description="Select a search to view its listings." />;
  }

  if (isLoading) {
    return <div className="text-slate-400">Loading listings…</div>;
  }

  if (error) {
    return (
      <EmptyState
        title="Listings Unavailable"
        description={error instanceof Error ? error.message : 'Could not load listings.'}
      />
    );
  }

  const neighbourhoods = [...new Set(listings?.map((l) => l.neighbourhood).filter(Boolean))];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-100">Listings</h2>
        <span className="text-sm text-slate-500">
          {listings?.length || 0} results
        </span>
      </div>

      {/* Filters */}
      <section className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All</option>
              <option value="passed">Passed</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Recommendation</label>
            <select
              value={filters.recommendation}
              onChange={(e) => setFilters((f) => ({ ...f, recommendation: e.target.value }))}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All</option>
              <option value="recommended">Recommended</option>
              <option value="neutral">Neutral</option>
              <option value="not_recommended">Not Recommended</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Neighbourhood</label>
            <select
              value={filters.neighbourhood}
              onChange={(e) => setFilters((f) => ({ ...f, neighbourhood: e.target.value }))}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All</option>
              {neighbourhoods.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Suspicious Content</label>
            <select
              value={filters.suspicious}
              onChange={(e) => setFilters((f) => ({ ...f, suspicious: e.target.value }))}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All</option>
              <option value="true">Has Warnings</option>
              <option value="false">Clean</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Max Rent</label>
            <input
              type="number"
              value={filters.maxRent}
              onChange={(e) => setFilters((f) => ({ ...f, maxRent: e.target.value }))}
              placeholder="Any"
              className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
          {Object.values(filters).some((v) => v !== '') && (
            <button
              onClick={() => setFilters({ status: '', recommendation: '', neighbourhood: '', minRent: '', maxRent: '', suspicious: '' })}
              className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Listings table */}
      {listings && listings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs text-slate-500 uppercase">
                <th className="text-left py-3 px-3 font-medium">Title</th>
                <th className="text-left py-3 px-3 font-medium">Neighbourhood</th>
                <th className="text-right py-3 px-3 font-medium">Rent</th>
                <th className="text-center py-3 px-3 font-medium">Beds</th>
                <th className="text-right py-3 px-3 font-medium">Area</th>
                <th className="text-right py-3 px-3 font-medium">Commute</th>
                <th className="text-right py-3 px-3 font-medium">Score</th>
                <th className="text-center py-3 px-3 font-medium">Status</th>
                <th className="text-center py-3 px-3 font-medium">⚠</th>
                <th className="text-center py-3 px-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr
                  key={listing.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="text-slate-200 font-medium truncate max-w-xs">
                      {listing.title}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-xs">
                      {listing.address}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{listing.neighbourhood}</td>
                  <td className="py-3 px-3 text-right text-slate-300">
                    ${listing.rent.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-300">{listing.bedrooms}</td>
                  <td className="py-3 px-3 text-right text-slate-300">{listing.area_sqm}m²</td>
                  <td className="py-3 px-3 text-right text-slate-300">
                    {listing.commute_minutes}min
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`font-mono font-medium ${
                      listing.score >= 80
                        ? 'text-emerald-400'
                        : listing.score >= 60
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}>
                      {listing.score}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={listing.status} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    {listing.has_suspicious_content ? (
                      <span className="text-red-400 text-lg" title={listing.suspicious_content_types?.join(', ')}>
                        ⚠
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Link
                      to={`/searches/${id}/listings/${listing.id}`}
                      className="text-cyan-400 hover:text-cyan-300 text-xs"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No Listings Found"
          description="No listings match the current filters or the search hasn't processed listings yet."
        />
      )}
    </div>
  );
}
