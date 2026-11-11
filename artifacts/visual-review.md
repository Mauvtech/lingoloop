# Revue visuelle — GATE 2

Captures : `artifacts/screens/NN-nom.png` (app, 390×844, `?demo=1`) comparées à `design/reference/NN-nom.png` (rendu des maquettes).
Méthode : comparaison côte à côte, écran par écran ; écarts corrigés puis recapturés.

## Écarts corrigés pendant la revue
| Écran | Écart constaté | Correction |
|---|---|---|
| 07 Détail | Boîtes « exemple » plus hautes que la maquette (padding 10/14, texte 16 px) | Variante compacte : padding 10/12, rayon 12, texte 15 px |
| 03 Conversation | La page dépassait 844 px (réplique sur 3 lignes) : bouton « Terminer » collé au bas | Hauteur mini du portrait 220 → 180 px ; réplique mock raccourcie |
| 03 Conversation | Capture figée sur « À toi » au lieu de « Nova parle » | Scénario de capture : la synthèse reste en cours au moment de la capture |

## Écarts restants (imposés par le prompt ou par les données)
| Écran | Écart | Raison |
|---|---|---|
| 02 Recherche | Bouton « Démarrer la conversation » à 50 % d'opacité pendant l'attente | §2 : désactivé tant que 2,5 s ne sont pas écoulées et que la 1re réplique n'est pas reçue (la maquette montre l'état actif) |
| 03 Conversation | Réplique « Nice! If you could fly into space, what would you explore first? » au lieu de « What would you explore first? » | Texte issu du mock scripté (une réplique isolée sans contexte n'aurait pas de sens) |
| 04 Diagnostic | Carte « Manque de vocabulaire » au lieu de « Vocabulaire » | Un seul libellé par clé (`shared/blockages.ts`), identique à la maquette 06 |
| 07 Détail | « Occurrences sur les 4 dernières conversations », barres C1–C4 = 4·4·3·1 | §2 : on mesure des occurrences ; jeu de démo cohérent avec 05 (4·3·3·2 impossible à satisfaire en même temps) |
| 08 Profil | Ligne « Notifications » sans chevron, valeur « Bientôt disponible » | §2 : ligne non interactive en V1 |
| 01, 05, 06, 08 | Barre d'onglets collée en bas de l'écran, contenu défilant | §2 : aucune hauteur fixe, `min-height: 100dvh` |

## Écrans conformes sans écart visible
01 Accueil, 05 Progression, 06 Blocages : couleurs, tailles de texte, ordre des blocs, rayons et espacements identiques à ±4 px.
