# LingoLoop — Prompt de build V1 (Claude Code, one-shot)

> **À coller tel quel dans Claude Code, à la racine du repo `lingoloop`.**
> Les maquettes de référence sont dans `design/maquettes/` (8 écrans `.dc.html` + `canvas.json`). Elles sont la **source de vérité visuelle et textuelle**.

---

## 0. Ton rôle et tes règles d'exécution

Tu es le seul développeur de la V1 de LingoLoop. Tu livres en une passe une application **qui tourne, testée, fidèle aux maquettes**, sans rien ajouter qui ne soit pas demandé ici.

Règles non négociables :

1. **Avance phase par phase (§9).** Une phase n'est terminée que lorsque **tous ses points de contrôle passent**. Ensuite tu fais un commit (`feat(phaseN): …`) et tu passes à la suivante. Tu ne passes jamais à la suite avec un contrôle rouge.
2. **Les maquettes priment.** Couleurs, tailles, rayons, textes (accents, ponctuation, majuscules) : tu les reprends **à l'identique** depuis `design/maquettes/*.dc.html`. Pour les illustrations et les icônes, tu portes les `<svg>` des maquettes en `react-native-svg`, sans les redessiner.
3. **Rien d'inventé hors périmètre.** Pas d'auth, pas de paiement, pas d'exercices, pas de gamification, pas de push notifications, pas de 2e langue. Si quelque chose te semble manquer, choisis l'option la plus simple qui respecte ce document et note-la dans `DECISIONS.md`. **Ne t'arrête pas pour poser une question.**
4. **Pas d'emoji dans l'UI.** Pas de texte lorem ipsum. Pas de fausse donnée affichée à l'utilisateur : toute donnée affichée vient du stockage local ou de l'IA.
5. **Ne désactive jamais un test, une règle de lint ou le typage strict** pour faire passer un contrôle. Tu corriges la cause.
6. **L'app doit fonctionner sans clé API** grâce au mode mock (§7.4). C'est ce mode qui fait tourner les tests et la démo.
7. À la fin, tu rends le rapport décrit au §11.

---

## 1. Produit en une phrase

LingoLoop est une app mobile où l'on **pratique l'oral d'une langue (V1 : anglais) en conversation vocale minutée avec un personnage IA mystère**. À la fin, l'app affiche un **diagnostic des blocages** fondé uniquement sur ce que l'utilisateur a réellement dit. Ces blocages sont ensuite suivis dans le temps. **Pas d'exercices : on progresse en parlant.**

Public : francophones. **L'interface est en français, les conversations en anglais.**

---

## 2. Périmètre V1

### Dans le périmètre
- Les 8 écrans des maquettes, avec leur navigation (§5).
- 3 écrans utilitaires non maquettés, au même style : sélecteur de durée (bottom sheet), Historique, Confidentialité (§5.9).
- Une conversation vocale : TTS pour le personnage, STT pour l'utilisateur, **plus une saisie texte de secours** quand le micro est indisponible ou refusé.
- Un timer de session (3 / 5 / 10 min, 5 par défaut) avec fin automatique.
- Le diagnostic IA en fin de session (JSON validé).
- L'agrégation des blocages et le calcul des statuts (§6.3).
- Les statistiques de progression (§6.4).
- La persistance locale sur l'appareil, plus l'effacement total des données.
- Un petit serveur proxy qui garde la clé API hors de l'app.

### Hors périmètre (ne pas faire)
Comptes et login, synchronisation cloud, autres langues que l'anglais (le sélecteur affiche « Anglais » seul), notifications (la ligne est affichée désactivée avec « Bientôt »), exercices, streaks, badges, partage, analytics, i18n de l'interface, mode sombre, tablette.

---

## 3. Stack imposée

