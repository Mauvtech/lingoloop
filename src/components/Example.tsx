import { diffWords } from '../domain/diff';
import type { Lang } from '../domain/types';
import ui from './ui.module.css';

/** « Tu as dit » / « Correction » avec mots fautifs soulignés en vague et mots corrigés en gras. */
export function Example({ said, corrected, lang, compact = false }: { said: string; corrected: string; lang: Lang; compact?: boolean }) {
  const d = diffWords(said, corrected);
  return (
    <>
      <div className={compact ? `${ui.saidBox} ${ui.compactBox}` : ui.saidBox}>
        {!compact && <span className={ui.saidLabel}>Tu as dit</span>}
        <p lang={lang} className={ui.example}>
          {compact && <span className="visually-hidden">Tu as dit : </span>}
          {d.said.map((s, i) => (s.changed ? <span key={i} className={ui.said}>{s.text}</span> : <span key={i}>{s.text}</span>))}
        </p>
      </div>
      <div className={compact ? `${ui.fixedBox} ${ui.compactBox}` : ui.fixedBox}>
        {!compact && <span className={ui.fixedLabel}>Correction</span>}
        <p lang={lang} className={ui.example}>
          {compact && <span className="visually-hidden">Correction : </span>}
          {d.corrected.map((s, i) => (s.changed ? <span key={i} className={ui.fixed}>{s.text}</span> : <span key={i}>{s.text}</span>))}
        </p>
      </div>
    </>
  );
}
