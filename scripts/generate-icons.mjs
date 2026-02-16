/**
 * Generate PWA icon PNGs from SVG using sharp.
 * Run: node scripts/generate-icons.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'public', 'icons');

// SVG icon template — journal/pen motif with warm palette
function createSvg(size, maskable = false) {
  const padding = maskable ? Math.round(size * 0.1) : 0;
  const inner = size - padding * 2;
  const rx = maskable ? 0 : Math.round(size * 0.188);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e0a370"/>
      <stop offset="100%" style="stop-color:#c8884c"/>
    </linearGradient>
  </defs>
  <rect x="${padding}" y="${padding}" width="${inner}" height="${inner}" rx="${rx}" fill="url(#bg)"/>
  <g transform="translate(${size * 0.25}, ${size * 0.19})" fill="none" stroke="#1a1614" stroke-width="${Math.round(size * 0.031)}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0 ${inner * 0.547}V${inner * 0.078}C0 ${inner * 0.035} ${inner * 0.035} 0 ${inner * 0.078} 0h${inner * 0.422}v${inner * 0.625}H${inner * 0.078}c-${inner * 0.043} 0-${inner * 0.078}-${inner * 0.035}-${inner * 0.078}-${inner * 0.078}z" fill="#1a1614" opacity="0.15"/>
    <path d="M0 ${inner * 0.547}V${inner * 0.078}C0 ${inner * 0.035} ${inner * 0.035} 0 ${inner * 0.078} 0h${inner * 0.422}v${inner * 0.625}H${inner * 0.078}c-${inner * 0.043} 0-${inner * 0.078}-${inner * 0.035}-${inner * 0.078}-${inner * 0.078}z"/>
    <g transform="translate(${inner * 0.117}, ${inner * 0.117})">
      <path d="M${inner * 0.234} ${inner * 0.039}L${inner * 0.273} 0 ${inner * 0.312} ${inner * 0.039} ${inner * 0.098} ${inner * 0.254} ${inner * 0.059} ${inner * 0.273} ${inner * 0.078} ${inner * 0.234}Z" stroke-width="${Math.round(size * 0.027)}"/>
    </g>
  </g>
</svg>`;
}

// Since we might not have sharp installed, generate SVGs that can be converted
// For a lightweight approach, we'll output SVG files that Vite can serve
const sizes = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
];

// Try using sharp, fall back to SVG
async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    // sharp not available — write SVG versions instead
    console.log('sharp not available, writing SVG versions as fallback...');
    for (const { name, size, maskable } of sizes) {
      const svg = createSvg(size, maskable);
      const svgName = name.replace('.png', '.svg');
      writeFileSync(resolve(outDir, svgName), svg);
      console.log(`  Created ${svgName}`);
    }
    console.log('\nTo generate PNGs: npm i -D sharp && node scripts/generate-icons.mjs');
    return;
  }

  for (const { name, size, maskable } of sizes) {
    const svg = createSvg(size, maskable);
    const buffer = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
    writeFileSync(resolve(outDir, name), buffer);
    console.log(`  Created ${name} (${buffer.length} bytes)`);
  }
  console.log('Done!');
}

main().catch(console.error);