| Couche | Choix |
|---|---|
| App | **Expo (dernier SDK stable) + React Native + TypeScript strict**, `expo-router` |
| UI | `StyleSheet` natif + `react-native-svg`. Pas de lib UI. Police **Lato** (400/700/900) via `@expo-google-fonts/lato` |
| État | `zustand` |
| Persistance | `@react-native-async-storage/async-storage`, derrière une interface `Storage` |
| TTS | `expo-speech` (voix `en-US`) |
| STT | `expo-speech-recognition`, derrière une interface `SpeechToText`. Fallback : saisie texte |
| Serveur | `server/` : Node 20 + **Hono** + **Zod**, SDK `@anthropic-ai/sdk` |
| LLM | Claude, modèle lu dans `ANTHROPIC_MODEL` (défaut `claude-sonnet-5-5`) |
| Tests | **Vitest** pour `src/domain` et `server/`. `tsc --noEmit`, ESLint (config Expo) |
| Contrôle visuel | Export web Expo + Playwright à 390×844 (§9, phase 6) |

### Arborescence attendue
```
app/                      # routes expo-router
  _layout.tsx
  (tabs)/_layout.tsx      # tab bar : Accueil / Progression / Blocages
  (tabs)/index.tsx        # 01 Accueil
  (tabs)/progression.tsx  # 05
  (tabs)/blocages/index.tsx   # 06
  (tabs)/blocages/[id].tsx    # 07
  recherche.tsx           # 02 (modal plein écran, sans tab bar)
  conversation.tsx        # 03 (sans tab bar)
  diagnostic.tsx          # 04 (sans tab bar)
  profil/index.tsx        # 08
  profil/historique.tsx
  profil/confidentialite.tsx
src/
  theme/tokens.ts         # §4, seule source des couleurs et tailles
  components/             # Button, Card, ListRow, StatusPill, BarChart, TabBar, illustrations/*
  domain/                 # logique pure, 100 % testée, aucun import RN
    types.ts  session.ts  blocages.ts  progression.ts  diagnostic.ts  characters.ts
  services/               # storage, tts, stt, api (client du serveur)
  store/                  # zustand
server/
  src/index.ts  src/routes/*.ts  src/llm/{claude.ts,mock.ts,prompts.ts}  src/schemas.ts
  test/
design/maquettes/         # NE PAS MODIFIER
DECISIONS.md
README.md
.env.example              # EXPO_PUBLIC_API_URL, ANTHROPIC_API_KEY, ANTHROPIC_MODEL, LLM_MODE=mock|live
```

---

## 4. Design tokens (extraits des maquettes, à mettre dans `src/theme/tokens.ts`)

**Couleurs**
| Token | Hex | Usage |
|---|---|---|
| `ink` | `#1F4455` | Texte principal, fond de l'écran Conversation |
| `inkMuted` | `#4A6B7A` | Texte secondaire, chevrons, onglets inactifs |
| `bg` | `#EAF4F8` | Fond des écrans clairs |
| `sky` | `#A9D0DF` | Illustrations, fond de l'écran Recherche, barres du graphe |
| `sea` | `#2B6A84` | Mer, carte principale, liens |
| `seaDeep` | `#245D75` | Ombres des illustrations |
| `seaLine` | `#4E88A0` | Vagues |
| `navyChip` | `#2B5A6E` | Pastilles sur l'écran Conversation |
| `onDarkMuted` | `#BFDCE7` | Texte secondaire sur fond sombre |
| `accent` | `#F2A541` | CTA principal, barre « actuelle », progression |
| `border` | `#CFE2EA` | Bordures des cartes |
| `surface` | `#FFFFFF` | Cartes |
| `danger` | `#C8442E` | Bouton « Terminer la conversation » |
| `warnBg` / `warnText` / `warnDot` | `#FDEFD6` / `#8A5200` / `#C77A0A` | Statut Récurrent, « Tu as dit » |
| `infoBg` / `infoText` | `#DCEDF3` / `#1F5368` | Statut À travailler |
| `neutralBg` / `neutralText` | `#E6EDF0` / `#3F5F6E` | Statut À suivre |
| `okBg` / `okText` | `#D9F0E6` / `#1B6650` | Correction, « en amélioration » |

**Typographie (Lato)** : H1 32/1.1/900 (30 sur Diagnostic, 28 sur Détail et Conversation, 26 sur Recherche). H2 de carte 20/900. Corps 16/1.45/400. Secondaire 14. Surtitre 12/900, uppercase, letter-spacing 0.1em. CTA 17/900. Onglets 12 (900 actif, 700 inactif). Les chiffres utilisent les chiffres tabulaires.

