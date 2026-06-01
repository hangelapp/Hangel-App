// @vitest-environment jsdom
/**
 * Semantic tests for `<Sheet>` — bottom / right side variants.
 *
 * Glass sheet: kenar yönlü modal panel. Bottom side ek olarak `glass-handle`
 * grip element render eder (iOS 26 sheet anatomy).
 *
 * NOTE: We assert semantic structure (role, accessible text, handle presence)
 * instead of snapshotting because Radix Dialog Portal injects non-deterministic
 * `data-state` and `aria-describedby` ids that break snapshot equality
 * across runs.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

describe('<Sheet>', () => {
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
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Bottom Sheet')).toBeInTheDocument();
    expect(screen.getByText('Bottom-side variant with handle grip')).toBeInTheDocument();
    // Glass handle grip is rendered only for the bottom variant.
    expect(baseElement.querySelector('.glass-handle')).not.toBeNull();
  });

  it('renders right-side open state (default) without handle', () => {
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
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Right Sheet')).toBeInTheDocument();
    expect(screen.getByText('Right-side variant, no handle')).toBeInTheDocument();
    // Non-bottom variants must not render the grip handle.
    expect(baseElement.querySelector('.glass-handle')).toBeNull();
  });

  it('renders only the trigger when sheet is closed', () => {
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Sheet</Button>
        </SheetTrigger>
      </Sheet>,
    );
    expect(screen.getByRole('button', { name: 'Open Sheet' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
