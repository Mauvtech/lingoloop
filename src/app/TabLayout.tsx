import { Outlet } from 'react-router-dom';
import { TabBar } from '../components/TabBar';
import styles from './Layout.module.css';

/** Écrans avec barre d'onglets : le contenu défile, la barre reste collée en bas. */
export function TabLayout() {
  return (
    <div className={styles.withTabs}>
      <div className={styles.content}>
        <Outlet />
      </div>
      <TabBar />
    </div>
  );
}
