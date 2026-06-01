// @vitest-environment jsdom
/**
 * Semantic tests for `<Dialog>` — open vs closed.
 *
 * Liquid Glass modal: prominent glass + rounded-3xl + spring slide-in.
 *
 * NOTE: We assert semantic structure (role, accessible text) instead of
 * snapshotting because Radix Dialog Portal injects non-deterministic
 * `data-state` and `aria-describedby` ids that break snapshot equality
 * across runs.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

describe('<Dialog>', () => {
  it('renders trigger when closed and no dialog role is present', () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <p>Body</p>
          <DialogFooter>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders open state with title, description, body and footer', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open Title</DialogTitle>
            <DialogDescription>Open Description</DialogDescription>
          </DialogHeader>
          <p>Open body</p>
          <DialogFooter>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Open Title')).toBeInTheDocument();
    expect(screen.getByText('Open Description')).toBeInTheDocument();
    expect(screen.getByText('Open body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });
});
