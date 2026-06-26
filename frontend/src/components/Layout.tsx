import { NavLink, Outlet } from 'react-router-dom';
import { HeaderBar } from './HeaderBar';
import { useQuery } from '@tanstack/react-query';
import { searchesApi } from '../api/searches';

const navItems = [
  { to: '/', label: 'New Search', icon: '⊕' },
  { to: '/searches', label: 'Searches', icon: '↻' },
  { to: '/workflow', label: 'Workflow', icon: '⚙' },
  { to: '/listings', label: 'Listings', icon: '☰' },
  { to: '/shortlist', label: 'Shortlist', icon: '★' },
  { to: '/approvals', label: 'Approvals', icon: '◎' },
  { to: '/audit', label: 'Audit Log', icon: '☷' },
  { to: '/demo', label: 'Demo Controls', icon: '⚡' },
  { to: '/demo-sequence', label: 'Demo Sequence', icon: '⌘' },
];

export function Layout() {
  const { data: searches } = useQuery({
    queryKey: ['searches-list'],
    queryFn: searchesApi.list,
    refetchInterval: 15_000,
  });

  const activeSearch = searches?.[0];

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <nav className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-700">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Relocation Scout
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-cyan-900/40 text-cyan-400 border-r-2 border-cyan-400'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`
              }
            >
              <span className="w-5 text-center text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {activeSearch && (
          <div className="p-3 border-t border-slate-700 text-xs text-slate-500">
            <div className="truncate">Search: {activeSearch.id.slice(0, 8)}…</div>
            <div className="truncate text-slate-400">{activeSearch.name}</div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
