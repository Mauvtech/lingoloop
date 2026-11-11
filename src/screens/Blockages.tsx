import { Link } from 'react-router-dom';
import { BLOCKAGE_ICON_BG } from '../assets/blockageColors';
import { BlockageIcon, ChevronRight } from '../assets/Icons';
import { RocksScene, SailboatBadge } from '../assets/Illustrations';
import { StatusPill } from '../components/StatusPill';
import ui from '../components/ui.module.css';
import { summarizeBlockages } from '../domain/status';
import { useApp } from '../store/appStore';
import styles from './Blockages.module.css';

export default function Blockages() {
  const conversations = useApp((s) => s.conversations);
  const lang = useApp((s) => s.settings.lang);
  const list = summarizeBlockages(conversations, lang);

  return (
    <main className={ui.screen} style={{ gap: 16, paddingTop: 'calc(60px + env(safe-area-inset-top))' }}>
      <header className={ui.header}>
        <h1 className={ui.title}>Mes blocages</h1>
        <p className={ui.subtitle}>Difficultés détectées dans tes conversations.</p>
      </header>
      <div className={styles.banner}>
        <RocksScene label="Un voilier navigue entre trois rochers" />
      </div>
      {list.length === 0 ? (
        <div className={`${ui.card} ${ui.empty}`}>
          <p className={ui.emptyText}>Aucun blocage pour l'instant. Parle avec un personnage pour en repérer.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {list.map((b) => (
            <li key={b.key}>
              <Link to={`/blocages/${b.key}`} className={styles.item}>
                <span aria-hidden="true" className={styles.icon} style={{ background: BLOCKAGE_ICON_BG[b.key] }}>
                  <BlockageIcon blockageKey={b.key} />
                </span>
                <span className={styles.body}>
                  <span className={styles.label}>{b.label}</span>
                  <StatusPill status={b.status} />
                </span>
                <span className={ui.chevron}><ChevronRight /></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className={ui.spacer} />
      <div className={styles.motto}>
        <span aria-hidden="true" className={styles.mottoIcon}><SailboatBadge /></span>
        <span className={styles.mottoText}>
          <span className={styles.mottoTitle}>Aucun exercice.</span>
          <span className={styles.mottoSub}>Tu progresses en parlant.</span>
        </span>
      </div>
    </main>
  );
}
