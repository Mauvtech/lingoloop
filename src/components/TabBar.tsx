import { NavLink } from 'react-router-dom';
import { LighthouseIcon, RockWaveIcon, SailboatIcon } from '../assets/TabIcons';
import styles from './TabBar.module.css';

const TABS = [
  { to: '/', label: 'Accueil', Icon: LighthouseIcon, end: true },
  { to: '/progression', label: 'Progression', Icon: SailboatIcon, end: true },
  { to: '/blocages', label: 'Blocages', Icon: RockWaveIcon, end: true },
] as const;

export function TabBar() {
  return (
    <nav aria-label="Navigation principale" className={styles.bar}>
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? `${styles.tab} ${styles.active}` : styles.tab)}>
          {({ isActive }) => (
            <>
              <Icon active={isActive} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
