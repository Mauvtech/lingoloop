import { useState, type FormEvent } from 'react';
import { MicIcon, NextIcon, SendIcon, SpeakerIcon } from '../assets/Icons';
import { Portrait } from '../assets/Illustrations';
import { Sheet } from '../components/Sheet';
import ui from '../components/ui.module.css';
import { mmss } from '../domain/format';
import styles from './Conversation.module.css';
import { useConversation } from './conversation/useConversation';

function announce(elapsedSec: number): string {
  const block = Math.floor(elapsedSec / 30) * 30;
  if (block === 0) return '';
  const m = Math.floor(block / 60);
  const s = block % 60;
  return `Temps écoulé : ${m > 0 ? `${m} minute${m > 1 ? 's' : ''}` : ''}${m > 0 && s ? ' et ' : ''}${s ? `${s} secondes` : ''}`;
}

export default function Conversation() {
  const c = useConversation();
  const [draft, setDraft] = useState('');
  const lang = c.conv?.lang ?? 'en';
  const planned = c.conv?.plannedSec ?? 0;
  const progress = planned ? Math.min(100, (c.elapsedSec / planned) * 100) : 0;
  const busy = c.phase === 'thinking' || c.phase === 'error' || c.phase === 'ended';

  const onSend = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    c.submitText(draft);
    setDraft('');
  };

  const status =
    c.phase === 'characterSpeaking' && !c.muted && c.voiceAvailable
      ? `${c.character?.name ?? ''} parle`
      : c.phase === 'listening'
        ? "Je t'écoute…"
        : c.phase === 'thinking'
          ? '…'
          : c.phase === 'error'
            ? 'Pause'
            : 'À toi';

  return (
    <main className={`${styles.root} dark`}>
      <header className={styles.header}>
        <div className={styles.headRow}>
          <div className={styles.who}>
            <h1 className={styles.name}>{c.character?.name ?? 'Conversation'}</h1>
            <span className={styles.role}>{c.character?.roleFr ?? ''}</span>
          </div>
          <span className={`${styles.clock} tnum`} aria-label={`Temps écoulé ${mmss(c.elapsedSec)} sur ${mmss(planned)}`}>
            <span className={styles.clockMain}>{mmss(c.elapsedSec)}</span>
            <span className={styles.clockTotal}>/ {mmss(planned)}</span>
          </span>
        </div>
        <div role="progressbar" aria-label="Temps de conversation écoulé" aria-valuemin={0} aria-valuemax={planned} aria-valuenow={c.elapsedSec} className={styles.track}>
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
        <p className="visually-hidden" aria-live="polite">{announce(c.elapsedSec)}</p>
      </header>

      <div className={styles.stage}>
        {c.character && <Portrait characterId={c.character.id} label={`Portrait de ${c.character.name}, ${c.character.roleFr.toLowerCase()}`} />}
        <span className={styles.state} data-phase={c.phase}>
          {c.phase === 'characterSpeaking' && !c.muted && c.voiceAvailable && (
            <span aria-hidden="true" className={styles.wave}>
              <span /><span /><span /><span />
            </span>
          )}
          {c.phase === 'listening' && <span aria-hidden="true" className={styles.rec} />}
          <span>{status}</span>
        </span>
      </div>

      <div className={styles.bubble} aria-live="polite">
        <span className={styles.bubbleName}>{c.character?.name ?? ''}</span>
        {c.phase === 'error' ? (
          <div className={styles.errorBox}>
            <p className={styles.bubbleText}>{c.errorText}</p>
            <button type="button" className={styles.retry} onClick={c.retry}>Réessayer</button>
          </div>
        ) : (
          <p lang={lang} className={styles.bubbleText}>{c.lastReply ?? '…'}</p>
        )}
      </div>

      {(c.phase === 'listening' || c.interim) && (
        <p className={styles.interim} lang={lang} aria-live="polite">
          {c.interim || "Je t'écoute…"}
        </p>
      )}

      {c.micUnavailable && (
        <form className={styles.textForm} onSubmit={onSend}>
          <p className={styles.micNote}>Le micro n'est pas disponible. Tu peux écrire tes réponses.</p>
          <div className={styles.inputRow}>
            <label htmlFor="reply" className="visually-hidden">Ta réponse</label>
            <input
              id="reply"
              lang={lang}
              className={styles.input}
              value={draft}
              maxLength={2000}
              autoComplete="off"
              placeholder="Ta réponse"
              onChange={(e) => setDraft(e.target.value)}
              disabled={busy}
            />
            <button type="submit" className={styles.send} aria-label="Envoyer" disabled={busy || !draft.trim()}>
              <SendIcon />
            </button>
          </div>
        </form>
      )}

      <div className={styles.controls}>
        <button type="button" className={styles.ctrl} aria-pressed={!c.muted} onClick={c.toggleMute} disabled={!c.voiceAvailable}>
          <span className={styles.ctrlIcon}><SpeakerIcon muted={c.muted || !c.voiceAvailable} /></span>
          Haut-parleur
        </button>
        {!c.micUnavailable ? (
          <button
            type="button"
            className={`${styles.ctrl} ${styles.micCtrl}`}
            aria-pressed={c.phase === 'listening'}
            onClick={c.toggleMic}
            disabled={busy}
          >
            <span className={`${styles.mic} ${c.phase === 'listening' ? styles.listening : ''}`}><MicIcon /></span>
            {c.phase === 'listening' ? 'Envoyer' : 'Microphone'}
          </button>
        ) : (
          <span className={styles.ctrlGap} aria-hidden="true" />
        )}
        <button type="button" className={styles.ctrl} onClick={c.nextCharacter} disabled={busy || c.phase === 'listening'}>
          <span className={styles.ctrlIcon}><NextIcon /></span>
          Personnage suivant
        </button>
      </div>

      <button type="button" className={`${ui.primary} ${ui.danger}`} onClick={c.requestEnd} disabled={c.phase === 'ended'}>
        Terminer la conversation
      </button>

      {c.confirmEnd && (
        <Sheet
          title="Pas assez d'échanges pour un diagnostic."
          description="Quitter sans enregistrer ?"
          onClose={() => c.setConfirmEnd(false)}
        >
          <div className={ui.actions}>
            <button type="button" className={`${ui.primary} ${ui.danger}`} onClick={c.quit}>Quitter</button>
            <button type="button" className={ui.secondary} onClick={() => c.setConfirmEnd(false)}>Continuer</button>
          </div>
        </Sheet>
      )}
    </main>
  );
}
