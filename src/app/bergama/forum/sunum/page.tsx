'use client';

/**
 * /bergama/forum/sunum — Pergamon İnovasyon Mirası Forumu sunumu (Apple Keynote
 * tarzı tam ekran). DeckViewer + FORUM_SLIDES.
 */

import { DeckViewer } from '@/components/deck/deck-viewer';
import { FORUM_SLIDES } from '@/lib/bergama-decks';

export default function ForumSunumPage() {
  return (
    <DeckViewer
      slides={FORUM_SLIDES}
      qrUrl="https://hangel.org/bergama/forum"
      exitHref="/bergama/forum"
      cornerQrCaption="Okut, başvur"
    />
  );
}
