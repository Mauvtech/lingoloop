import { Link, useNavigate } from 'react-router-dom';
import { getCharacter } from '../../shared/characters';
import { AvatarSmall, HomeScene, Logo } from '../assets/Illustrations';
import { SettingRows } from '../components/SettingRows';
import { Sheet } from '../components/Sheet';
import ui from '../components/ui.module.css';
import { isResumable } from '../domain/conversation';
import { LANG_TITLE } from '../domain/types';
import { useApp } from '../store/appStore';
import styles from './Home.module.css';
import { useState } from 'react';

export default function Home() {
  const settings = useApp((s) => s.settings);
  const conversations = useApp((s) => s.conversations);
  const deleteConversation = useApp((s) => s.deleteConversation);
  const setResumeId = useApp((s) => s.setResumeId);
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(false);

  const active = conversations.find((c) => c.state === 'active');
  const resumable = active && isResumable(active, now) ? active : undefined;
  const resumeName = resumable ? getCharacter(resumable.characterIds[resumable.characterIds.length - 1] ?? '')?.name : undefined;

  return (
    <main className={ui.screen} style={{ gap: 22 }}>
      <header className={styles.top}>
        <div className={styles.brand}>
          <Logo />
          <span className={styles.brandName}>LingoLoop</span>
        </div>
        <Link to="/profil" aria-label="Mon profil" className={styles.avatar}>
          <AvatarSmall />
        </Link>
      </header>
      <div className={ui.header}>
        <h1 className={ui.title}>{LANG_TITLE[settings.lang]}</h1>
        <p className={ui.subtitle}>Rencontre un personnage IA pour discuter.</p>
      </div>
      <section className={styles.hero} aria-labelledby="next-meeting">
        <HomeScene />
        <div className={styles.heroText}>
          <span className={ui.eyebrow}>Prochaine rencontre</span>
          <h2 id="next-meeting" className={styles.heroTitle}>Personnage mystère</h2>
        </div>
        <p className={styles.heroNote}>Tu découvres qui c'est au début de la conversation.</p>
      </section>
      <SettingRows variant="home" />
      <div className={ui.spacer} />
      <Link to="/recherche" className={ui.primary}>Rencontrer un personnage</Link>

      {resumable && !dismissed && (
        <Sheet
          title={`Reprendre ta conversation avec ${resumeName ?? 'ton personnage'} ?`}
          description="Elle a été interrompue avant la fin."
          onClose={() => setDismissed(true)}
        >
          <div className={ui.actions}>
            <button
              type="button"
              className={ui.primary}
              onClick={() => {
                setResumeId(resumable.id);
                navigate('/conversation');
              }}
            >
              Reprendre
            </button>
            <button
              type="button"
              className={ui.secondary}
              onClick={() => {
                setDismissed(true);
                void deleteConversation(resumable.id);
              }}
            >
              Abandonner
            </button>
          </div>
        </Sheet>
      )}
    </main>
  );
}
