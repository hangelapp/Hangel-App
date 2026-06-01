// @vitest-environment jsdom
/**
 * Snapshot tests for `<EmptyState>` — defaults + with action (link / onClick).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Heart } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

describe('<EmptyState> snapshot', () => {
  it('renders default (icon + title + description)', () => {
    const { container } = render(
      <EmptyState title="Henüz veri yok" description="Yakında burada listelenecek." />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders without description', () => {
    const { container } = render(<EmptyState title="Boş" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom icon and href action', () => {
    const { container } = render(
      <EmptyState
        icon={Heart}
        title="Yardım Et"
        description="STK'ları destekle."
        action={{ label: 'Keşfet', href: '/discover' }}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with onClick action and fires the callback when clicked', () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <EmptyState title="Boş" action={{ label: 'Yenile', onClick }} />,
    );
    fireEvent.click(getByRole('button', { name: 'Yenile' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
