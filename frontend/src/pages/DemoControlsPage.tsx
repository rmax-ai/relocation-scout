import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { demoApi } from '../api/demo';
import type { DemoFailures } from '../types';

const failureFields: { key: keyof DemoFailures; label: string }[] = [
  { key: 'malformed_agent_output', label: 'Malformed Agent Output' },
  { key: 'neighbourhood_agent_failure', label: 'Neighbourhood Agent Failure' },
  { key: 'commute_timeout', label: 'Commute Timeout' },
  { key: 'crash_before_email_send', label: 'Crash Before Email Send' },
  { key: 'crash_after_email_send', label: 'Crash After Email Send' },
  { key: 'duplicate_workflow_steps', label: 'Duplicate Workflow Steps' },
  { key: 'prompt_injection_fixture', label: 'Prompt Injection Fixture' },
];

export function DemoControlsPage() {
  const queryClient = useQueryClient();

  const { data: failures, isLoading } = useQuery({
    queryKey: ['demo-failures'],
    queryFn: demoApi.getFailures,
    refetchInterval: 10_000,
  });

  const seedMutation = useMutation({
    mutationFn: demoApi.seed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searches-list'] });
      queryClient.invalidateQueries({ queryKey: ['demo-failures'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: demoApi.reset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searches-list'] });
      queryClient.invalidateQueries({ queryKey: ['demo-failures'] });
    },
  });

  const setFailuresMutation = useMutation({
    mutationFn: (failures: Partial<DemoFailures>) => demoApi.setFailures(failures),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-failures'] });
    },
  });

  const toggleFailure = (key: keyof DemoFailures, currentValue: boolean) => {
    setFailuresMutation.mutate({ [key]: !currentValue });
  };

  if (isLoading) {
    return <div className="text-slate-400">Loading demo controls…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-slate-100 mb-6">Demo Controls</h2>

      {/* Data Management */}
      <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Data Management
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded text-sm transition-colors"
          >
            {seedMutation.isPending ? 'Seeding…' : 'Seed Demo Data'}
          </button>
          <button
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded text-sm transition-colors"
          >
            {resetMutation.isPending ? 'Resetting…' : 'Reset Demo'}
          </button>
        </div>
      </section>

      {/* Failure Injection */}
      <section className="bg-slate-800 rounded-lg border border-slate-700 p-5 mb-6">
        <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4">
          Failure Injection
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Toggle failure modes to test system resilience. These are applied during the next workflow execution.
        </p>
        <div className="space-y-2">
          {failureFields.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-700"
            >
              <span className="text-sm text-slate-300">{label}</span>
              <button
                onClick={() => toggleFailure(key, failures?.[key] ?? false)}
                disabled={setFailuresMutation.isPending}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  failures?.[key]
                    ? 'bg-red-600'
                    : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    failures?.[key] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Status Summary */}
      <section className="bg-slate-800 rounded-lg border border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Active Failures
        </h3>
        {failures && Object.values(failures).some((v) => v) ? (
          <ul className="space-y-1">
            {failureFields
              .filter(({ key }) => failures[key])
              .map(({ key, label }) => (
                <li key={key} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  <span className="text-red-300">{label}</span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No failure modes are currently active.</p>
        )}
      </section>

      {seedMutation.isError && (
        <p className="mt-4 text-sm text-red-400">
          Error seeding data: {seedMutation.error?.message}
        </p>
      )}
      {resetMutation.isError && (
        <p className="mt-4 text-sm text-red-400">
          Error resetting: {resetMutation.error?.message}
        </p>
      )}
    </div>
  );
}
