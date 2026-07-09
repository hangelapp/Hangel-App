'use client';

/**
 * Sağ kenarda sticky 2 AI ikonu (kütüphane asistanı + proje yazma asistanı).
 *
 * Proje yazma asistanı yalnızca STK admin'lerine açık olduğu için, NGO admin
 * değilse o FAB ve onun dialog'u render edilmez. page.tsx üzerinden state geçer.
 */

import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/providers/language-provider';
import { useIsNgoAdmin } from '@/hooks/use-is-ngo-admin';
import { LibraryAssistantDialog } from './library-assistant';
import { ProjectWriterDialog } from './project-writer';

export function LibraryAssistantsFab({
  openLibrary, setOpenLibrary,
  openProject, setOpenProject,
}: {
  openLibrary: boolean; setOpenLibrary: (o: boolean) => void;
  openProject: boolean; setOpenProject: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const { isNgoAdmin } = useIsNgoAdmin();
  const libAria = t('library.fab.libraryAria');
  const projAria = t('library.fab.projectAria');

  return (
    <>
      <div className="fixed right-3 sm:right-4 bottom-[calc(5rem+var(--sab))] z-40 flex flex-col items-end gap-3">
        <Button
          type="button"
          onClick={() => setOpenLibrary(true)}
          className="rounded-full shadow-lg h-12 w-12 sm:h-14 sm:w-14 p-0"
          aria-label={libAria}
          title={libAria}
        >
          <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
        {isNgoAdmin && (
          <Button
            type="button"
            onClick={() => setOpenProject(true)}
            className="rounded-full shadow-lg h-12 w-12 sm:h-14 sm:w-14 p-0 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
            aria-label={projAria}
            title={projAria}
          >
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        )}
      </div>
      <LibraryAssistantDialog open={openLibrary} onOpenChange={setOpenLibrary} />
      {isNgoAdmin && <ProjectWriterDialog open={openProject} onOpenChange={setOpenProject} />}
    </>
  );
}
