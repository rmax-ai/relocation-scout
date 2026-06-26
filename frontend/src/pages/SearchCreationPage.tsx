import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { searchesApi } from '../api/searches';
import type { SearchPreferences } from '../types';

const defaultPreferences: SearchPreferences = {
  max_rent: 2000,
  min_bedrooms: 2,
  min_area: 50,
  commute_destination: '',
  max_commute_minutes: 45,
  preferred_neighbourhoods: [],
  excluded_neighbourhoods: [],
  priorities: {
    quiet: 25,
    transport: 25,
    green_space: 25,
    affordability: 25,
  },
  preferences_text: '',
};

function validatePriorities(p: SearchPreferences['priorities']): boolean {
  const total = p.quiet + p.transport + p.green_space + p.affordability;
  return total === 100;
}

export function SearchCreationPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('Amsterdam rental search');
  const [form, setForm] = useState<SearchPreferences>(defaultPreferences);
  const [nameError, setNameError] = useState('');
  const [priorityError, setPriorityError] = useState('');
  const [preferredInput, setPreferredInput] = useState('');
  const [excludedInput, setExcludedInput] = useState('');

  const createMutation = useMutation({
    mutationFn: () => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setNameError('Search name is required');
        throw new Error('Invalid search name');
      }
      if (!validatePriorities(form.priorities)) {
        setPriorityError('Priority weights must sum to 100%');
        throw new Error('Invalid priorities');
      }
      return searchesApi.create({ name: trimmedName, preferences: form });
    },
    onSuccess: (search) => {
      navigate(`/searches/${search.id}`);
    },
  });

  const createAndStartMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setNameError('Search name is required');
        throw new Error('Invalid search name');
      }
      if (!validatePriorities(form.priorities)) {
        setPriorityError('Priority weights must sum to 100%');
        throw new Error('Invalid priorities');
      }
      const search = await searchesApi.create({ name: trimmedName, preferences: form });
      await searchesApi.start(search.id);
      return search;
    },
    onSuccess: (search) => {
      navigate(`/searches/${search.id}`);
    },
  });

  const updatePriorities = (field: keyof SearchPreferences['priorities'], value: number) => {
    setPriorityError('');
    setForm((prev) => ({
      ...prev,
      priorities: { ...prev.priorities, [field]: value },
    }));
  };

  const addPreferred = () => {
    const val = preferredInput.trim();
    if (val && !form.preferred_neighbourhoods.includes(val)) {
      setForm((prev) => ({
        ...prev,
        preferred_neighbourhoods: [...prev.preferred_neighbourhoods, val],
      }));
    }
    setPreferredInput('');
  };

  const addExcluded = () => {
    const val = excludedInput.trim();
    if (val && !form.excluded_neighbourhoods.includes(val)) {
      setForm((prev) => ({
        ...prev,
        excluded_neighbourhoods: [...prev.excluded_neighbourhoods, val],
      }));
    }
    setExcludedInput('');
  };

  const removePreferred = (n: string) => {
    setForm((prev) => ({
      ...prev,
      preferred_neighbourhoods: prev.preferred_neighbourhoods.filter((x) => x !== n),
    }));
  };

  const removeExcluded = (n: string) => {
    setForm((prev) => ({
      ...prev,
      excluded_neighbourhoods: prev.excluded_neighbourhoods.filter((x) => x !== n),
    }));
  };

  const totalPriorities =
    form.priorities.quiet +
    form.priorities.transport +
    form.priorities.green_space +
    form.priorities.affordability;

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-slate-100 mb-6">Create New Search</h2>

      <div className="space-y-6">
        <section className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Search Name
          </h3>
          {nameError && <p className="text-xs text-red-400 mb-3">{nameError}</p>}
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setNameError('');
              setName(e.target.value);
            }}
            placeholder="e.g. Amsterdam rental search"
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </section>

        {/* Budget & Requirements */}
        <section className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Requirements
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max Rent ($)</label>
              <input
                type="number"
                value={form.max_rent}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, max_rent: Number(e.target.value) }))
                }
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Min Bedrooms</label>
              <input
                type="number"
                value={form.min_bedrooms}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, min_bedrooms: Number(e.target.value) }))
                }
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Min Area (m²)</label>
              <input
                type="number"
                value={form.min_area}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, min_area: Number(e.target.value) }))
                }
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </section>

        {/* Commute */}
        <section className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Commute
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Destination</label>
              <input
                type="text"
                value={form.commute_destination}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, commute_destination: e.target.value }))
                }
                placeholder="e.g. Downtown, 123 Main St"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max Commute (minutes)</label>
              <input
                type="number"
                value={form.max_commute_minutes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, max_commute_minutes: Number(e.target.value) }))
                }
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </section>

        {/* Neighbourhoods */}
        <section className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Neighbourhoods
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Preferred</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={preferredInput}
                  onChange={(e) => setPreferredInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPreferred())}
                  placeholder="Add neighbourhood..."
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={addPreferred}
                  className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-sm"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.preferred_neighbourhoods.map((n) => (
                  <span
                    key={n}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-900/40 text-emerald-300 rounded text-xs"
                  >
                    {n}
                    <button onClick={() => removePreferred(n)} className="text-emerald-400 hover:text-emerald-200">&times;</button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Excluded</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={excludedInput}
                  onChange={(e) => setExcludedInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExcluded())}
                  placeholder="Add neighbourhood..."
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={addExcluded}
                  className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded text-sm"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.excluded_neighbourhoods.map((n) => (
                  <span
                    key={n}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-900/40 text-red-300 rounded text-xs"
                  >
                    {n}
                    <button onClick={() => removeExcluded(n)} className="text-red-400 hover:text-red-200">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Priority Weights */}
        <section className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Priority Weights
            <span className={`ml-2 text-xs font-normal ${totalPriorities === 100 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalPriorities}%
            </span>
          </h3>
          {priorityError && (
            <p className="text-xs text-red-400 mb-3">{priorityError}</p>
          )}
          <div className="space-y-3">
            {(['quiet', 'transport', 'green_space', 'affordability'] as const).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-28 text-sm text-slate-300 capitalize">
                  {key.replace('_', ' ')}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.priorities[key]}
                  onChange={(e) => updatePriorities(key, Number(e.target.value))}
                  className="flex-1 h-2 rounded appearance-none bg-slate-600 accent-cyan-500"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.priorities[key]}
                  onChange={(e) => updatePriorities(key, Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 text-right focus:outline-none focus:border-cyan-500"
                />
                <span className="text-xs text-slate-500 w-5">%</span>
              </div>
            ))}
          </div>
        </section>

        {/* Free-text preferences */}
        <section className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Additional Preferences
          </h3>
          <textarea
            value={form.preferences_text}
            onChange={(e) => setForm((prev) => ({ ...prev, preferences_text: e.target.value }))}
            placeholder="e.g. I prefer quiet streets near parks, need good transit access..."
            rows={4}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 resize-y"
          />
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => createAndStartMutation.mutate()}
            disabled={createAndStartMutation.isPending}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-md text-sm font-medium transition-colors"
          >
            {createAndStartMutation.isPending ? 'Creating…' : 'Create and Start Search'}
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:text-slate-500 text-slate-200 rounded-md text-sm font-medium transition-colors"
          >
            {createMutation.isPending ? 'Creating…' : 'Create Only'}
          </button>
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-400">
            Error: {createMutation.error?.message}
          </p>
        )}
        {createAndStartMutation.isError && (
          <p className="text-sm text-red-400">
            Error: {createAndStartMutation.error?.message}
          </p>
        )}
      </div>
    </div>
  );
}
