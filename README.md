# LingoLoop

PWA mobile-first d'entraînement à l'oral : tu discutes à la voix 3 à 10 minutes avec un personnage IA, puis l'app te montre tes « blocages » (difficultés récurrentes) et ta progression. Pas d'exercices, pas de gamification, pas de compte : on progresse en parlant.

- Interface en français ; langues pratiquées : anglais (`en-US`) et espagnol (`es-ES`).
- Données 100 % locales (IndexedDB). Seul le texte des échanges part vers l'IA, via des fonctions serveur.
- Spécification : [`PROMPT_V1.md`](PROMPT_V1.md). Maquettes : [`design/maquettes/`](design/maquettes) (rendus PNG dans [`design/reference/`](design/reference)).

## Démarrage

Prérequis : Node.js ≥ 20.

```bash
npm install
```

```bash
npm run dev
```

L'app est sur http://localhost:5173. **Aucune clé n'est nécessaire** : sans `ANTHROPIC_API_KEY`, les fonctions `/api/*` passent en mode mock serveur (réponses scriptées, diagnostic déterministe).

Pour utiliser la vraie IA, copie `.env.example` en `.env` et renseigne la clé :

```bash
cp .env.example .env
```

| Variable | Rôle | Défaut |
|---|---|---|
| `ANTHROPIC_API_KEY` | Clé Anthropic, lue **uniquement côté serveur** (`api/`). Vide = mock serveur. | vide |
| `ANTHROPIC_MODEL` | Modèle utilisé par `/api/chat` et `/api/diagnose`. | `claude-sonnet-5-5` |
| `VITE_MOCK` | `1` = mock client : le navigateur n'appelle jamais `/api/*` (démo statique, hors réseau). | vide |
| `LINGOLOOP_RATE_LIMIT` | Requêtes `/api/*` par minute et par IP (tests e2e uniquement). | `30` |

### Modes

| Mode | Activation | Usage |
|---|---|---|
| Mock serveur | pas de `ANTHROPIC_API_KEY` | développement local, tests e2e (par défaut) |
| Mock client | `VITE_MOCK=1` au build | démo statique sans serveur ; `E2E_MOCK_CLIENT=1 npm run test:e2e` |
| Démo | `?demo=1` dans l'URL | **remplace** les données locales par 4 conversations et 3 blocages qui reproduisent les maquettes |
| Réel | `ANTHROPIC_API_KEY` renseignée | conversation et diagnostic par Claude |

## Scripts

| Script | Effet |
|---|---|
| `npm run dev` | Vite + fonctions `/api/*` montées par un plugin (pas besoin de `vercel dev`) |
| `npm run build` / `npm run preview` | Build de production (PWA incluse) / service local du build, avec `/api/*` |
| `npm run typecheck` · `lint` · `test` | TypeScript strict · ESLint sans avertissement · Vitest |
| `npm run check` | Les trois précédents |
| `npm run test:coverage` | Vitest avec couverture (seuil : 90 % des lignes sur `src/domain` + `shared`) |
| `npm run test:e2e` | Playwright (Chromium, 390×844) : smoke, visuel, conversation, PWA, accessibilité |
| `npm run copy-check` | Vérifie que les textes fixes des maquettes sont présents dans le code |
| `npm run mockups` | Régénère `design/reference/*.png` depuis les maquettes HTML |
| `npm run icons` | Régénère les icônes PWA depuis le logo |
| `npm run live-check` | GATE 4b : vraie API (nécessite une clé et `npm run preview` lancé) |
| `bash scripts/lighthouse.sh` | Lighthouse mobile sur le build de production |

Playwright utilise le Chromium correspondant à `@playwright/test@1.63.0` (`npx playwright install chromium` si besoin).

## Déploiement Vercel

1. Importer le dépôt dans Vercel (le framework Vite est détecté ; la configuration est dans `vercel.json`).
2. Ajouter `ANTHROPIC_API_KEY` (et éventuellement `ANTHROPIC_MODEL`) dans *Settings → Environment Variables*.
3. Déployer. `api/chat.ts` et `api/diagnose.ts` deviennent des fonctions serverless au format Web standard (`POST(request: Request)`), et `api/_lib/` n'est pas exposé.

