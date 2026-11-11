import { STATUS_LABEL, type BlockageStatus } from '../domain/status';
import styles from './StatusPill.module.css';

export function StatusPill({ status, prefix = false }: { status: BlockageStatus; prefix?: boolean }) {
  const label = STATUS_LABEL[status];
  return (
    <span className={`${styles.pill} ${styles[status]}`}>
      <span aria-hidden="true" className={styles.dot} />
      {prefix ? `Statut : ${label.toLowerCase()}` : label}
    </span>
  );
}
