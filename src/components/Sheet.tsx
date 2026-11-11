import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './Sheet.module.css';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Texte d'aide sous le titre. */
  description?: string;
}

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Feuille modale en bas d'écran : focus piégé, Échap et tap sur le fond pour fermer. */
export function Sheet({ title, onClose, children, description }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const firstEl = items[0] as HTMLElement;
      const lastEl = items[items.length - 1] as HTMLElement;
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    const el = panel.current;
    el?.addEventListener('keydown', onKey);
    return () => {
      el?.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={styles.panel}
      >
        <span aria-hidden="true" className={styles.grip} />
        <h2 id={titleId} className={styles.title}>{title}</h2>
        {description && <p id={descId} className={styles.description}>{description}</p>}
        {children}
      </div>
    </div>
  );
}

export function ChoiceList<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={styles.choices}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={styles.choice}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          <span>{o.label}</span>
          {o.value === value && (
            <span className={styles.check}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
