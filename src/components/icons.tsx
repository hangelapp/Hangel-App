import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * hangel resmi logo wordmark'ı.
 *
 * Varsayılan olarak https://hangel.org.tr (resmi public site) linkine sarılır.
 * Logo nereye yerleştirilirse oradan kullanıcı tek tıkla canlı siteye gidebilir.
 *
 * - href prop'u ile özelleştirilebilir (örn. uygulama içinde "/" home'a yönelten)
 * - href={null} verilirse plain span (kayıt ekranlarında click istenmeyen yerler)
 * - external prop'u true ise target="_blank" + rel="noopener noreferrer"
 */
export const HangelLogo: React.FC<
  React.HTMLAttributes<HTMLElement> & {
    href?: string | null;
    external?: boolean;
  }
> = ({ href = 'https://hangel.org.tr', external = true, className, ...rest }) => {
  const wordmark = (
    <span className={cn('font-bold text-primary', className)} {...rest}>
      hangel
    </span>
  );
  if (!href) return wordmark;
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="inline-flex items-center hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
      aria-label="hangel — toplumsal etki platformu (hangel.org.tr)"
    >
      {wordmark}
    </a>
  );
};

