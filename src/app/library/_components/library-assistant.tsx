'use client';

/**
 * Bölüm 1 — Kütüphane Asistanı (AI sohbet).
 *
 * Backend endpoint: `/api/library/chat`. Route yoksa kullanıcıya toast ile graceful
 * degrade gösterilir. localStorage'da sohbet geçmişi tutulur.
 *
 * UI: Liquid Glass uyumlu (Dialog zaten `glass-prominent`); mesaj listesi `glass-thin`
 * yüzey üzerinde gezinir, kullanıcı kabarcığı primary tonu, asistan kabarcığı
 * `glass` katmanı kullanır.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { GlassSurface } from '@/components/ui/glass-surface';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2, Send, Sparkles, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'hangel.assistant.library.history';
const ENDPOINT = '/api/library/chat';

const SUGGESTED_QUESTION_KEYS = [
  'library.suggestedQuestions.library1',
  'library.suggestedQuestions.library2',
  'library.suggestedQuestions.library3',
  'library.suggestedQuestions.library4',
];

type ChatMessage = { role: 'user' | 'assistant'; content: string; ts: number };

export function LibraryAssistantDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const title = t('library.assistant.libraryTitle');
  const description = t('library.assistant.libraryDescription');
  const placeholder = t('library.assistant.libraryPlaceholder');
  const greeting = t('library.assistant.libraryGreeting');
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const handleSend = async (textArg?: string) => {
    const text = (textArg ?? input).trim();
    if (!text || sending) return;
    setMessages(prev => [...prev, { role: 'user', content: text, ts: Date.now() }]);
    setInput('');
    setSending(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages.slice(-10) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { reply?: string };
      const reply = (data?.reply ?? '').toString().trim();
      if (!reply) throw new Error('Empty reply');
      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
    } catch {
      toast({
        title: t('library.assistant.unavailableTitle'),
        description: t('library.assistant.unavailableDesc'),
      });
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-2 text-left">
          <DialogTitle className="flex items-center gap-3 text-base font-semibold">
            <GlassSurface
              variant="prominent"
              radius="full"
              shadow="soft"
              className="inline-flex h-10 w-10 items-center justify-center text-primary"
            >
              <Bot className="h-5 w-5" aria-hidden />
            </GlassSurface>
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pl-[3.25rem]">
            {description}
          </DialogDescription>
        </DialogHeader>

        <GlassSurface
          variant="thin"
          radius="none"
          shadow="none"
          className="border-y border-glass-black-8 dark:border-glass-white-8"
        >
          <ScrollArea className="h-[60vh] max-h-[420px]">
            <div ref={listRef} className="px-5 py-5 space-y-3">
              {isEmpty && (
                <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                  <GlassSurface
                    variant="prominent"
                    radius="full"
                    shadow="prominent"
                    className="inline-flex h-14 w-14 items-center justify-center text-primary"
                  >
                    <Sparkles className="h-6 w-6" aria-hidden />
                  </GlassSurface>
                  <p className="text-sm text-foreground/90 max-w-[18rem] leading-relaxed">
                    {greeting}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center pt-1">
                    {SUGGESTED_QUESTION_KEYS.map(qKey => {
                      const q = t(qKey);
                      return (
                        <button
                          key={qKey}
                          type="button"
                          onClick={() => void handleSend(q)}
                          className={cn(
                            'glass-thin rounded-full px-3.5 py-1.5 text-xs text-foreground/80',
                            'border border-glass-black-8 dark:border-glass-white-12',
                            'transition-all hover:text-foreground hover:scale-[1.02] active:scale-[0.98]'
                          )}
                        >
                          {q}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {messages.map((m, idx) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={`${m.ts}-${idx}`}
                    className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] px-3.5 py-2.5 text-sm whitespace-pre-wrap',
                        isUser
                          ? 'rounded-2xl rounded-br-sm bg-primary text-primary-foreground shadow-glass-soft'
                          : 'glass rounded-2xl rounded-bl-sm border border-glass-black-8 dark:border-glass-white-12 text-foreground'
                      )}
                    >
                      <div
                        className={cn(
                          'text-[10px] uppercase tracking-wide mb-1',
                          isUser ? 'opacity-75' : 'opacity-60'
                        )}
                      >
                        {isUser ? t('library.assistant.userLabel') : title}
                      </div>
                      {m.content}
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl rounded-bl-sm border border-glass-black-8 dark:border-glass-white-12 px-3.5 py-2.5 text-sm flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    {t('library.assistant.thinking')}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </GlassSurface>

        <div className="px-4 py-3 flex items-end gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={placeholder}
            disabled={sending}
            className="flex-1 rounded-full bg-glass-black-5 dark:bg-glass-white-8 border-glass-black-8 dark:border-glass-white-12 backdrop-blur-glass-2"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => void handleSend()}
            disabled={sending || !input.trim()}
            aria-label={t('library.assistant.sendAria')}
            className="rounded-full shrink-0 shadow-glass-soft"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
          </Button>
          {messages.length > 0 && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleClear}
              aria-label={t('library.assistant.clearHistoryAria')}
              className="rounded-full shrink-0"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
