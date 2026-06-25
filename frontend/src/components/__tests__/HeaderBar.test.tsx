import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';
import { HeaderBar } from '../HeaderBar';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

const { useQuery } = await import('@tanstack/react-query');
const mockUseQuery = useQuery as Mock;

describe('HeaderBar', () => {
  it('renders the app title and health details', () => {
    mockUseQuery.mockReturnValue({
      data: {
        status: 'completed',
        agent_runtime: 'mock',
        database: 'sqlite',
        version: '1.0.0',
        uptime_seconds: 123,
      },
    });

    render(<HeaderBar />);

    expect(screen.getByRole('heading', { name: 'Relocation Scout' })).toBeInTheDocument();
    expect(screen.getByText('Operations Console')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('mock')).toBeInTheDocument();
    expect(screen.getByText('sqlite')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('renders the fallback message when the backend is unreachable', () => {
    mockUseQuery.mockReturnValue({ data: undefined });

    render(<HeaderBar />);

    expect(screen.getByText('Backend unreachable')).toBeInTheDocument();
  });
});
