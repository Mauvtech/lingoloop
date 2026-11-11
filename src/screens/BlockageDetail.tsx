import { Link, Navigate, useParams } from 'react-router-dom';
import { BLOCKAGE_ICON_BG } from '../assets/blockageColors';
import { BackIcon, BlockageIcon } from '../assets/Icons';
import { BarChart } from '../components/BarChart';
import { Example } from '../components/Example';
import { StatusPill } from '../components/StatusPill';
import ui from '../components/ui.module.css';
import { summarizeBlockages } from '../domain/status';
import { useApp } from '../store/appStore';
import styles from './BlockageDetail.module.css';

export default function BlockageDetail() {
  const { key = '' } = useParams();
  const conversations = useApp((s) => s.conversations);
  const lang = useApp((s) => s.settings.lang);
  const b = summarizeBlockages(conversations, lang).find((x) => x.key === key);
  if (!b) return <Navigate to="/blocages" replace />;
  const labels = b.evolution.map((_, i) => `C${i + 1}`);
  const aria = `Occurrences : ${b.evolution.map((v, i) => `${v} à la conversation ${i + 1}`).join(', ')}`;

  return (
    <main className={`${ui.screen} ${ui.screenCompact}`}>
      <Link to="/blocages" className={ui.back}>
        <BackIcon />
        Blocages
      </Link>
      <header className={styles.head}>
        <span aria-hidden="true" className={styles.icon} style={{ background: BLOCKAGE_ICON_BG[b.key] }}>
          <BlockageIcon blockageKey={b.key} size={36} />
        </span>
        <div className={styles.titles}>
          <h1 className={ui.title} style={{ fontSize: 28 }}>{b.label}</h1>
          <StatusPill status={b.status} prefix />
        </div>
      </header>
      <section className={`${ui.card} ${styles.section}`} aria-labelledby="obs">
        <h2 id="obs" className={ui.sectionLabel}>Observation</h2>
        <p>{b.observation}</p>
      </section>
      {b.example && (
        <section className={`${ui.card} ${styles.section}`} aria-labelledby="ex" style={{ gap: 10 }}>
          <div className={styles.exHead}>
            <h2 id="ex" className={ui.sectionLabel}>Exemple</h2>
            <span className={styles.exWho}>Conversation avec {b.example.characterName}</span>
          </div>
          <Example said={b.example.said} corrected={b.example.corrected} lang={lang} compact />
        </section>
      )}
      <section className={`${ui.card} ${styles.section}`} aria-labelledby="evo" style={{ gap: 10 }}>
        <div className={styles.evoHead}>
          <h2 id="evo" className={ui.sectionLabel}>Évolution</h2>
          <p className={styles.exWho}>Occurrences sur les 4 dernières conversations</p>
        </div>
        <BarChart values={b.evolution} labels={labels} ariaLabel={aria} height={100} />
      </section>
      <div className={ui.spacer} />
      <div className={ui.actions}>
        <Link to="/recherche" className={ui.primary}>Reprendre une conversation</Link>
        <Link to="/blocages" className={ui.secondary}>Retour aux blocages</Link>
      </div>
    </main>
  );
}
