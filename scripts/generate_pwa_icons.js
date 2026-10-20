const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="jmEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#E6FFFA" />
    </linearGradient>
    <linearGradient id="jmAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)" />
  <g transform="translate(106, 96) scale(3)">
    <!-- Bag Handle -->
    <path d="M36 28 C36 18, 64 18, 64 28" stroke="url(#jmEmeraldGrad)" stroke-width="6" stroke-linecap="round" fill="none" />
    <!-- Main Bag Outline -->
    <path d="M22 34 H78 L84 82 C84 86 80 90 76 90 H24 C20 90 16 86 16 82 Z" stroke="url(#jmEmeraldGrad)" stroke-width="6" stroke-linejoin="round" fill="rgba(255,255,255,0.08)" />
    <!-- Stylized 'J' express speed stroke -->
    <path d="M42 44 L58 44 L38 64 L54 64 L36 82" stroke="url(#jmAccentGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <!-- Verified Speed Dot -->
    <circle cx="68" cy="44" r="4" fill="#34D399" />
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.join(__dirname, '..', 'apps', 'web', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const svg512 = Buffer.from(svgIcon(512));
  
  await sharp(svg512)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  await sharp(svg512)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Generated icon-512.png');
}

generate().catch(console.error);
