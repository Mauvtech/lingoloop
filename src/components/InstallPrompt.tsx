import { useEffect, useState } from 'react';
import { DownloadIcon } from '../assets/Icons';
import ui from './ui.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Invitation à installer : bouton Android/Chrome, explication sur iOS Safari. */
export function InstallPrompt() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  if (isStandalone()) return null;
  if (deferred) {
    return (
      <div className={ui.group}>
        <button
          type="button"
          className={ui.row}
          onClick={() => {
            const ev = deferred;
            if (!ev) return;
            void ev.prompt().then(() => ev.userChoice).finally(() => {
              deferred = null;
              force((n) => n + 1);
            });
          }}
        >
          <span className={ui.rowIcon}><DownloadIcon /></span>
          <span className={ui.rowLabel} style={{ fontWeight: 700 }}>Installer l'app</span>
        </button>
      </div>
    );
  }
  if (isIos()) {
    return (
      <p className={`${ui.card} ${ui.cardPad}`} style={{ fontSize: 14 }}>
        Pour installer LingoLoop : touche <strong>Partager</strong>, puis <strong>Sur l'écran d'accueil</strong>.
      </p>
    );
  }
  return null;
}
