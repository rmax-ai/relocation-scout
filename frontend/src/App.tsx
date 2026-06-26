import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { SearchCreationPage } from './pages/SearchCreationPage';
import { SearchesListPage } from './pages/SearchesListPage';
import { SearchOverviewPage } from './pages/SearchOverviewPage';
import { WorkflowVisualizationPage } from './pages/WorkflowVisualizationPage';
import { ListingsPage } from './pages/ListingsPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { ShortlistPage } from './pages/ShortlistPage';
import { ApprovalInboxPage } from './pages/ApprovalInboxPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { DemoControlsPage } from './pages/DemoControlsPage';
import { DemoSequencePage } from './pages/DemoSequencePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    },
  },
});

function DeadEndPage({ route }: { route: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl text-slate-600 mb-4">—</div>
      <h2 className="text-lg font-medium text-slate-400 mb-2">No Context</h2>
      <p className="text-sm text-slate-600">
        Select a search first to view its {route}.<br />
        Go to <a href="/searches" className="text-cyan-400 hover:text-cyan-300">Searches</a> to pick one.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<SearchCreationPage />} />
            <Route path="/searches" element={<SearchesListPage />} />
            <Route path="/searches/:id" element={<SearchOverviewPage />} />
            <Route path="/workflow" element={<DeadEndPage route="workflow" />} />
            <Route path="/listings" element={<DeadEndPage route="listings" />} />
            <Route path="/shortlist" element={<DeadEndPage route="shortlist" />} />
            <Route path="/approvals" element={<DeadEndPage route="approvals" />} />
            <Route path="/audit" element={<DeadEndPage route="audit log" />} />
            <Route path="/searches/:id/workflow" element={<WorkflowVisualizationPage />} />
            <Route path="/searches/:id/listings" element={<ListingsPage />} />
            <Route path="/searches/:id/listings/:listingId" element={<ListingDetailPage />} />
            <Route path="/searches/:id/shortlist" element={<ShortlistPage />} />
            <Route path="/searches/:id/approvals" element={<ApprovalInboxPage />} />
            <Route path="/searches/:id/audit" element={<AuditLogPage />} />
            <Route path="/demo" element={<DemoControlsPage />} />
            <Route path="/demo-sequence" element={<DemoSequencePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
