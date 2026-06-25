import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders the formatted status text', () => {
    render(<StatusBadge status="waiting_approval" />);

    expect(screen.getByText('waiting approval')).toBeInTheDocument();
  });

  it('applies the expected classes for completed status', () => {
    render(<StatusBadge status="completed" />);

    expect(screen.getByText('completed')).toHaveClass('bg-emerald-600', 'text-white');
  });

  it('renders a custom label when provided', () => {
    render(<StatusBadge status="failed" label="Needs review" />);

    expect(screen.getByText('Needs review')).toBeInTheDocument();
  });
});
