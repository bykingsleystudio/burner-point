'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey?: string;
  onTokenChange?: (token: string | null) => void;
  onError?: () => void;
}

export function TurnstileWidget({ siteKey, onTokenChange, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let isCancelled = false;

    const attach = () => {
      if (!window.turnstile || !containerRef.current) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'auto',
        callback: (token: string) => {
          if (isCancelled) return;
          onTokenChange?.(token);
        },
        'expired-callback': () => {
          if (isCancelled) return;
          onTokenChange?.(null);
        },
        'error-callback': () => {
          if (isCancelled) return;
          onTokenChange?.(null);
          onError?.();
        },
      });
      setLoaded(true);
    };

    if (window.turnstile) {
      attach();
      return () => {
        isCancelled = true;
        if (widgetIdRef.current) {
          window.turnstile?.remove(widgetIdRef.current);
        }
      };
    }

    const scriptId = 'turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const onLoad = () => {
      if (!isCancelled) attach();
    };

    script.addEventListener('load', onLoad, { once: true });

    if (window.turnstile) {
      onLoad();
    }

    return () => {
      isCancelled = true;
      script.removeEventListener('load', onLoad);
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current);
      }
    };
  }, [siteKey, onError, onTokenChange]);

  if (!siteKey) return null;

  return (
    <div className="w-full">
      <div ref={containerRef} className="flex justify-center" aria-live="polite" aria-busy={!loaded} />
    </div>
  );
}