**Formes** : CTA hauteur 56, rayon 28. Lien secondaire hauteur 48. Cartes rayon 20 à 22, bordure 1 px `border`. Grande illustration rayon 24 à 28. Lignes de liste hauteur min 64. Pastille de statut hauteur 26, rayon 13. Tab bar hauteur 84, bordure haute 1 px. Marges latérales 24. **Zones tactiles ≥ 44 px.**

Toute valeur de couleur codée en dur hors de `tokens.ts` est un échec du contrôle C3.3.

---

## 5. Écrans (reproduire chaque maquette ; textes exacts)

Pour chaque écran, ouvre le fichier de maquette correspondant et reprends sa structure dans l'ordre. Le texte ci-dessous liste **ce qui est dynamique** et **le comportement**.

### 5.1 `01 Accueil` — `Main.dc.html`
- Logo LingoLoop. Avatar en haut à droite → **Profil**.
- « Pratiquer l'anglais » / « Rencontre un personnage IA pour discuter. »
- Carte illustrée « Prochaine rencontre / Personnage mystère / Tu découvres qui c'est au début de la conversation. »
- Ligne **Langue** = « Anglais » (sheet avec une seule option cochée). Ligne **Durée** = valeur courante (« 3 minutes » / « 5 minutes » / « 10 minutes ») → bottom sheet de choix, persisté.
- CTA « Rencontrer un personnage » → **Recherche**.

### 5.2 `02 Recherche` — `Recherche.dc.html`
- Pastille « Anglais · {durée} min ». Bouton fermer et « Annuler » → retour Accueil.
- Pendant l'affichage : tirage d'un personnage (§6.1) et pré-chargement de sa première réplique via `POST /api/conversation/start`. Les 3 points s'animent.
- « Démarrer la conversation » est désactivé (opacité réduite, `accessibilityState.disabled`) tant que la première réplique n'est pas prête. En cas d'erreur réseau : texte « Connexion impossible. Réessaie. » et bouton « Réessayer ».

