'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  onComplete?: (val: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  error,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  // Aynı 6-haneli kod için onComplete tek sefer ateşlensin. Parent inline arrow
  // onComplete prop'unu her render'da yeniden ürettiği için, deps değişimi
  // in-flight verify çağrısı sırasında effect'i tekrar tetikliyordu → toast spam.
  // firedForRef "şu değer için zaten ateşlendi" işareti tutar.
  const firedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (value.length === length && onComplete && firedForRef.current !== value) {
      firedForRef.current = value;
      onComplete(value);
    }
    if (value.length < length) firedForRef.current = null;
  }, [value, length, onComplete]);

  // Web OTP API: WhatsApp/SMS otomatik kod okuma (Chrome/Safari mobile)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('OTPCredential' in window)) return;
    const ac = new AbortController();
    const win = window as unknown as {
      navigator: { credentials: { get: (opts: unknown) => Promise<unknown> } };
    };
    win.navigator.credentials
      .get({ otp: { transport: ['sms'] }, signal: ac.signal })
      .then((cred) => {
        const code = (cred as { code?: string })?.code;
        if (code && /^\d+$/.test(code)) {
          const next = code.slice(0, length);
          onChange(next);
        }
      })
      .catch(() => { /* user dismissed or timeout — ignore */ });
    return () => ac.abort();
  }, [length, onChange]);

  const setDigit = useCallback(
    (idx: number, digit: string) => {
      const sanitized = digit.replace(/\D/g, '');
      const chars = value.split('');
      while (chars.length < length) chars.push('');
      if (sanitized.length === 0) {
        chars[idx] = '';
      } else if (sanitized.length === 1) {
        chars[idx] = sanitized;
      } else {
        // Paste — fill from current index forward
        for (let i = 0; i < sanitized.length && idx + i < length; i++) {
          chars[idx + i] = sanitized[i];
        }
      }
      const next = chars.slice(0, length).join('').replace(/\s/g, '');
      onChange(next);
      // Move focus
      const lastFilled = Math.min(
        idx + (sanitized.length || 1),
        length - 1,
      );
      const target = sanitized.length === 0 ? Math.max(0, idx - 1) : lastFilled;
      requestAnimationFrame(() => inputRefs.current[target]?.focus());
    },
    [length, onChange, value],
  );

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[idx] && idx > 0) {
        e.preventDefault();
        const chars = value.split('');
        chars[idx - 1] = '';
        onChange(chars.join(''));
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      e.preventDefault();
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pasted) setDigit(idx, pasted);
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el; }}
          type="tel"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          disabled={disabled}
          value={value[idx] ?? ''}
          onChange={(e) => setDigit(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={(e) => handlePaste(idx, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 bg-card shadow-sm transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            error
              ? 'border-red-500 text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-900/20'
              : 'border-border focus:border-primary',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
          aria-label={`Doğrulama kodu ${idx + 1}. hane`}
        />
      ))}
    </div>
  );
}
