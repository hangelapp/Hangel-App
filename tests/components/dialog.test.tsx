// @vitest-environment jsdom
/**
 * Snapshot tests for `<Dialog>` — open vs closed.
 *
 * Liquid Glass modal: prominent glass + rounded-3xl + spring slide-in.
 * Snapshot captures the open-state DOM (portal content + overlay).
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
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

describe('<Dialog> snapshot', () => {
  it('renders trigger when closed', () => {
    const { container } = render(
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
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders open state with overlay + portal content', () => {
    const { baseElement } = render(
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
    // baseElement includes portal mount; serialize entire DOM
    expect(baseElement).toMatchSnapshot();
  });
});
