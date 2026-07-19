'use client';

/**
 * /bergama/yerleske/sunum — Sosyal İnovasyon Yerleşkesi sunumu (Apple Keynote
 * tarzı tam ekran). DeckViewer + YERLESKE_SLIDES.
 */

import { DeckViewer } from '@/components/deck/deck-viewer';
import { YERLESKE_SLIDES } from '@/lib/bergama-decks';

export default function YerleskeSunumPage() {
  return (
    <DeckViewer
      slides={YERLESKE_SLIDES}
      qrUrl="https://hangel.org/bergama/yerleske"
      exitHref="/bergama/yerleske"
      cornerQrCaption="Okut, başvur"
    />
  );
}
