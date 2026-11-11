import { Link } from 'react-router-dom';
import { BellIcon, ChevronRight, LockIcon, NotebookIcon } from '../assets/Icons';
import { AvatarLarge } from '../assets/Illustrations';
import { InstallPrompt } from '../components/InstallPrompt';
import { SettingRows } from '../components/SettingRows';
import ui from '../components/ui.module.css';
import styles from './Profile.module.css';

export default function Profile() {
  return (
    <main className={ui.screen} style={{ gap: 20, paddingTop: 'calc(60px + env(safe-area-inset-top))' }}>
      <header className={styles.head}>
        <AvatarLarge />
        <h1 className={ui.title}>Mon profil</h1>
      </header>
      <section className={styles.section} aria-labelledby="practice">
        <h2 id="practice" className={`${ui.sectionLabel} ${styles.label}`}>Ma pratique</h2>
        <SettingRows variant="profile" />
      </section>
      <section className={styles.section} aria-labelledby="account">
        <h2 id="account" className={`${ui.sectionLabel} ${styles.label}`}>Mon compte</h2>
        <div className={ui.group}>
          <Link to="/profil/historique" className={ui.row}>
            <span className={ui.rowIcon}><NotebookIcon /></span>
            <span className={ui.rowLabel} style={{ fontWeight: 700 }}>Historique des conversations</span>
            <span className={ui.chevron}><ChevronRight /></span>
          </Link>
          <Link to="/profil/confidentialite" className={ui.row}>
            <span className={ui.rowIcon}><LockIcon /></span>
            <span className={ui.rowLabel} style={{ fontWeight: 700 }}>Confidentialité et données</span>
            <span className={ui.chevron}><ChevronRight /></span>
          </Link>
          <div className={ui.row}>
            <span className={ui.rowIcon}><BellIcon /></span>
            <span className={ui.rowLabel} style={{ fontWeight: 700 }}>Notifications</span>
            <span className={styles.soon}>Bientôt disponible</span>
          </div>
        </div>
      </section>
      <InstallPrompt />
    </main>
  );
}
