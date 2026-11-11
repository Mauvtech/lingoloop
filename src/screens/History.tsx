import { Link } from 'react-router-dom';
import { getCharacter } from '../../shared/characters';
import { BackIcon, ChevronRight } from '../assets/Icons';
import ui from '../components/ui.module.css';
import { endedConversations, conversationTime } from '../domain/eligible';
import { frDate, mmss, plural } from '../domain/format';
import { LANG_LABEL } from '../domain/types';
import { useApp } from '../store/appStore';
import styles from './History.module.css';

export default function History() {
  const list = endedConversations(useApp((s) => s.conversations));
  return (
    <main className={`${ui.screen} ${ui.screenCompact}`}>
      <Link to="/profil" className={ui.back}>
        <BackIcon />
        Profil
      </Link>
      <h1 className={ui.title} style={{ fontSize: 28 }}>Historique des conversations</h1>
      {list.length === 0 ? (
        <div className={`${ui.card} ${ui.empty}`}>
          <p className={ui.emptyText}>Aucune conversation pour l'instant.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {list.map((c) => {
            const names = [...new Set(c.characterIds)].map((id) => getCharacter(id)?.name ?? id).join(', ');
            const n = c.diagnosis.status === 'done' ? c.diagnosis.blockages.length : null;
            return (
              <li key={c.id}>
                <Link to={`/diagnostic/${c.id}`} className={styles.item}>
                  <span className={styles.body}>
                    <span className={styles.title}>{names}</span>
                    <span className={styles.meta}>
                      <span className="tnum">{frDate(conversationTime(c))}</span> · {LANG_LABEL[c.lang]} · <span className="tnum">{mmss(c.durationSec)}</span>
                      {n !== null && ` · ${plural(n, 'blocage')}`}
                    </span>
                  </span>
                  <span className={ui.chevron}><ChevronRight /></span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
