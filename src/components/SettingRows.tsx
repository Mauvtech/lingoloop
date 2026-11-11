import { useState } from 'react';
import { FlagIcon, HourglassIcon, ChevronRight } from '../assets/Icons';
import { DURATIONS, LANG_LABEL, type DurationMin, type Lang } from '../domain/types';
import { useApp } from '../store/appStore';
import { ChoiceList, Sheet } from './Sheet';
import ui from './ui.module.css';

/** Lignes Langue / Durée (Accueil et Profil) ouvrant chacune un bottom sheet. */
export function SettingRows({ variant }: { variant: 'home' | 'profile' }) {
  const settings = useApp((s) => s.settings);
  const setSettings = useApp((s) => s.setSettings);
  const [open, setOpen] = useState<'lang' | 'duration' | null>(null);
  const home = variant === 'home';
  const durationLabel = home ? `${settings.durationMin} minutes` : `${settings.durationMin} min`;

  return (
    <>
      <div className={ui.group}>
        <button type="button" className={ui.row} onClick={() => setOpen('lang')} aria-haspopup="dialog">
          <span className={ui.rowIcon}><FlagIcon /></span>
          <span className={ui.rowLabel} style={home ? { color: 'var(--ink-muted)' } : { fontWeight: 700 }}>{home ? 'Langue' : 'Langue pratiquée'}</span>
          <span className={ui.rowValue} style={home ? undefined : { fontWeight: 400, color: 'var(--ink-muted)' }}>{LANG_LABEL[settings.lang]}</span>
          <span className={ui.chevron}><ChevronRight /></span>
        </button>
        <button type="button" className={ui.row} onClick={() => setOpen('duration')} aria-haspopup="dialog">
          <span className={ui.rowIcon}><HourglassIcon /></span>
          <span className={ui.rowLabel} style={home ? { color: 'var(--ink-muted)' } : { fontWeight: 700 }}>{home ? 'Durée' : 'Durée par défaut'}</span>
          <span className={ui.rowValue} style={home ? undefined : { fontWeight: 400, color: 'var(--ink-muted)' }}>{durationLabel}</span>
          <span className={ui.chevron}><ChevronRight /></span>
        </button>
      </div>
      {open === 'lang' && (
        <Sheet title="Langue pratiquée" onClose={() => setOpen(null)}>
          <ChoiceList<Lang>
            options={(['en', 'es'] as const).map((l) => ({ value: l, label: LANG_LABEL[l] }))}
            value={settings.lang}
            onChange={(lang) => {
              void setSettings({ lang });
              setOpen(null);
            }}
          />
        </Sheet>
      )}
      {open === 'duration' && (
        <Sheet title="Durée de la conversation" onClose={() => setOpen(null)}>
          <ChoiceList<DurationMin>
            options={DURATIONS.map((d) => ({ value: d, label: `${d} minutes` }))}
            value={settings.durationMin}
            onChange={(durationMin) => {
              void setSettings({ durationMin });
              setOpen(null);
            }}
          />
        </Sheet>
      )}
    </>
  );
}
