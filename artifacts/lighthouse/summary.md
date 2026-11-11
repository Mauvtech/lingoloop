# Lighthouse — GATE 5

Build de production (`npm run build`) servi par `vite preview`, Lighthouse 12.8.2, profil mobile par défaut (émulation Moto G Power, réseau 4G lent simulé), Chromium headless.
Commande : `bash scripts/lighthouse.sh`

| Route | Performance | Accessibilité | Best Practices |
|---|---|---|---|
| `/` | 95 | 100 | 100 |
| `/progression` | 96 | 100 | 100 |
| `/blocages` | 96 | 100 | 100 |
| `/profil` | 96 | 100 | 100 |

Seuils exigés : Performance ≥ 90, Accessibilité ≥ 95, Best Practices ≥ 95 → atteints.
Installabilité PWA : vérifiée par `tests/e2e/pwa.spec.ts` (Lighthouse n'a plus de catégorie PWA depuis la v12).
