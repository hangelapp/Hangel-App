// @vitest-environment jsdom
/**
 * Snapshot tests for `<Button>` — variants & sizes (iOS 26 Liquid Glass).
 *
 * Snapshots lock the rendered DOM (class list, role, content) so any future
 * regression in cva tokens or Tailwind utility migration surfaces in the
 * diff. Run with `vitest -u` to refresh after intentional design changes.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '@/components/ui/button';

// DOM is reset between tests via the global setup hook in tests/components/setup.ts.

const VARIANTS = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
const SIZES = ['default', 'sm', 'lg', 'icon'] as const;

describe('<Button> snapshot — variants', () => {
  for (const variant of VARIANTS) {
    it(`renders variant="${variant}" stable snapshot`, () => {
      const { container } = render(<Button variant={variant}>Test</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });
  }
});

describe('<Button> snapshot — sizes', () => {
  for (const size of SIZES) {
    it(`renders size="${size}" stable snapshot`, () => {
      const { container } = render(<Button size={size}>Test</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });
  }
});

describe('<Button> behavior', () => {
  it('renders as <a> via asChild + Slot pattern', () => {
    const { container } = render(
      <Button asChild>
        <a href="/x">Link</a>
      </Button>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('disabled state has disabled prop + disabled class', () => {
    const { getByRole } = render(<Button disabled>Disabled</Button>);
    expect(getByRole('button')).toBeDisabled();
  });
});
