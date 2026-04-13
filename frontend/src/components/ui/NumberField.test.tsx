import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberField } from './NumberField';

describe('NumberField', () => {
  it('renders value', () => {
    render(<NumberField value={42} onChange={() => {}} label="count" />);
    expect(screen.getByDisplayValue('42')).toBeInTheDocument();
  });
  it('calls onChange on input commit', async () => {
    const fn = vi.fn();
    render(<NumberField value={1} onChange={fn} label="count" />);
    const input = screen.getByLabelText('count') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, '7{Enter}');
    expect(fn).toHaveBeenLastCalledWith(7);
  });
  it('clamps to min/max', async () => {
    const fn = vi.fn();
    render(<NumberField value={5} min={0} max={10} onChange={fn} label="v" />);
    const input = screen.getByLabelText('v') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, '99{Enter}');
    expect(fn).toHaveBeenLastCalledWith(10);
  });
});
