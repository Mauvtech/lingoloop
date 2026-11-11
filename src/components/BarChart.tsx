import styles from './BarChart.module.css';

interface Props {
  values: number[];
  labels: string[];
  /** Phrase d'accessibilité, ex. « Blocages repérés : 5 à la conversation 1, … ». */
  ariaLabel: string;
  height: number;
}

/** Histogramme HTML/CSS : dernière barre en orange, les autres en bleu clair. */
export function BarChart({ values, labels, ariaLabel, height }: Props) {
  const max = Math.max(1, ...values);
  const barMax = height - 34;
  return (
    <div>
      <div role="img" aria-label={ariaLabel} className={styles.bars} style={{ height }}>
        {values.map((v, i) => (
          <div key={i} className={styles.col}>
            <span className={`${styles.value} tnum`}>{v}</span>
            <div
              className={i === values.length - 1 ? `${styles.bar} ${styles.last}` : styles.bar}
              style={{ height: Math.max(4, Math.round((v / max) * barMax)) }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className={styles.labels}>
        {labels.map((l, i) => (
          <span key={l} className={i === labels.length - 1 ? styles.current : undefined}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
