// @vitest-environment jsdom
/**
 * Snapshot tests for `<Sheet>` — bottom / right side variants.
 *
 * Glass sheet: kenar yönlü modal panel. Bottom side ek olarak `glass-handle`
 * grip element render eder (iOS 26 sheet anatomy).
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

describe('<Sheet> snapshot', () => {
  it('renders bottom-side open state with glass handle grip', () => {
    const { baseElement } = render(
      <Sheet open>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Bottom Sheet</SheetTitle>
            <SheetDescription>Bottom-side variant with handle grip</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>,
    );
    expect(baseElement).toMatchSnapshot();
  });

  it('renders right-side open state (default)', () => {
    const { baseElement } = render(
      <Sheet open>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Right Sheet</SheetTitle>
            <SheetDescription>Right-side variant, no handle</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>,
    );
    expect(baseElement).toMatchSnapshot();
  });

  it('renders only the trigger when sheet is closed', () => {
    const { container } = render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Sheet</Button>
        </SheetTrigger>
      </Sheet>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
