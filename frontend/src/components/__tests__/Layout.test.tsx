import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';
import { Layout } from '../Layout';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('../HeaderBar', () => ({
  HeaderBar: () => <div>Header Bar</div>,
}));

vi.mock('react-router-dom', () => ({
  NavLink: ({
    children,
    to,
  }: {
    children: ReactNode;
    to: string;
  }) => <a href={to}>{children}</a>,
  Outlet: () => <div>Layout child content</div>,
}));

const { useQuery } = await import('@tanstack/react-query');
const mockUseQuery = useQuery as Mock;

describe('Layout', () => {
  it('renders navigation links and outlet content', () => {
    mockUseQuery.mockReturnValue({
      data: [
        {
          id: 'search-12345678',
          name: 'Seattle search',
          status: 'created',
          progress_percentage: 0,
          current_step: 'created',
          created_at: '2026-06-25T00:00:00Z',
        },
      ],
    });

    render(<Layout />);

    expect(screen.getByRole('link', { name: /New Search/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Searches/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Workflow/i })).toBeInTheDocument();
    expect(screen.getByText('Header Bar')).toBeInTheDocument();
    expect(screen.getByText('Layout child content')).toBeInTheDocument();
    expect(screen.getByText(/Seattle search/)).toBeInTheDocument();
  });
});
