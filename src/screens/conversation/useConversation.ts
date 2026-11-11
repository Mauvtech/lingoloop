import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCharacter, type Character } from '../../../shared/characters';
import { MAX_TURN_CHARS, MAX_TURNS, type Turn } from '../../../shared/schemas';
import {
  elapsedMs,
  isTimeUp,
  needsEndConfirmation,
  newTimer,
  pauseTimer,
  startTimer,
  transition,
  typedSpeakingSec,
  type ConvEvent,
  type Phase,
  type Timer,
} from '../../domain/conversation';
import { countWords } from '../../domain/format';
import { pickCharacter } from '../../domain/pick';
import { LANG_BCP47, type Conversation } from '../../domain/types';
import { OfflineError, requestReply } from '../../services/api';
import { isRecognitionSupported, startRecognition, type RecognitionSession } from '../../services/speech/recognition';
import { loadVoices, pickVoice, speak, type SpeakHandle } from '../../services/speech/synthesis';
import { useApp } from '../../store/appStore';

export const SAVE_EVERY_MS = 10_000;

function currentCharacterId(c: Conversation): string {
  return c.characterIds[c.characterIds.length - 1] ?? 'nova';
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface Initial {
  conv: Conversation;
  phase: Phase;
  timer: Timer;
  /** Nouvelle conversation : réplique à prononcer au démarrage. */
  speakFirst?: { text: string; character: Character };
  source: 'resume' | 'match';
}

/** État initial, lu dans le store sans effet de bord : reprise ou nouvelle conversation. */
function buildInitial(): Initial | null {
  const st = useApp.getState();
  const t = Date.now();
  const resumed = st.resumeId ? st.conversations.find((c) => c.id === st.resumeId && c.state === 'active') : undefined;
  if (resumed) {
    return { conv: { ...resumed, lastSavedAt: t }, phase: 'idle', timer: startTimer(newTimer(resumed.durationSec * 1000), t), source: 'resume' };
  }
  const match = st.match;
  const character = match ? getCharacter(match.characterId) : undefined;
  if (!match || !character) return null;
  const conv: Conversation = {
    id: newId(),
    lang: st.settings.lang,
    state: 'active',
    startedAt: t,
    lastSavedAt: t,
    plannedSec: st.settings.durationMin * 60,
    durationSec: 0,
    speakingSec: 0,
    characterIds: [character.id],
    turns: [{ role: 'character', characterId: character.id, text: match.firstReply, at: t }],
    diagnosis: { status: 'pending', blockages: [] },
  };
  return { conv, phase: 'characterSpeaking', timer: startTimer(newTimer(), t), speakFirst: { text: match.firstReply, character }, source: 'match' };
}

export function useConversation() {
  const navigate = useNavigate();
  const saveConversation = useApp((s) => s.saveConversation);
  const deleteConversation = useApp((s) => s.deleteConversation);

  const [initial] = useState(buildInitial);
  const [conv, setConv] = useState<Conversation | null>(initial?.conv ?? null);
  const convRef = useRef<Conversation | null>(initial?.conv ?? null);
  const [phase, setPhase] = useState<Phase>(initial?.phase ?? 'thinking');
  const phaseRef = useRef<Phase>(initial?.phase ?? 'thinking');
  const timerRef = useRef<Timer>(initial?.timer ?? newTimer());
  const [elapsedSec, setElapsedSec] = useState(initial ? Math.floor(initial.conv.durationSec) : 0);
  const [interim, setInterim] = useState('');
  const [micUnavailable, setMicUnavailable] = useState(() => !isRecognitionSupported());
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [confirmEnd, setConfirmEnd] = useState(false);
  const speakRef = useRef<SpeakHandle | null>(null);
  const recRef = useRef<RecognitionSession | null>(null);
  const listenStartRef = useRef<number | null>(null);
  const lastSaveRef = useRef(0);
  const startedRef = useRef(false);

  const dispatch = useCallback((event: ConvEvent): Phase => {
    const next = transition(phaseRef.current, event);
    phaseRef.current = next;
    setPhase(next);
    return next;
  }, []);

  const snapshot = useCallback((c: Conversation, extra: Partial<Conversation> = {}): Conversation => {
    const t = Date.now();
    return {
      ...c,
      durationSec: Math.min(c.plannedSec, Math.floor(elapsedMs(timerRef.current, t) / 1000)),
      lastSavedAt: t,
      ...extra,
    };
  }, []);

  const persist = useCallback(
    (c: Conversation) => {
      convRef.current = c;
      setConv(c);
      lastSaveRef.current = Date.now();
      void saveConversation(c);
    },
    [saveConversation],
  );

  const stopAudio = useCallback(() => {
    speakRef.current?.cancel();
    speakRef.current = null;
    recRef.current?.abort();
    recRef.current = null;
  }, []);

  const finish = useCallback(
    (reason: 'manual' | 'auto') => {
      const c = convRef.current;
      if (!c || phaseRef.current === 'ended') return;
      stopAudio();
      timerRef.current = pauseTimer(timerRef.current, Date.now());
      dispatch({ type: 'END' });
      const userTurns = c.turns.filter((t) => t.role === 'user').length;
      if (reason === 'auto' && userTurns === 0) {
        void deleteConversation(c.id);
        navigate('/', { replace: true });
        return;
      }
      const ended = snapshot(c, { state: 'ended', endedAt: Date.now(), diagnosis: { status: 'pending', blockages: [] } });
      persist(ended);
      navigate(`/diagnostic/${ended.id}`, { replace: true });
    },
    [deleteConversation, dispatch, navigate, persist, snapshot, stopAudio],
  );

  /** Synthèse vocale de la réplique (la phase est déjà `characterSpeaking`). */
  const voiceOut = useCallback(
    async (text: string, character: Character) => {
      const voices = mutedRef.current ? [] : await loadVoices();
      if (mutedRef.current) {
        if (phaseRef.current === 'characterSpeaking') dispatch({ type: 'SPEECH_DONE' });
        return;
      }
      const voice = pickVoice(voices, LANG_BCP47[convRef.current?.lang ?? 'en'], character.voiceHint);
      if (phaseRef.current !== 'characterSpeaking') return;
      const handle = voice
        ? speak(text, voice, {
            onStart: () => undefined,
            onEnd: () => {
              speakRef.current = null;
              if (phaseRef.current === 'characterSpeaking') dispatch({ type: 'SPEECH_DONE' });
            },
          })
        : null;
      if (!handle) {
        setVoiceAvailable(false);
        dispatch({ type: 'SPEECH_DONE' });
        return;
      }
      speakRef.current = handle;
    },
    [dispatch],
  );

  const characterSpeak = useCallback(
    (text: string, character: Character) => {
      dispatch({ type: 'REPLY' });
      void voiceOut(text, character);
    },
    [dispatch, voiceOut],
  );

  const fetchReply = useCallback(async () => {
    const c = convRef.current;
    if (!c) return;
    const characterId = currentCharacterId(c);
    const character = getCharacter(characterId);
    if (!character) return;
    const remainingSec = Math.max(0, Math.round(c.plannedSec - elapsedMs(timerRef.current, Date.now()) / 1000));
    try {
      const reply = await requestReply({ lang: c.lang, characterId, turns: c.turns.slice(-MAX_TURNS), remainingSec });
      const latest = convRef.current;
      if (!latest || phaseRef.current !== 'thinking') return;
      const turn: Turn = { role: 'character', characterId, text: reply, at: Date.now() };
      persist(snapshot({ ...latest, turns: [...latest.turns, turn] }));
      characterSpeak(reply, character);
    } catch (e) {
      if (phaseRef.current !== 'thinking') return;
      timerRef.current = pauseTimer(timerRef.current, Date.now());
      setErrorText(e instanceof OfflineError ? 'Connexion nécessaire pour parler avec un personnage.' : "La réponse n'est pas arrivée.");
      dispatch({ type: 'FAIL' });
    }
  }, [characterSpeak, dispatch, persist, snapshot]);

  const submit = useCallback(
    (raw: string, typed: boolean) => {
      const c = convRef.current;
      const text = raw.trim().slice(0, MAX_TURN_CHARS);
      if (!c || !text) return;
      if (phaseRef.current === 'characterSpeaking') {
        speakRef.current?.cancel();
        speakRef.current = null;
        if (phaseRef.current === 'characterSpeaking') dispatch({ type: 'SPEECH_DONE' });
      }
      if (phaseRef.current !== 'idle' && phaseRef.current !== 'listening') return;
      const turn: Turn = { role: 'user', characterId: currentCharacterId(c), text, at: Date.now() };
      let speakingSec = c.speakingSec;
      if (typed) speakingSec += typedSpeakingSec(countWords(text));
      else if (listenStartRef.current !== null) speakingSec += (Date.now() - listenStartRef.current) / 1000;
      listenStartRef.current = null;
      const next = snapshot({ ...c, turns: [...c.turns, turn], speakingSec: Math.round(speakingSec * 10) / 10 });
      persist(next);
      setInterim('');
      dispatch({ type: 'SUBMIT' });
      if (next.turns.length >= MAX_TURNS) {
        finish('auto');
        return;
      }
      void fetchReply();
    },
    [dispatch, fetchReply, finish, persist, snapshot],
  );

  const toggleMic = useCallback(() => {
    const c = convRef.current;
    if (!c) return;
    if (phaseRef.current === 'listening') {
      recRef.current?.stop();
      return;
    }
    if (phaseRef.current !== 'idle' && phaseRef.current !== 'characterSpeaking') return;
    if (phaseRef.current === 'characterSpeaking') {
      speakRef.current?.cancel();
      speakRef.current = null;
      if (phaseRef.current === 'characterSpeaking') dispatch({ type: 'SPEECH_DONE' });
    }
    const session = startRecognition(LANG_BCP47[c.lang], {
      onInterim: setInterim,
      onEnd: (text) => {
        recRef.current = null;
        if (phaseRef.current !== 'listening') return;
        if (text.trim()) submit(text, false);
        else {
          if (listenStartRef.current !== null && convRef.current) {
            const add = (Date.now() - listenStartRef.current) / 1000;
            persist(snapshot({ ...convRef.current, speakingSec: Math.round((convRef.current.speakingSec + add) * 10) / 10 }));
          }
          listenStartRef.current = null;
          setInterim('');
          dispatch({ type: 'CANCEL_LISTEN' });
        }
      },
      onError: (kind) => {
        if (kind !== 'denied') return;
        recRef.current = null;
        listenStartRef.current = null;
        setInterim('');
        setMicUnavailable(true);
        if (phaseRef.current === 'listening') dispatch({ type: 'CANCEL_LISTEN' });
      },
    });
    if (!session) {
      setMicUnavailable(true);
      return;
    }
    recRef.current = session;
    listenStartRef.current = Date.now();
    setInterim('');
    dispatch({ type: 'LISTEN' });
  }, [dispatch, persist, snapshot, submit]);

  const nextCharacter = useCallback(() => {
    const c = convRef.current;
    if (!c || (phaseRef.current !== 'idle' && phaseRef.current !== 'characterSpeaking')) return;
    stopAudio();
    const character = pickCharacter(c.characterIds);
    persist(snapshot({ ...c, characterIds: [...c.characterIds, character.id] }));
    if (phaseRef.current === 'characterSpeaking') dispatch({ type: 'SPEECH_DONE' });
    dispatch({ type: 'SWITCH' });
    void fetchReply();
  }, [dispatch, fetchReply, persist, snapshot, stopAudio]);

  const retry = useCallback(() => {
    if (phaseRef.current !== 'error') return;
    setErrorText('');
    if (!document.hidden) timerRef.current = startTimer(timerRef.current, Date.now());
    dispatch({ type: 'RETRY' });
    void fetchReply();
  }, [dispatch, fetchReply]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next && phaseRef.current === 'characterSpeaking') {
      speakRef.current?.cancel();
      speakRef.current = null;
      if (phaseRef.current === 'characterSpeaking') dispatch({ type: 'SPEECH_DONE' });
    }
  }, [dispatch]);

  const requestEnd = useCallback(() => {
    const c = convRef.current;
    if (!c) return;
    const elapsedSec = elapsedMs(timerRef.current, Date.now()) / 1000;
    const userTurns = c.turns.filter((t) => t.role === 'user').length;
    if (needsEndConfirmation(elapsedSec, userTurns)) setConfirmEnd(true);
    else finish('manual');
  }, [finish]);

  const quit = useCallback(() => {
    const c = convRef.current;
    stopAudio();
    phaseRef.current = 'ended';
    if (c) void deleteConversation(c.id);
    navigate('/', { replace: true });
  }, [deleteConversation, navigate, stopAudio]);

  // Démarrage : effets de bord uniquement (l'état initial est calculé par buildInitial).
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (!initial) {
      navigate('/', { replace: true });
      return;
    }
    const st = useApp.getState();
    if (initial.source === 'resume') st.setResumeId(null);
    else st.setMatch(null);
    lastSaveRef.current = Date.now();
    void saveConversation(initial.conv);
    if (initial.speakFirst) void voiceOut(initial.speakFirst.text, initial.speakFirst.character);
  }, [initial, navigate, saveConversation, voiceOut]);

  // Horloge : affichage, fin automatique, sauvegarde toutes les 10 s.
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      const c = convRef.current;
      if (!c || phaseRef.current === 'ended') return;
      setElapsedSec(Math.min(c.plannedSec, Math.floor(elapsedMs(timerRef.current, t) / 1000)));
      if (isTimeUp(timerRef.current, c.plannedSec, t)) {
        finish('auto');
        return;
      }
      if (t - lastSaveRef.current >= SAVE_EVERY_MS) persist(snapshot(c));
    }, 250);
    return () => clearInterval(id);
  }, [finish, persist, snapshot]);

  // Onglet caché : chrono en pause.
  useEffect(() => {
    const onVis = () => {
      const t = Date.now();
      if (document.hidden) {
        timerRef.current = pauseTimer(timerRef.current, t);
        if (convRef.current && phaseRef.current !== 'ended') persist(snapshot(convRef.current));
      } else if (phaseRef.current !== 'error' && phaseRef.current !== 'ended') {
        timerRef.current = startTimer(timerRef.current, t);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [persist, snapshot]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  const character = conv ? getCharacter(currentCharacterId(conv)) : undefined;
  const lastReply = conv ? [...conv.turns].reverse().find((t) => t.role === 'character' && t.characterId === currentCharacterId(conv))?.text : undefined;

  return {
    conv,
    character,
    phase,
    elapsedSec,
    lastReply: phase === 'thinking' && lastReply === undefined ? undefined : lastReply,
    interim,
    micUnavailable,
    muted,
    voiceAvailable,
    errorText,
    confirmEnd,
    setConfirmEnd,
    toggleMic,
    toggleMute,
    submitText: (text: string) => submit(text, true),
    nextCharacter,
    retry,
    requestEnd,
    quit,
  };
}