`vercel.json` ajoute la CSP (`default-src 'self'; connect-src 'self'; …`), `nosniff`, `Referrer-Policy`, `Permissions-Policy` (micro autorisé pour l'app), le repli SPA vers `index.html` et `Cache-Control: no-cache` sur `sw.js`.

## Architecture

```
api/                  fonctions Vercel (chat, diagnose) + _lib (handlers, SDK, prompts, limites, plugin dev)
shared/               code commun client/serveur : schémas Zod, personnages, blocages, mock, anti-hallucination
src/domain/           logique pure testée : statuts, progression, diff, tirage, machine d'états, démo
src/services/         db.ts (IndexedDB + repli mémoire), api.ts, speech/ (adaptateurs Web Speech)
src/store/            état global (Zustand)
src/screens/          un fichier par écran ; conversation/useConversation.ts = contrôleur de conversation
src/components/       Button/Card (CSS), Sheet, StatusPill, BarChart, Example, SettingRows, UpdateBanner…
src/assets/           SVG portés des maquettes (illustrations, pictogrammes, portraits)
tests/unit, tests/e2e Vitest, Playwright
artifacts/            captures, revue visuelle, résumé Lighthouse
```

**Garde-fous du diagnostic** : le modèle doit répondre via un tool forcé, et sa sortie est validée par Zod. Une citation `said` absente des phrases de l'utilisateur déclenche un nouvel appel. Si elle reste fausse, l'exemple est retiré. Un JSON invalide deux fois renvoie l'erreur 502 et l'écran « Réessayer ». Au maximum 3 blocages sont gardés, triés par gravité.

## Support navigateurs

| Navigateur | Reconnaissance vocale | Synthèse vocale | Résultat |
|---|---|---|---|
| Chrome / Edge (desktop, Android) | oui (`webkitSpeechRecognition`, service en ligne) | oui | expérience complète |
| Safari iOS / macOS (≥ 14.5) | partielle (selon version et réglages Siri) | oui | voix ou repli texte |
| Firefox | non | oui | **repli texte** automatique |
| Navigation privée sans IndexedDB | — | — | données en mémoire + bandeau « Tes données ne seront pas conservées » |

Si le micro est absent ou refusé, un champ texte remplace le bouton micro, avec le message « Le micro n'est pas disponible. Tu peux écrire tes réponses. ». Si aucune voix n'existe pour la langue, la réplique s'affiche sans être lue et le haut-parleur est désactivé.

## Limites connues

- La qualité de la reconnaissance vocale dépend du navigateur. Le diagnostic porte sur le **texte transcrit** : prononciation et hésitations ne sont pas observables.
- Le diagnostic côté client a un délai maximal de 8 s (exigence §2). Avec la vraie IA et un nouvel appel anti-hallucination, ce délai peut être dépassé. L'utilisateur voit alors « Réessayer ».
- La limitation de débit est en mémoire, propre à chaque instance serverless : c'est une protection « au mieux », pas un quota global.
- Le déploiement Vercel n'a pas été exécuté pendant le build : la configuration suit la documentation, mais elle n'a pas été testée en production.
- `npm audit` signale des vulnérabilités modérées dans des dépendances **de développement** (chaîne `typescript-eslint`). Rien dans le bundle livré.

## Hypothèses

Décisions non tranchées par la spécification, en une ligne chacune.

1. **Tests e2e contre le mock serveur** (build de production + `vite preview`), au lieu du mock client : ils exercent les vrais handlers et permettent de simuler une coupure réseau avec `page.route`. La même suite tourne aussi en mock client (`E2E_MOCK_CLIENT=1`).
2. **Fin automatique sans aucune réplique de l'utilisateur** : la conversation est supprimée et l'app revient à l'Accueil, sans diagnostic vide.
3. **« Personnage suivant »** exclut tous les personnages déjà rencontrés dans la conversation (puis retombe sur la liste complète).
4. **Un seul libellé par blocage** : « Manque de vocabulaire » partout. La maquette 04 disait « Vocabulaire », la 06 « Manque de vocabulaire ».
5. **Mock espagnol** : « le » et « la » ne comptent pas comme des mots français (ce sont aussi des mots espagnols).
6. **Temps de parole** : durée de micro ouvert ; en mode texte, 0,5 s par mot envoyé (§7.3).
7. **Limite de 40 tours** : la conversation se termine automatiquement quand une réplique de l'utilisateur atteint le 40e tour.
8. **Bouton « Démarrer »** : la maquette le montre actif. Il reste désactivé (opacité 0,5) tant que les 2,5 s ne sont pas écoulées **et** que la première réplique n'est pas reçue (§2).
9. **Réplique figée de la capture 03** : texte du mock (« Nice! If you could fly into space, what would you explore first? ») au lieu de « What would you explore first? ».
10. **Données de démo** : `?demo=1` fixe la langue sur l'anglais et remplace toutes les conversations locales (§2).
11. **Changement de langue** : statistiques, statuts et blocages ne portent que sur la langue courante. L'Historique montre toutes les langues.
12. **Police Lato** : tous les sous-ensembles de `@fontsource/lato` sont embarqués (précache d'environ 513 Kio), pour couvrir les accents espagnols et français sans requête externe.
13. **Imports `.js`** dans `api/` et `shared/` : nécessaires à l'exécution ESM des fonctions Vercel. TypeScript et Vite les résolvent vers les fichiers `.ts`.

## Dépendances

| Paquet | Pourquoi |
|---|---|
| `react`, `react-dom` | UI (React 18 imposé) |
| `react-router-dom` | Routes `/`, `/recherche`, `/diagnostic/:id`… |
| `zustand` | État global minimal (réglages, conversations, appariement) |
| `idb` | Accès IndexedDB typé, avec promesses et migrations |
| `zod` | Validation des entrées et sorties `/api/*`, schémas partagés client/serveur |
| `@anthropic-ai/sdk` | Appels à Claude côté serveur (tool forcé pour le diagnostic) |
| `@fontsource/lato` | Police Lato auto-hébergée (aucun CDN) |
| `vite`, `@vitejs/plugin-react` | Build et dev server |
| `vite-plugin-pwa`, `workbox-window` | Manifest, service worker, invite de mise à jour |
| `typescript`, `@types/*` | TypeScript strict |
| `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals` | Lint sans avertissement |
| `vitest`, `@vitest/coverage-v8`, `fake-indexeddb` | Tests unitaires, couverture, IndexedDB en Node |
| `@playwright/test`, `@axe-core/playwright` | Tests e2e et audit d'accessibilité |
| `sharp` | Génération des icônes PWA depuis le logo (`npm run icons`) |
