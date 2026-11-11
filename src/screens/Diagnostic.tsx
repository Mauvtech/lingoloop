import { useCallback, useEffect, useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BLOCKAGE_LABELS } from '../../shared/blockages';
import { getCharacter } from '../../shared/characters';
import { BLOCKAGE_ICON_BG } from '../assets/blockageColors';
import { BlockageIcon } from '../assets/Icons';
import { HarbourScene } from '../assets/Illustrations';
import { Example } from '../components/Example';
import ui from '../components/ui.module.css';
import { mmss } from '../domain/format';
import type { Blockage, Conversation } from '../domain/types';
import { requestDiagnosis } from '../services/api';
import { useApp } from '../store/appStore';
import styles from './Diagnostic.module.css';

const inFlight = new Set<string>();

function badgeName(c: Conversation): string {
  const first = getCharacter(c.characterIds[0] ?? '')?.name ?? '';
  const others = new Set(c.characterIds).size - 1;
  return others > 0 ? `${first} +${others}` : first;
}

function BlockageCard({ b, lang }: { b: Blockage; lang: Conversation['lang'] }) {
  const hasExample = b.said !== undefined && b.corrected !== undefined;
  return (
    <section className={`${ui.card} ${styles.card}`} aria-labelledby={`bk-${b.key}`}>
      <div className={styles.cardHead}>
        <span aria-hidden="true" className={ui.badgeIcon} style={{ background: BLOCKAGE_ICON_BG[b.key] }}>
          <BlockageIcon blockageKey={b.key} size={26} />
        </span>
        <div className={styles.cardTitles}>
          <span className={styles.eyebrow}>Blocage repéré</span>
          <h2 id={`bk-${b.key}`} className={styles.cardTitle}>{BLOCKAGE_LABELS[b.key]}</h2>
          {!hasExample && <p className={styles.note}>{b.observation}</p>}
        </div>
      </div>
      {hasExample && <Example said={b.said as string} corrected={b.corrected as string} lang={lang} />}
    </section>
  );
}

export default function Diagnostic() {
  const { id = '' } = useParams();
  const conv = useApp((s) => s.conversations.find((c) => c.id === id));
  const saveConversation = useApp((s) => s.saveConversation);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const run = useCallback(
    async (c: Conversation) => {
      if (inFlight.has(c.id)) return;
      inFlight.add(c.id);
      try {
        const blockages = await requestDiagnosis({ lang: c.lang, turns: c.turns.slice(-40) });
        await saveConversation({ ...c, diagnosis: { status: 'done', blockages } });
      } catch {
        await saveConversation({ ...c, diagnosis: { status: 'error', blockages: [] } });
      } finally {
        inFlight.delete(c.id);
      }
    },
    [saveConversation],
  );

  useEffect(() => {
    if (conv && conv.state === 'ended' && conv.diagnosis.status === 'pending') void run(conv);
  }, [conv, run]);

  if (!conv || conv.state !== 'ended') return <Navigate to="/" replace />;
  const { status, blockages } = conv.diagnosis;

  return (
    <main className={`${ui.screen} ${ui.screenCompact}`} style={{ gap: 16 }}>
      <div className={styles.banner}>
        <HarbourScene label="Un voilier arrivé au port, près d'un phare" />
        <span className={`${styles.badge} tnum`}>{badgeName(conv)} · {mmss(conv.durationSec)}</span>
      </div>
      <header className={ui.header}>
        <h1 ref={headingRef} className={ui.title} style={{ fontSize: 30 }}>Conversation terminée</h1>
        <p className={ui.subtitle}>Résumé basé sur ce qui a été dit.</p>
      </header>

      <div aria-live="polite" aria-busy={status === 'pending'} className={styles.results}>
        {status === 'pending' && (
          <>
            <p className="visually-hidden">Analyse de ta conversation…</p>
            <div className={`${ui.card} ${styles.skeleton}`} aria-hidden="true"><span /><span /><span /></div>
            <div className={`${ui.card} ${styles.skeleton}`} aria-hidden="true"><span /><span /></div>
          </>
        )}
        {status === 'error' && (
          <div className={`${ui.card} ${ui.empty}`} role="alert">
            <p className={ui.emptyText}>Le diagnostic n'a pas pu être généré.</p>
            <button
              type="button"
              className={ui.primary}
              onClick={() => void saveConversation({ ...conv, diagnosis: { status: 'pending', blockages: [] } })}
            >
              Réessayer
            </button>
          </div>
        )}
        {status === 'done' && blockages.length === 0 && (
          <div className={`${ui.card} ${ui.empty}`}>
            <p className={ui.emptyText}>Aucun blocage repéré cette fois. Continue comme ça !</p>
          </div>
        )}
        {status === 'done' && blockages.map((b) => <BlockageCard key={b.key} b={b} lang={conv.lang} />)}
      </div>

      <div className={ui.spacer} />
      <div className={ui.actions}>
        <Link to="/blocages" className={ui.primary}>Voir mes blocages</Link>
        <Link to="/" className={ui.secondary}>Retour à l'accueil</Link>
      </div>
    </main>
  );
}
