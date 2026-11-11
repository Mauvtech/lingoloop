import { Link } from 'react-router-dom';
import { ChevronRight } from '../assets/Icons';
import { ImprovingIcon, TileHourglass, TileSailboat } from '../assets/Illustrations';
import { BarChart } from '../components/BarChart';
import ui from '../components/ui.module.css';
import { plural } from '../domain/format';
import { progressionStats } from '../domain/progression';
import { useApp } from '../store/appStore';
import styles from './Progression.module.css';

export default function Progression() {
  const conversations = useApp((s) => s.conversations);
  const lang = useApp((s) => s.settings.lang);
  const stats = progressionStats(conversations, lang);
  const values = stats.chart.map((c) => c.value);
  const aria = `Blocages repérés : ${stats.chart.map((c, i) => `${c.value} à la conversation ${i + 1}`).join(', ')}`;

  return (
    <main className={ui.screen} style={{ paddingTop: 'calc(64px + env(safe-area-inset-top))' }}>
      <h1 className={ui.title}>Ma progression</h1>
      <div className={styles.tiles}>
        <div className={`${styles.tile} ${styles.tileDark}`}>
          <TileSailboat />
          <span className={`${styles.big} tnum`}>{stats.count}</span>
          <span className={styles.tileLabel}>Conversations terminées</span>
        </div>
        <div className={`${styles.tile} ${ui.card}`}>
          <TileHourglass />
          <span className={`${styles.big} tnum`}>
            {stats.speakingMin}
            <span className={styles.unit}>min</span>
          </span>
          <span className={`${styles.tileLabel} ${styles.muted}`}>Temps de parole</span>
        </div>
      </div>

      {stats.count === 0 ? (
        <div className={`${ui.card} ${ui.empty}`}>
          <p className={ui.emptyText}>Pas encore de conversation</p>
          <Link to="/recherche" className={ui.primary}>Rencontrer un personnage</Link>
        </div>
      ) : (
        <>
          <section className={`${ui.card} ${styles.chart}`} aria-labelledby="evo-title">
            <div className={styles.chartHead}>
              <h2 id="evo-title" className={styles.chartTitle}>Évolution des blocages</h2>
              <p className={styles.chartSub}>Blocages repérés par conversation</p>
            </div>
            <BarChart values={values} labels={stats.chart.map((c) => c.label)} ariaLabel={aria} height={170} />
          </section>
          {stats.improvingCount > 0 && (
            <Link to="/blocages" className={styles.improving}>
              <span aria-hidden="true" className={styles.improvingIcon}><ImprovingIcon /></span>
              <span className={styles.improvingText}>
                <span className={styles.improvingTitle}>{plural(stats.improvingCount, 'blocage')} en amélioration</span>
                <span className={styles.improvingLink}>Voir le détail</span>
              </span>
              <span className={styles.improvingChevron}><ChevronRight /></span>
            </Link>
          )}
        </>
      )}
    </main>
  );
}
