import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '../api/listings';
import { EmptyState } from '../components/EmptyState';

export function ShortlistPage() {
  const { id } = useParams<{ id: string }>();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');

  const { data: shortlist, isLoading, error } = useQuery({
    queryKey: ['shortlist', id],
    queryFn: () => listingsApi.shortlist(id!),
    enabled: !!id,
  });

  if (!id) {
    return <EmptyState title="No Search Selected" description="Select a search to view its shortlist." />;
  }

  if (isLoading) {
    return <div className="text-slate-400">Loading shortlist…</div>;
  }

  if (error) {
    return (
      <EmptyState
        title="Shortlist Unavailable"
        description={error instanceof Error ? error.message : 'Could not load shortlist.'}
      />
    );
  }

  if (!shortlist || shortlist.length === 0) {
    return (
      <EmptyState
        title="No Shortlist"
        description="The shortlist is empty. Run a search to generate recommendations."
        action={{ label: 'View Listings', onClick: () => window.location.href = `/searches/${id}/listings` }}
      />
    );
  }

  const toggleCompare = (listingId: string) => {
    setCompareIds((prev) =>
      prev.includes(listingId)
        ? prev.filter((x) => x !== listingId)
        : [...prev, listingId],
    );
  };

  const selectedEntries = shortlist.filter((e) => compareIds.includes(e.listing_id));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Shortlist</h2>
          <p className="text-sm text-slate-500">
            {shortlist.length} {shortlist.length === 1 ? 'recommendation' : 'recommendations'}
          </p>
        </div>
        <div className="flex gap-2">
          {shortlist.length >= 2 && (
            <button
              onClick={() => {
                if (viewMode === 'list') {
                  setViewMode('compare');
                  if (compareIds.length < 2) {
                    setCompareIds(shortlist.slice(0, 2).map((e) => e.listing_id));
                  }
                } else {
                  setViewMode('list');
                }
              }}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs"
            >
              {viewMode === 'list' ? 'Compare View' : 'List View'}
            </button>
          )}
          <button
            onClick={() => {
              const msg = shortlist
                .filter((e) => compareIds.length > 0 ? compareIds.includes(e.listing_id) : true)
                .map((e) => `${e.listing.title} — $${e.listing.rent}/mo, ${e.listing.bedrooms}br, score: ${e.score}`)
                .join('\n');
              alert(`Realtor message draft:\n\nI'm interested in the following properties:\n${msg}\n\nPlease provide more information.`);
            }}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs"
          >
            Generate Realtor Message
          </button>
        </div>
      </div>

      {viewMode === 'compare' && selectedEntries.length >= 2 ? (
        /* Comparison view */
        <div className="grid grid-cols-2 gap-4">
          {selectedEntries.map((entry) => (
            <div key={entry.listing_id} className="bg-slate-800 rounded-lg border border-slate-700 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-slate-200">{entry.listing.title}</h3>
                  <p className="text-xs text-slate-500">{entry.listing.address}</p>
                </div>
                <span className="text-lg font-bold text-cyan-400">{entry.listing.score}</span>
              </div>
              <div className="text-xs text-slate-500 mb-2">Rank #{entry.rank}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rent</span>
                  <span className="text-slate-300">${entry.listing.rent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bedrooms</span>
                  <span className="text-slate-300">{entry.listing.bedrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Commute</span>
                  <span className="text-slate-300">{entry.listing.commute_minutes} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Commute Rating</span>
                  <span className="text-slate-300">{entry.commute_rating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Affordability</span>
                  <span className="text-slate-300">{entry.affordability_rating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Neighbourhood</span>
                  <span className="text-slate-300">{entry.neighbourhood_fit_rating}</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">{entry.explanation}</p>
              {entry.evidence_links && entry.evidence_links.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-slate-500">Evidence:</span>
                  <ul className="list-disc list-inside text-xs text-cyan-400">
                    {entry.evidence_links.map((link, i) => (
                      <li key={i} className="truncate">{link}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="space-y-3">
          {shortlist.map((entry) => (
            <div
              key={entry.listing_id}
              className="bg-slate-800 rounded-lg border border-slate-700 p-5 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">#{entry.rank}</span>
                    <h3 className="font-medium text-slate-200 truncate">
                      {entry.listing.title}
                    </h3>
                    <Link
                      to={`/searches/${id}/listings/${entry.listing_id}`}
                      className="text-xs text-cyan-400 hover:text-cyan-300 shrink-0"
                    >
                      Details
                    </Link>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {entry.listing.address} · {entry.listing.neighbourhood}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-lg font-bold text-cyan-400">{entry.listing.score}</div>
                  <div className="text-xs text-slate-500">
                    ${entry.listing.rent.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
                <div>
                  <span className="text-slate-500">Commute:</span>{' '}
                  <span className="text-slate-300">{entry.listing.commute_minutes}min</span>
                  <span className="text-slate-500 ml-1">({entry.commute_rating})</span>
                </div>
                <div>
                  <span className="text-slate-500">Affordability:</span>{' '}
                  <span className="text-slate-300">{entry.affordability_rating}</span>
                </div>
                <div>
                  <span className="text-slate-500">Neighbourhood:</span>{' '}
                  <span className="text-slate-300">{entry.neighbourhood_fit_rating}</span>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-400">{entry.explanation}</p>

              {entry.evidence_links && entry.evidence_links.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                    Evidence ({entry.evidence_links.length})
                  </summary>
                  <ul className="mt-1 space-y-0.5">
                    {entry.evidence_links.map((link, i) => (
                      <li key={i} className="text-xs text-cyan-400 truncate">{link}</li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="mt-3 flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(entry.listing_id)}
                    onChange={() => toggleCompare(entry.listing_id)}
                    className="rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  Compare
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'list' && compareIds.length >= 2 && (
        <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700 text-center">
          <button
            onClick={() => setViewMode('compare')}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm"
          >
            Compare {compareIds.length} Selected
          </button>
        </div>
      )}
    </div>
  );
}
