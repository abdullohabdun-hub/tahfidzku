import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Lucide BookOpen Icon SVG
// ViewBox is 24x24. We'll scale it to fit nicely.
const bookOpenPath = `
  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
`;

async function generateIcons() {
  const publicDir = path.resolve('public');

  // Base generator function
  const createIcon = async (size, paddingRatio = 0.25) => {
    const iconSize = size * (1 - paddingRatio * 2);
    const offset = size * paddingRatio;

    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#059669" rx="${size * 0.2}" />
        <g transform="translate(${offset}, ${offset}) scale(${iconSize / 24})">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </g>
      </svg>
    `;

    return sharp(Buffer.from(svg)).png().toBuffer();
  };

  // Maskable generator (no rounded corners for the background, smaller icon to fit the maskable safe zone)
  const createMaskableIcon = async (size) => {
    const paddingRatio = 0.3; // larger padding for maskable
    const iconSize = size * (1 - paddingRatio * 2);
    const offset = size * paddingRatio;

    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#059669" />
        <g transform="translate(${offset}, ${offset}) scale(${iconSize / 24})">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </g>
      </svg>
    `;

    return sharp(Buffer.from(svg)).png().toBuffer();
  };

  try {
    // Generate standard icons
    const buffer192 = await createIcon(192);
    fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), buffer192);
    console.log('Created pwa-192x192.png');

    const buffer512 = await createIcon(512);
    fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), buffer512);
    console.log('Created pwa-512x512.png');

    // Generate maskable icon
    const bufferMaskable = await createMaskableIcon(512);
    fs.writeFileSync(path.join(publicDir, 'pwa-512x512-maskable.png'), bufferMaskable);
    console.log('Created pwa-512x512-maskable.png');

    // Generate favicon.ico (we'll just use a 64x64 PNG and name it .ico for simplicity, or just output as favicon.ico which browsers parse as png if it is one, but properly sharp can't output raw .ico directly. We'll output a 32x32 png for favicon).
    // Better to use an SVG favicon for modern browsers, or a PNG favicon.
    const faviconSvg = `
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" fill="#059669" rx="6" />
        <g transform="translate(4, 4) scale(1)">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </g>
      </svg>
    `;
    const bufferFavicon = await sharp(Buffer.from(faviconSvg)).png().toBuffer();
    // Overwrite the default tanstack favicon.ico with this PNG (browsers handle this fine)
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), bufferFavicon);
    console.log('Created favicon.ico');

  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
