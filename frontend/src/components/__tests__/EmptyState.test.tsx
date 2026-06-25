import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the title and description', () => {
    render(
      <EmptyState
        title="No listings yet"
        description="Create a search to populate results."
      />,
    );

    expect(screen.getByRole('heading', { name: 'No listings yet' })).toBeInTheDocument();
    expect(screen.getByText('Create a search to populate results.')).toBeInTheDocument();
  });

  it('renders an action button when provided', () => {
    const onClick = vi.fn();

    render(
      <EmptyState
        title="No approvals pending"
        description="Everything is clear."
        action={{ label: 'Refresh', onClick }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });
});
