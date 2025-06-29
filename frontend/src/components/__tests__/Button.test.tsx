import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../ui/Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct variant styles', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByText('Primary Button');
    expect(button).toHaveClass('bg-primary-600');
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50');
  });

  it('shows loading state correctly', () => {
    render(<Button loading>Loading Button</Button>);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
