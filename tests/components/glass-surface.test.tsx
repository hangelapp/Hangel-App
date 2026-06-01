// @vitest-environment jsdom
/**
 * Snapshot tests for `<GlassSurface>` — variant × radius × shadow matrix.
 *
 * GlassSurface yeniden kullanılabilir Liquid Glass wrapper'ı; variants
 * `globals.css` içindeki `.glass`, `.glass-prominent`, `.glass-thin` ile
 * birebir eşleşir. Snapshot test class kombinasyonlarını sabitler.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { GlassSurface } from '@/components/ui/glass-surface';

const VARIANTS = ['default', 'prominent', 'thin'] as const;

describe('<GlassSurface> snapshot — variants', () => {
  for (const variant of VARIANTS) {
    it(`renders variant="${variant}" with default radius/shadow`, () => {
      const { container } = render(
        <GlassSurface variant={variant}>Content</GlassSurface>,
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  }
});

describe('<GlassSurface> snapshot — radius / shadow', () => {
  it('renders radius="full" + shadow="prominent"', () => {
    const { container } = render(
      <GlassSurface radius="full" shadow="prominent">
        Pill
      </GlassSurface>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders radius="none" + shadow="none" (cleanest baseline)', () => {
    const { container } = render(
      <GlassSurface radius="none" shadow="none">
        Bare
      </GlassSurface>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('<GlassSurface> asChild slot pattern', () => {
  it('renders as <section> via asChild', () => {
    const { container } = render(
      <GlassSurface asChild>
        <section>Semantic</section>
      </GlassSurface>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