### 5.3 `03 Conversation` — `Conversation.dc.html` (fond `ink`)
- En-tête : **nom du personnage en majuscules + rôle**, timer `mm:ss / mm:ss`, barre de progression `accent` (`accessibilityRole="progressbar"`).
- Portrait du personnage (SVG propre à chaque personnage, Nova = celui de la maquette ; les 2 autres reprennent le même gabarit avec une variation de couleur et d'accessoire).
- Pastille d'état : « {Nom} parle » (barres animées) / « À toi » / « J'écoute… ».
- Bulle : dernière réplique du personnage, en anglais (`lang="en"`, 19/700).
- 3 boutons :
  - **Haut-parleur** : bascule la lecture TTS (on/off). Off = la bulle reste lisible.
  - **Microphone** (gros bouton accent) : appui = démarrer l'écoute, ré-appui = envoyer. Le transcript s'affiche en direct sous la bulle. Si le STT est indisponible ou refusé, le bouton ouvre un champ texte « Écris ta réponse en anglais » avec un bouton Envoyer.
  - **Personnage suivant** : abandonne la session (sans diagnostic, non comptée) → Recherche avec un autre personnage.
- « Terminer la conversation » (`danger`) → fin de session → **Diagnostic**.
- Timer à 00:00 → fin automatique → Diagnostic.
- Le personnage ne parle jamais pendant que l'utilisateur parle. Un seul tour à la fois.

### 5.4 `04 Diagnostic` — `Diagnostic.dc.html`
- Bandeau illustré avec la pastille « {Nom} · {durée écoulée mm:ss} ».
- « Conversation terminée » / « Résumé basé sur ce qui a été dit. »
- Pendant la génération : squelettes de cartes et le texte « Analyse de ta conversation… ».
- **1 à 3 cartes de blocage**, ordonnées par gravité. Chaque carte contient le surtitre « Blocage repéré », le libellé de la catégorie et, si elle existe, une paire « Tu as dit » (mot fautif souligné en vague `warnText`) / « Correction » (mot corrigé en gras `okText`). Sinon, une phrase d'observation (format de la 2e carte de la maquette).
- **État vide** : moins de 2 tours utilisateur, ou aucun blocage → carte unique « Pas assez d'échanges pour un diagnostic » ou « Aucun blocage repéré cette fois. »
- CTA « Voir mes blocages » → Blocages. « Retour à l'accueil » → Accueil.

### 5.5 `05 Progression` — `Progression.dc.html`
- Tuile « {n} / Conversations terminées ». Tuile « {m}min / Temps de parole » (§6.4).
- Graphe « Évolution des blocages / Blocages repérés par conversation » : **les 4 dernières conversations**. La dernière barre est en `accent`, les autres en `sky`. Hauteur proportionnelle au maximum. Libellés « Conv. 1…4 ». Label d'accessibilité généré à partir des données.
- Carte verte « {k} blocages en amélioration / Voir le détail » → Blocages. Masquée si k = 0. Accord au singulier si k = 1 (« 1 blocage en amélioration »).
- **État vide** (0 conversation) : tuiles à 0, graphe remplacé par « Termine une conversation pour voir ta progression. » et CTA « Rencontrer un personnage ».

### 5.6 `06 Blocages` — `Blocages.dc.html`
- Liste de tous les blocages rencontrés, triés par statut (Récurrent > À travailler > À suivre > Résolu), puis par date de dernière occurrence. Chaque ligne : icône de catégorie, libellé, `StatusPill`. Tap → Détail.
- Bandeau sombre fixe en bas : « Aucun exercice. / Tu progresses en parlant. »
- **État vide** : « Aucun blocage pour l'instant. Lance une conversation pour commencer. »

### 5.7 `07 Détail d'un blocage` — `BlocageDetail.dc.html`
- Retour « Blocages ». Icône, titre, pastille « Statut : {statut en minuscules} ».
- **Observation** : texte de la catégorie (§6.2).
- **Exemple** : le plus récent, avec « Conversation avec {Nom} » et la paire Tu as dit / Correction. La section est masquée si aucun exemple n'existe.
- **Évolution** : « Occurrences sur les 4 dernières sessions ». Barres S1…S4 sur les 4 dernières sessions **terminées** (0 si absent ce jour-là). Dernière barre en `accent`.
- CTA « Reprendre une conversation » → Recherche. « Retour aux blocages ».

> Note : la maquette dit « Hésitations ». Le libellé implémenté est « Occurrences », car c'est ce que l'on mesure. Consigne ce choix dans `DECISIONS.md`.

### 5.8 `08 Profil` — `Profil.dc.html`
- **Ma pratique** : Langue pratiquée (Anglais) ; Durée par défaut (même sheet que sur l'Accueil, même valeur).
- **Mon compte** : Historique des conversations → `profil/historique` ; Confidentialité et données → `profil/confidentialite` ; Notifications → ligne désactivée, valeur « Bientôt ».
- Tab bar présente, aucun onglet actif (comme sur la maquette).

### 5.9 Écrans utilitaires (non maquettés, même langage visuel)
- **Sheet Durée** : 3 options en lignes de 64 px, coche `accent` sur la valeur courante.
- **Historique** : liste des sessions terminées (date `jj/mm`, personnage, durée, nombre de blocages). Lecture seule.
- **Confidentialité** : texte court « Tes conversations sont stockées uniquement sur cet appareil. Le texte de tes réponses est envoyé à notre serveur pour générer les répliques et le diagnostic, puis n'est pas conservé. » Bouton `danger` « Effacer toutes mes données » avec confirmation (Alert), puis vidage du stockage et retour à l'Accueil.

### 5.10 Navigation
Tab bar (Accueil / Progression / Blocages) sur 01, 05, 06, 07, 08, avec l'icône SVG de la maquette ; actif = `ink`, 900 ; inactif = `inkMuted`. Les écrans 02, 03 et 04 sont plein écran, sans tab bar. Le retour matériel Android sur Conversation demande confirmation (« Quitter sans diagnostic ? »).

---

## 6. Logique métier (`src/domain`, fonctions pures)

### 6.1 Personnages (`characters.ts`)
3 personnages fixes. Le prompt système de chaque personnage est dans `server/src/llm/prompts.ts`.

| id | Nom | Rôle (FR, affiché) | Personnalité / sujets |
|---|---|---|---|
| `nova` | Nova | Exploratrice spatiale | Curieuse et enthousiaste ; voyages, découverte, rêves |
| `milo` | Milo | Chef de cuisine | Chaleureux et bavard ; nourriture, souvenirs, week-end |
| `iris` | Iris | Détective | Calme et pose beaucoup de questions ; récits au passé, ce qui s'est passé hier |

Tirage : au hasard parmi les personnages **différents du dernier rencontré**. « Personnage suivant » exclut aussi le personnage courant.

### 6.2 Taxonomie des blocages (fixe, codée en dur)
| id | Libellé | Observation (Détail) |
|---|---|---|
| `past_tense` | Parler au passé | Tu hésites quand tu racontes quelque chose au passé. |
| `vocabulary` | Manque de vocabulaire | Tu cherches tes mots pour décrire certaines choses. |
| `short_answers` | Réponses trop courtes | Tes réponses tiennent souvent en quelques mots. |
| `questions` | Poser des questions | Tu formules rarement des questions à ton interlocuteur. |
| `word_order` | Ordre des mots | L'ordre des mots dans tes phrases suit parfois le français. |
| `prepositions` | Prépositions | Tu confonds certaines prépositions (in, on, at…). |

Le LLM **doit** choisir parmi ces ids. Tout autre id est rejeté par Zod.

### 6.3 Statut d'un blocage (`blocages.ts`)
Calculé sur les sessions **terminées** (pas les abandons), triées par date. Soit `last5` les 5 dernières sessions et `occ(s)` le nombre d'occurrences du blocage dans la session `s`.
- **Récurrent** : présent dans ≥ 3 sessions de `last5`.
- **À travailler** : présent dans exactement 2 sessions de `last5`.
- **À suivre** : présent dans exactement 1 session de `last5`.
- **Résolu** : absent de `last5` mais présent avant. Ce statut n'est affiché que dans la liste, en dernier, avec la pastille `okBg/okText`.
- **En amélioration** (indicateur, pas un statut) : présent dans ≥ 2 sessions au total, et la somme de `occ` sur les 2 dernières sessions est **strictement inférieure** à la somme sur les 2 sessions précédentes. Il faut au moins 4 sessions terminées.

Pastilles : Récurrent = `warn*` avec point plein ; À travailler = `info*` avec point plein ; À suivre = `neutral*` avec point cerclé ; Résolu = `ok*`.

### 6.4 Progression (`progression.ts`)
- Conversations terminées = nombre de sessions `completed`.
- Temps de parole (min) = `round(Σ durée écoulée des sessions completed / 60)`. Consigne dans `DECISIONS.md` que la V1 mesure le temps de conversation et non le temps de parole pur.
- Graphe = nombre de blocages distincts par session, pour les 4 dernières sessions completed.
- `k` = nombre de blocages « en amélioration ».

### 6.5 Session (`session.ts`)
Machine à états : `searching → ready → playing(character) ⇄ listening(user) → ending → diagnosed | abandoned`. Le timer est basé sur des timestamps (pas sur un compteur d'intervalles), pour tolérer la mise en arrière-plan. En arrière-plan, le timer est mis en pause. La session est persistée à chaque tour, pour qu'un crash ne perde pas le transcript.

### 6.6 Types (`types.ts`)
```ts
type Turn = { role: 'character' | 'user'; text: string; at: number };
type Session = {
  id: string; characterId: CharacterId; language: 'en';
  plannedSec: 180 | 300 | 600; startedAt: number; endedAt?: number; elapsedSec: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  turns: Turn[]; diagnostic?: Diagnostic;
};
type Finding = {
  blocageId: BlocageId; occurrences: number; severity: 1 | 2 | 3;
  example?: { said: string; saidHighlight: string; corrected: string; correctedHighlight: string };
  note?: string; // FR, 1 phrase, si pas d'exemple
};
type Diagnostic = { findings: Finding[]; generatedAt: number; source: 'live' | 'mock' };
type Settings = { language: 'en'; durationSec: 180 | 300 | 600 };
```

### 6.7 Anti-hallucination du diagnostic (`diagnostic.ts`), règle critique
Après réception du JSON du LLM, on filtre côté client **et** côté serveur :
- `example.said` doit apparaître **mot pour mot** dans un tour `user` (comparaison insensible à la casse et aux espaces multiples). Sinon, on supprime `example` et on garde le finding uniquement s'il a une `note`.
- `saidHighlight` ⊂ `said` et `correctedHighlight` ⊂ `corrected`. Sinon, pas de surlignage.
- Au maximum 3 findings, triés par `severity` décroissante puis par `occurrences`.
- Moins de 2 tours `user` : pas d'appel LLM, diagnostic vide.

---

## 7. IA et serveur

### 7.1 Endpoints (`server/`, validés par Zod en entrée et en sortie)
- `POST /api/conversation/start` `{ characterId, language }` → `{ reply }`. Première réplique : le personnage se présente (nom + rôle) et pose une question ouverte.
- `POST /api/conversation/turn` `{ characterId, language, turns: Turn[], remainingSec }` → `{ reply }`.
- `POST /api/diagnostic` `{ characterId, turns: Turn[] }` → `Diagnostic` (filtré selon §6.7).
- `GET /health` → `{ ok: true, mode: 'mock' | 'live' }`.
Timeout de 20 s sur les appels LLM, 1 retry. Les erreurs renvoient `{ error: code }` avec un statut 4xx ou 5xx, **jamais** de stack trace. Le serveur ne journalise et ne stocke aucun transcript.

### 7.2 Prompt système d'un personnage (base commune + fiche du personnage)
- Tu joues {Nom}, {rôle EN}. Tu restes dans ton personnage. Tu parles **uniquement en anglais**, niveau A2-B1, phrases courtes.
- **1 à 2 phrases par réplique, et une question ouverte à la fin.** C'est l'utilisateur qui doit parler le plus.
- Tu ne corriges jamais l'utilisateur pendant la conversation. Tu ne commentes pas ses erreurs.
- Si l'utilisateur répond en français, tu réponds gentiment en anglais simple et tu l'encourages.
- Quand `remainingSec < 30`, tu amorces une conclusion chaleureuse.
- Pas de sujets sensibles. Tu redirectionnes poliment.

### 7.3 Prompt du diagnostic
- Tu analyses **uniquement les tours `user`**. Les tours `character` ne servent que de contexte.
- Tu renvoies le résultat via **un tool / une sortie structurée au schéma `Diagnostic.findings`** (pas de texte libre).
- `blocageId` ∈ taxonomie §6.2. `said` = citation **exacte** d'un tour user. `corrected` = la même phrase corrigée au minimum. `note` en français, une phrase, tutoiement.
- Tu ne signales que ce qui est observable dans le transcript. Si rien de significatif, tu renvoies `findings: []`.

### 7.4 Mode mock (`LLM_MODE=mock`, activé par défaut quand il n'y a pas de clé)
- Les répliques viennent d'un script par personnage (8 répliques en boucle, avec le même style que le prompt).
- Diagnostic mock **déterministe** : `past_tense` si un tour user contient `yesterday|last` suivi d'un verbe de la liste (`go, eat, see, do, have, make`) à l'infinitif, avec un exemple construit à partir de la vraie phrase ; `short_answers` si la moyenne des tours user est inférieure à 4 mots ; `vocabulary` si un tour contient un mot français courant (`le, la, je, et, mais, comment`).
- Ce mode alimente tous les tests et la démo sans réseau.

---

## 8. Accessibilité et qualité (vérifiées au contrôle C6)
- Chaque élément tappable a un `accessibilityRole` et un label. Les boutons icône seuls ont un `accessibilityLabel` (ex. « Mon profil », « Annuler la recherche »).
- Illustrations décoratives : `accessible={false}`. Portrait et graphes : `accessibilityRole="image"` avec un label descriptif.
- Contraste texte ≥ 4.5:1 (les tokens du §4 le respectent ; n'en invente pas d'autres).
- Pas de layout cassé sur un écran 360×740 (petit Android) : le contenu scrolle si besoin, les CTA restent visibles.

---

## 9. Plan d'exécution et points de contrôle

> Chaque phase se termine par : **tous les contrôles verts → `git commit` → phase suivante.** Les commandes de contrôle sont exposées comme scripts npm, pour pouvoir les relancer à tout moment.

Scripts à créer dès la phase 1 (`package.json` racine) :
```
"typecheck": "tsc --noEmit && tsc --noEmit -p server",
"lint": "eslint . --max-warnings 0",
"test": "vitest run",
"check": "npm run typecheck && npm run lint && npm run test",
"server": "tsx server/src/index.ts",
"web:export": "expo export --platform web",
"visual": "node scripts/visual-check.mjs"
```

### Phase 1 : socle
Projet Expo + TS strict, expo-router, police Lato, `tokens.ts`, ESLint, Vitest, structure §3, `.env.example`, squelette `server/` avec `/health`.
- **C1.1** `npm run check` est vert (au moins un test trivial par dossier testé).
- **C1.2** `npm run server` puis `curl localhost:8787/health` renvoie `{"ok":true,"mode":"mock"}`.
- **C1.3** `npx expo export --platform web` réussit.

### Phase 2 : domaine (TDD)
`types`, `characters`, `blocages`, `progression`, `session`, `diagnostic` (filtre §6.7), en fonctions pures.
- **C2.1** Couverture de `src/domain` ≥ 90 % des lignes (`vitest run --coverage`).
- **C2.2** Tests obligatoires, au minimum :
  - statuts : 6 cas (Récurrent, À travailler, À suivre, Résolu, en amélioration vrai, en amélioration faux avec moins de 4 sessions) ;
  - progression : état vide, 1 session, plus de 4 sessions (seules les 4 dernières dans le graphe), abandons exclus ;
  - diagnostic : citation inventée → exemple supprimé ; surlignage absent de la phrase → surlignage retiré ; plus de 3 findings → tronqué et trié ; moins de 2 tours user → vide ;
  - session : timer à 0 → `ending` ; pause en arrière-plan ; transitions interdites rejetées ;
  - tirage : jamais le même personnage deux fois de suite.
- **C2.3** `npm run check` est vert.

### Phase 3 : serveur IA
Routes §7.1, schémas Zod partagés (ou dupliqués à l'identique), prompts §7.2-7.3, providers `claude` et `mock`.
- **C3.1** Tests serveur (mode mock) : chaque route répond au schéma ; une entrée invalide renvoie 400 ; le diagnostic passe par le filtre §6.7 (un test injecte une réponse LLM avec une fausse citation et vérifie qu'elle est retirée).
- **C3.2** Test du provider Claude avec un client SDK mocké : le tool/schéma est bien envoyé, une réponse non conforme lève une erreur gérée (502 `llm_invalid_output`).
- **C3.3** `grep -rnE "#[0-9A-Fa-f]{6}" app src --include=*.tsx | grep -v theme/tokens.ts` ne renvoie **rien**. Le contrôle s'applique à toutes les phases suivantes.
- **C3.4** `npm run check` est vert.

### Phase 4 : UI statique fidèle
Les 8 écrans + utilitaires, alimentés par des données de **fixtures** (dans `src/domain/__fixtures__`, jamais importées en prod) qui reproduisent exactement l'état des maquettes. Composants partagés, tab bar, illustrations SVG portées.
- **C4.1** Chaque route existe et la navigation du §5.10 fonctionne. Chaque lien des maquettes (`href="X.dc.html"`) a son équivalent.
- **C4.2** Tous les textes fixes des maquettes sont présents à l'identique. Script `scripts/copy-check.mjs` : il extrait les nœuds texte des `.dc.html` (hors `<svg>` et hors valeurs dynamiques listées au §5) et vérifie leur présence dans `app/` ou `src/`. Sortie : 0 manquant.
- **C4.3** `npm run check` est vert.

### Phase 5 : branchement réel
Store zustand, persistance, client API, TTS, STT + fallback texte, timer, sessions, diagnostic, agrégation, états de chargement, vides et d'erreur. Suppression de toute dépendance aux fixtures dans le code de prod.
- **C5.1** Test d'intégration (Vitest, mode mock, store + services mockés) : réglage de la durée → session → 3 tours user dont « Yesterday I go to the museum » → fin → le diagnostic contient `past_tense` avec `said` = cette phrase → Blocages liste « Parler au passé » en « À suivre » → Progression affiche 1 conversation.
- **C5.2** Après 3 sessions simulées contenant `past_tense`, le statut devient « Récurrent ». Après « Effacer toutes mes données », tout est vide.
- **C5.3** « Personnage suivant » ne crée pas de session `completed` et change de personnage.
- **C5.4** `grep -rn "__fixtures__" app src --include=*.tsx | grep -v test` ne renvoie rien.
- **C5.5** `npm run check` est vert.

### Phase 6 : contrôle visuel et a11y
`scripts/visual-check.mjs` : `expo export --platform web`, serveur statique, Playwright en viewport 390×844 (deviceScaleFactor 1). L'app est pré-remplie via un **seed de démo** (`?seed=demo`, actif uniquement en `__DEV__` ou en export de test) qui reproduit l'état des maquettes. Le script capture les 8 écrans dans `design/captures/NN-nom.png` et rend aussi chaque maquette `.dc.html` dans `design/captures/NN-nom.maquette.png` (en remplaçant la balise `support.js` par rien : le HTML est autonome).
- **C6.1** Les 16 captures existent. Tu les **regardes toi-même** par paires et tu corriges chaque écart visible : couleur, ordre des blocs, texte, taille de titre, rayon, espacement grossier (> 8 px). Tu notes dans `DECISIONS.md` chaque écart que tu gardes volontairement, avec sa raison.
- **C6.2** Playwright vérifie que chaque bouton ou lien a un nom accessible (`getByRole(...).all()` sans nom vide) et qu'aucun élément tappable ne fait moins de 44×44.
- **C6.3** Viewport 360×740 : aucun CTA principal hors écran sur les 8 écrans.

### Phase 7 : finition et livraison
- `README.md` : prérequis, installation, `npm run server` + `npx expo start`, mode mock vs live, variables d'env, build dev nécessaire pour le STT natif (Expo Go → fallback texte), structure, scripts.
- `DECISIONS.md` complet.
- **C7.1** Depuis un clone propre : `npm ci && npm run check && npm run web:export && npm run visual` → tout est vert.
- **C7.2** Aucune clé ni secret dans le repo (`git grep -nE "sk-ant|ANTHROPIC_API_KEY=.+"` ne renvoie rien hors `.env.example` vide).
- **C7.3** Aucun `TODO`, `console.log` ou `any` explicite restant dans `app/`, `src/`, `server/src/` (`git grep -nE "TODO|console\.log|: any\b"`).

---

## 10. Definition of Done (V1)
- [ ] Parcours complet sans clé API : Accueil → Recherche → Conversation (voix ou texte) → Diagnostic → Blocages → Détail → Progression → Profil.
- [ ] Avec `ANTHROPIC_API_KEY` + `LLM_MODE=live` : même parcours avec de vraies répliques et un vrai diagnostic.
- [ ] Le diagnostic ne cite jamais une phrase que l'utilisateur n'a pas dite (testé).
- [ ] Statuts et progression conformes au §6 (testés).
- [ ] Les 8 écrans correspondent aux maquettes (captures C6.1 commitées).
- [ ] Tous les contrôles C1 à C7 sont verts. Un commit par phase.

## 11. Rapport final attendu (dans ta dernière réponse)
1. Tableau des contrôles C1.1 → C7.3 : ✅ / ❌ + preuve (sortie de commande résumée).
2. Liste des écarts aux maquettes conservés, avec leur justification (renvoi vers `DECISIONS.md`).
3. Ce qui nécessite un appareil réel pour être validé (STT natif, voix TTS) et comment le tester.
4. Les 3 risques principaux pour la V2.
