// Génère les icônes et l'image de démarrage à partir de assets/brand/logo.svg.
// Usage : npm run icons
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = (name) => `${root}assets/images/${name}`;

/** Couleurs de la marque (voir src/constants/theme.ts). */
const BRAND = '#34C924'; // vert pomme
const INK = '#0B2A06'; // logo foncé sur le vert pomme

// Contenu du logo, sans la balise <svg> ni les commentaires.
const logo = readFileSync(`${root}assets/brand/logo.svg`, 'utf8')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');

/**
 * Compose un SVG carré de 100 unités : fond optionnel, coins arrondis
 * optionnels, logo centré à l'échelle `scale` (1 = toute la surface).
 */
function compose({ scale, color = INK, background = null, radius = 0 }) {
  const offset = 50 - 50 * scale;
  const clip = radius ? `<clipPath id="r"><rect width="100" height="100" rx="${radius}"/></clipPath>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>${clip}</defs>
    <g ${radius ? 'clip-path="url(#r)"' : ''}>
      ${background ? `<rect width="100" height="100" fill="${background}"/>` : ''}
      <g color="${color}" transform="translate(${offset} ${offset}) scale(${scale})">${logo}</g>
    </g>
  </svg>`;
}

async function render(svg, size, file) {
  await sharp(Buffer.from(svg), { density: 72 * Math.ceil(size / 100) })
    .resize(size, size)
    .png()
    .toFile(out(file));
  console.log(`✓ ${file} (${size}×${size})`);
}

// Android : le logo doit tenir dans la zone visible (≈ 61 % du canevas de 108 dp),
// rognée en cercle, carré ou goutte selon le téléphone.
const ANDROID_SCALE = 0.4;

await Promise.all([
  // Icône principale (stores, iOS) : opaque, coins droits (le système arrondit).
  render(compose({ scale: 0.68, background: BRAND }), 1024, 'icon.png'),
  // Icône adaptative Android : logo transparent + fond séparé.
  render(compose({ scale: ANDROID_SCALE }), 512, 'android-icon-foreground.png'),
  render(compose({ scale: 0, background: BRAND }), 512, 'android-icon-background.png'),
  // Icône « thémée » Android 13+ : seule la forme compte, le système la recolore.
  render(compose({ scale: ANDROID_SCALE, color: '#FFFFFF' }), 432, 'android-icon-monochrome.png'),
  // Démarrage : la tuile arrondie reste visible sur fond vert comme sur fond sombre.
  render(compose({ scale: 0.68, background: BRAND, radius: 22.4 }), 512, 'splash-icon.png'),
  render(compose({ scale: 0.68, background: BRAND, radius: 22.4 }), 48, 'favicon.png'),
]);
