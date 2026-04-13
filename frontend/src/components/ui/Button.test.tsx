import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
  it('calls onClick', async () => {
    const fn = vi.fn();
    render(<Button onClick={fn}>x</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledOnce();
  });
  it('disabled prevents click', async () => {
    const fn = vi.fn();
    render(<Button disabled onClick={fn}>x</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(fn).not.toHaveBeenCalled();
  });
  it('applies variant class', () => {
    render(<Button variant="primary">x</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('brand');
  });
});
