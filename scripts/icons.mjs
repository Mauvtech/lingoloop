// Génère les icônes PWA depuis le logo SVG (bouée) : node scripts/icons.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const BG = '#EAF4F8';
const buoy = (cx, cy, r, w) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#F2A541" stroke-width="${w}"/>` +
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1F4455" stroke-width="${w}" stroke-dasharray="${(Math.PI * 2 * r) / 8} ${(Math.PI * 2 * r) / 8}"/>`;

/** Logo sur fond clair ; `scale` = part du canevas occupée par la bouée. */
function svg(size, scale, rounded = false) {
  const r = (size * scale) / 2 - (size * scale * 0.267) / 2;
  const w = size * scale * 0.267;
  const rx = rounded ? size * 0.22 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${rx}" fill="${BG}"/>${buoy(size / 2, size / 2, r, w)}</svg>`;
}

const out = 'public';
const jobs = [
  ['icon-192.png', 192, 0.62],
  ['icon-512.png', 512, 0.62],
  ['icon-maskable-512.png', 512, 0.46], // zone de sécurité maskable (cercle de 80 %)
  ['apple-touch-icon.png', 180, 0.62],
];
for (const [name, size, scale] of jobs) {
  await sharp(Buffer.from(svg(size, scale))).png().toFile(`${out}/${name}`);
  console.log('ok', name);
}
writeFileSync(`${out}/favicon.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="none">${buoy(15, 15, 10, 8)}</svg>\n`);
console.log('ok favicon.svg');
