import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BackIcon } from '../assets/Icons';
import { Sheet } from '../components/Sheet';
import ui from '../components/ui.module.css';
import { useApp } from '../store/appStore';

export default function Privacy() {
  const clearAll = useApp((s) => s.clearAll);
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  return (
    <main className={`${ui.screen} ${ui.screenCompact}`}>
      <Link to="/profil" className={ui.back}>
        <BackIcon />
        Profil
      </Link>
      <h1 className={ui.title} style={{ fontSize: 28 }}>Confidentialité et données</h1>
      <section className={`${ui.card} ${ui.cardPad}`}>
        <p>
          Tes conversations et tes réglages restent sur cet appareil. Seul le texte des échanges est envoyé à l'IA pendant la
          conversation et pour le diagnostic ; il n'est pas conservé sur nos serveurs.
        </p>
      </section>
      <div className={ui.spacer} />
      <button type="button" className={`${ui.primary} ${ui.danger}`} onClick={() => setConfirm(true)}>
        Effacer mes données
      </button>
      {confirm && (
        <Sheet
          title="Effacer toutes tes données ?"
          description="Tes conversations, tes blocages et tes réglages seront supprimés de cet appareil. Cette action est définitive."
          onClose={() => setConfirm(false)}
        >
          <div className={ui.actions}>
            <button
              type="button"
              className={`${ui.primary} ${ui.danger}`}
              onClick={() => {
                void clearAll().then(() => navigate('/', { replace: true }));
              }}
            >
              Effacer
            </button>
            <button type="button" className={ui.secondary} onClick={() => setConfirm(false)}>Annuler</button>
          </div>
        </Sheet>
      )}
    </main>
  );
}
