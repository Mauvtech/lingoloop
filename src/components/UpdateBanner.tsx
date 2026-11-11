import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './UpdateBanner.module.css';

/** Enregistre le service worker et signale une nouvelle version (registerType: 'prompt'). */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div role="status" className={styles.banner}>
      <span>Nouvelle version disponible</span>
      <span className={styles.actions}>
        <button type="button" className={styles.update} onClick={() => void updateServiceWorker(true)}>
          Mettre à jour
        </button>
        <button type="button" className={styles.later} onClick={() => setNeedRefresh(false)}>
          Plus tard
        </button>
      </span>
    </div>
  );
}
