// Vérifie que tous les textes fixes des maquettes sont présents dans src/ (GATE 2).
// Usage : node scripts/copy-check.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MOCKS = 'design/maquettes';

/** Valeurs dynamiques (données, nombres, noms, exemples) : non cherchées telles quelles. */
const DYNAMIC = [
  /^[\d\s:/·.]+$/, // nombres, durées, chrono
  /^(Conv\. ?\d|S\d)$/, // libellés d'axe générés
  /^Nova( · 05:00| parle)?$/, // nom du personnage (données)
  /^NOVA$/i,
  /^Exploratrice spatiale$/, // rôle (shared/characters.ts)
  /^Anglais( · 5 min)?$/, // réglage courant (LANG_LABEL)
  /^(5 minutes|5 min|min)$/,
  /^(Parler au passé|Manque de vocabulaire|Réponses trop courtes)$/, // libellés (shared/blockages.ts)
  /^(Récurrent|À travailler|À suivre)$/, // statuts (domain/status.ts)
  /^Statut : récurrent$/, // `Statut : ${statut}`
  /^Yesterday I$/, /^go$/, /^went$/, /^to the museum\.$/, // exemple (données de démo)
  /^What would you explore first\?$/, // réplique (mock)
  /^Tu hésites quand tu racontes quelque chose au passé\.$/, // observation (données de démo)
  /^Tu as cherché tes mots pour décrire un lieu\.$/, // observation (données de démo)
  /^2 blocages en amélioration$/, // `${plural(n,'blocage')} en amélioration`
  /^Conversation avec Nova$/, // `Conversation avec ${nom}`
];

/** Écarts imposés par le prompt (§2) ou par la taxonomie unique des libellés. */
const ACCEPTED = new Map([
  ['Hésitations sur les 4 dernières sessions', 'Remplacé par « Occurrences sur les 4 dernières conversations » (§2, écran 07).'],
  ['Vocabulaire', 'Libellé unique par clé : « Manque de vocabulaire » (shared/blockages.ts), comme sur la maquette 06.'],
]);

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
}

function texts(html) {
  const body = html
    .replace(/<head>[\s\S]*?<\/head>/g, '')
    .replace(/<helmet>[\s\S]*?<\/helmet>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, '');
  return body
    .split(/<[^>]+>/)
    .map((t) => decode(t).replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > 0);
}

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(f) ? [p] : [];
  });
}

const source = [...walk('src'), ...walk('shared')].map((f) => readFileSync(f, 'utf8')).join('\n').replace(/\s+/g, ' ');
const missing = [];
const accepted = [];
let checked = 0;
for (const file of readdirSync(MOCKS).filter((f) => f.endsWith('.dc.html'))) {
  for (const t of new Set(texts(readFileSync(join(MOCKS, file), 'utf8')))) {
    if (DYNAMIC.some((re) => re.test(t))) continue;
    checked++;
    if (source.includes(t)) continue;
    if (ACCEPTED.has(t)) accepted.push(`${file} : « ${t} » — ${ACCEPTED.get(t)}`);
    else missing.push(`${file} : « ${t} »`);
  }
}
console.log(`Textes fixes vérifiés : ${checked}`);
if (accepted.length) console.log(`Écarts acceptés (${accepted.length}) :\n  ${accepted.join('\n  ')}`);
if (missing.length) {
  console.error(`Textes manquants (${missing.length}) :\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
console.log('Textes manquants : 0');
