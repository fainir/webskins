import sharp from 'sharp';
import { mkdirSync } from 'fs';

const sizes = [16, 48, 128];

mkdirSync('icons', { recursive: true });

for (const size of sizes) {
  const r = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.48);
  const textY = Math.round(size * 0.65);

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#4647d3"/>
          <stop offset="100%" stop-color="#9396ff"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
      <text x="${size / 2}" y="${textY}" font-family="Arial, Helvetica, sans-serif" font-weight="800"
            font-size="${fontSize}" fill="white" text-anchor="middle">W</text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(`icons/icon${size}.png`);
  console.log(`Generated icons/icon${size}.png`);
}

console.log('All icons generated.');
