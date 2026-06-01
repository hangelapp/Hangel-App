// @vitest-environment jsdom
/**
 * Snapshot tests for `<Card>` — default / solid / glass / glass-prominent.
 *
 * Card varyant API'si Liquid Glass migrasyonu sonrası default = glass.
 * `variant="solid"` eski opak yüzey davranışını koruyor.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

const VARIANTS = ['default', 'solid', 'glass', 'glass-prominent'] as const;

describe('<Card> snapshot — variants', () => {
  for (const variant of VARIANTS) {
    it(`renders variant="${variant}" stable snapshot`, () => {
      const { container } = render(
        <Card variant={variant}>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>,
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  }
});

describe('<Card> behavior', () => {
  it('passes through additional className', () => {
    const { container } = render(<Card className="my-extra-class">x</Card>);
    expect(container.firstChild).toHaveClass('my-extra-class');
  });
});
