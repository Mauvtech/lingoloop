import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CloseIcon } from '../assets/Icons';
import { SearchScene } from '../assets/Illustrations';
import ui from '../components/ui.module.css';
import { endedConversations } from '../domain/eligible';
import { pickCharacter } from '../domain/pick';
import { LANG_LABEL } from '../domain/types';
import { requestReply } from '../services/api';
import { useApp } from '../store/appStore';
import styles from './Search.module.css';

export const MATCH_DELAY_MS = 2500;

export default function Search() {
  const settings = useApp((s) => s.settings);
  const setMatch = useApp((s) => s.setMatch);
  const [waited, setWaited] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const token = useRef<{ cancelled: boolean }>({ cancelled: false });

  /** Tire un personnage et précharge sa première réplique (aucun setState synchrone). */
  const start = useCallback(() => {
    token.current.cancelled = true;
    const mine = { cancelled: false };
    token.current = mine;
    const { conversations } = useApp.getState();
    const last = endedConversations(conversations)[0];
    const character = pickCharacter(last?.characterIds.slice(-1) ?? []);
    requestReply({ lang: settings.lang, characterId: character.id, turns: [], remainingSec: settings.durationMin * 60 })
      .then((firstReply) => {
        if (mine.cancelled) return;
        setMatch({ characterId: character.id, firstReply });
        setReady(true);
      })
      .catch(() => {
        if (!mine.cancelled) setFailed(true);
      });
    return mine;
  }, [settings.lang, settings.durationMin, setMatch]);

  useEffect(() => {
    const mine = start();
    const t = setTimeout(() => setWaited(true), MATCH_DELAY_MS);
    return () => {
      clearTimeout(t);
      mine.cancelled = true;
    };
  }, [start]);

  const retry = () => {
    setFailed(false);
    setReady(false);
    start();
  };

  const canStart = waited && ready;

  return (
    <main className={styles.root}>
      <div className={styles.sky}>
        <header className={styles.header}>
          <Link to="/" aria-label="Annuler la recherche" className={styles.close}>
            <CloseIcon />
          </Link>
          <span className={styles.chip}>{LANG_LABEL[settings.lang]} · {settings.durationMin} min</span>
        </header>
        <SearchScene />
      </div>
      <div className={styles.panel}>
        <div className={styles.text}>
          <h1 className={styles.title}>Recherche d'un personnage</h1>
          {failed ? (
            <p role="alert" className={styles.lead}>Connexion nécessaire pour parler avec un personnage</p>
          ) : (
            <p className={styles.lead} aria-live="polite">{canStart ? 'Un personnage est prêt.' : 'Un personnage va te rejoindre…'}</p>
          )}
          <div aria-hidden="true" className={styles.dots}>
            <span /><span /><span />
          </div>
        </div>
        <div className={ui.actions} style={{ gap: 6 }}>
          {failed ? (
            <button type="button" className={ui.primary} onClick={retry}>Réessayer</button>
          ) : canStart ? (
            <Link to="/conversation" className={ui.primary}>Démarrer la conversation</Link>
          ) : (
            <button type="button" className={ui.primary} disabled>Démarrer la conversation</button>
          )}
          <Link to="/" className={`${ui.secondary} ${styles.cancel}`}>Annuler</Link>
        </div>
      </div>
    </main>
  );
}
