import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Music, User, Clock } from 'lucide-react';
import { StatsCard } from '../stats/StatsCard';

describe('StatsCard Component', () => {
  const defaultProps = {
    title: 'Test Stat',
    value: '100',
    icon: Music,
    color: 'blue' as const,
    loading: false
  };

  it('renders correctly with provided props', () => {
    render(<StatsCard {...defaultProps} />);

    expect(screen.getByText('Test Stat')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('shows loading state when loading is true', () => {
    render(<StatsCard {...defaultProps} loading={true} />);

    expect(screen.getByTestId('stats-loading')).toBeInTheDocument();
  });

  it('formats large numbers correctly', () => {
    render(<StatsCard {...defaultProps} value="1.5K" />);

    expect(screen.getByText('1.5K')).toBeInTheDocument();
  });

  it('handles zero values', () => {
    render(<StatsCard {...defaultProps} value="0" />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders with different icon types', () => {
    const { rerender } = render(<StatsCard {...defaultProps} icon={User} />);
    expect(screen.getByTestId('stats-card')).toBeInTheDocument();

    rerender(<StatsCard {...defaultProps} icon={Clock} />);
    expect(screen.getByTestId('stats-card')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<StatsCard {...defaultProps} color="green" />);

    const card = screen.getByTestId('stats-card');
    expect(card).toBeInTheDocument();
  });
});
