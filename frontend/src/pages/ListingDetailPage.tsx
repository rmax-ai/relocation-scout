import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '../api/listings';
import { EmptyState } from '../components/EmptyState';

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color =
    pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 w-32 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-300 w-8 text-right">{value}</span>
    </div>
  );
}

export function ListingDetailPage() {
  const { id, listingId } = useParams<{ id: string; listingId: string }>();

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', id, listingId],
    queryFn: () => listingsApi.get(id!, listingId!),
    enabled: !!id && !!listingId,
  });

  if (isLoading) {
    return <div className="text-slate-400">Loading listing…</div>;
  }

  if (error || !listing) {
    return (
      <EmptyState
        title="Listing Not Found"
        description={error instanceof Error ? error.message : 'Could not load listing details.'}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link
          to={`/searches/${id}/listings`}
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          ← Back to Listings
        </Link>
      </div>

      <h2 className="text-xl font-bold text-slate-100 mb-1">{listing.title}</h2>
      <p className="text-sm text-slate-500 mb-6">
        <code className="text-cyan-400">{listing.id}</code> — {listing.address}
      </p>

      {/* Suspicious content warning */}
      {listing.prompt_injection_warning && (
        <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-400 text-lg">⚠</span>
            <div>
              <p className="text-sm font-medium text-red-300">Untrusted Content Warning</p>
              <p className="text-xs text-red-400 mt-1">{listing.prompt_injection_warning}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Left column: Core fields */}
        <div>
          <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Core Fields
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Rent</span>
                <span className="text-slate-200 font-mono">${listing.rent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bedrooms</span>
                <span className="text-slate-200">{listing.bedrooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Area</span>
                <span className="text-slate-200">{listing.area_sqm} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Commute</span>
                <span className="text-slate-200">{listing.commute_minutes} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Neighbourhood</span>
                <span className="text-slate-200">{listing.neighbourhood}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recommendation</span>
                <span className="text-slate-200">{listing.recommendation}</span>
              </div>
            </div>
          </section>

          {/* Score breakdown */}
          <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Score Breakdown
            </h3>
            <div className="space-y-3">
              <ScoreBar label="Overall" value={listing.score} />
              {listing.score_breakdown && (
                <>
                  <ScoreBar label="Commute" value={listing.score_breakdown.commute} />
                  <ScoreBar label="Affordability" value={listing.score_breakdown.affordability} />
                  <ScoreBar label="Neighbourhood Fit" value={listing.score_breakdown.neighbourhood_fit} />
                  <ScoreBar label="Transport" value={listing.score_breakdown.transport} />
                  <ScoreBar label="Quiet" value={listing.score_breakdown.quiet} />
                  <ScoreBar label="Green Space" value={listing.score_breakdown.green_space} />
                  {listing.score_breakdown.breakdown &&
                    Object.entries(listing.score_breakdown.breakdown)
                      .filter(([key]) => !['commute', 'affordability', 'neighbourhood_fit', 'transport', 'quiet', 'green_space', 'overall'].includes(key))
                      .map(([key, val]) => (
                        <ScoreBar key={key} label={key.replace(/_/g, ' ')} value={val as number} />
                      ))}
                </>
              )}
            </div>
          </section>

          {/* Strengths & Concerns */}
          <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Analysis
            </h3>
            {listing.strengths && listing.strengths.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs text-emerald-400 font-medium mb-1">Strengths</h4>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-0.5">
                  {listing.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {listing.concerns && listing.concerns.length > 0 && (
              <div>
                <h4 className="text-xs text-red-400 font-medium mb-1">Concerns</h4>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-0.5">
                  {listing.concerns.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        {/* Right column: Raw data */}
        <div>
          {/* Description - mark as untrusted */}
          <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Description
              </h3>
              <span className="px-1.5 py-0.5 bg-red-900/50 text-red-300 text-xs rounded">
                UNTRUSTED
              </span>
            </div>
            <div className="p-3 bg-red-950/20 border border-red-900/40 rounded text-sm text-slate-300 whitespace-pre-wrap font-mono text-xs">
              {listing.description || 'No description available'}
            </div>
          </section>

          {/* Source fields */}
          {listing.source_fields && Object.keys(listing.source_fields).length > 0 && (
            <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Source Fields
              </h3>
              <div className="space-y-1 text-xs font-mono">
                {Object.entries(listing.source_fields).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-500">{key}</span>
                    <span className="text-slate-300 truncate max-w-[200px]" title={String(val)}>
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Normalized fields */}
          {listing.normalized_fields && Object.keys(listing.normalized_fields).length > 0 && (
            <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Normalized Fields
              </h3>
              <div className="space-y-1 text-xs font-mono">
                {Object.entries(listing.normalized_fields).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-500">{key}</span>
                    <span className="text-slate-300 truncate max-w-[200px]" title={String(val)}>
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Provenance */}
          <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Provenance
            </h3>
            <p className="text-sm text-slate-300 font-mono text-xs">{listing.provenance}</p>
            {listing.url && (
              <p className="mt-2 text-xs">
                <span className="text-slate-500">URL:</span>{' '}
                <span className="text-cyan-400 break-all">{listing.url}</span>
              </p>
            )}
            <p className="mt-1 text-xs">
              <span className="text-slate-500">Provider:</span>{' '}
              <span className="text-slate-300">{listing.provider}</span>
            </p>
          </section>

          {/* Neighbourhood evidence */}
          {listing.neighbourhood_evidence && Object.keys(listing.neighbourhood_evidence).length > 0 && (
            <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Neighbourhood Evidence
              </h3>
              <div className="space-y-1 text-xs font-mono">
                {Object.entries(listing.neighbourhood_evidence).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-500">{key}</span>
                    <span className="text-slate-300 truncate max-w-[200px]" title={String(val)}>
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
