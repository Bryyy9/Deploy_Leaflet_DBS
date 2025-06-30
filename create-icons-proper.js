// create-icons-proper.js - Script untuk membuat icons yang valid
const fs = require('fs');
const path = require('path');

// Create proper icons directory
const publicDir = path.join(__dirname, 'src', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Function to create SVG icon with specific size
function createSVGIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow${size}">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad${size})" filter="url(#shadow${size})"/>
  <circle cx="${size * 0.5}" cy="${size * 0.4}" r="${size * 0.15}" fill="white" opacity="0.9"/>
  <path d="M ${size * 0.5} ${size * 0.55} L ${size * 0.5} ${size * 0.75}" stroke="white" stroke-width="${size * 0.02}" stroke-linecap="round"/>
  <text x="${size * 0.5}" y="${size * 0.9}" font-family="Arial, sans-serif" font-size="${size * 0.08}" fill="white" text-anchor="middle" font-weight="600">StoryMaps</text>
</svg>`;
}

// Create different sized icons
const iconSizes = [16, 32, 48, 72, 96, 144, 192, 256, 384, 512];

iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  fs.writeFileSync(path.join(publicDir, `icon-${size}.svg`), svgContent);
});

// Create favicon.ico placeholder (SVG)
const faviconSVG = createSVGIcon(32);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSVG);

// Create apple-touch-icon
const appleTouchIcon = createSVGIcon(180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), appleTouchIcon);

// Create screenshot placeholders
const screenshotWide = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <rect width="1280" height="720" fill="#0a0a0f"/>
  <rect x="40" y="40" width="1200" height="640" rx="20" fill="#1a1a2e" stroke="#00d4ff" stroke-width="2"/>
  <text x="640" y="360" font-family="Arial, sans-serif" font-size="48" fill="#00d4ff" text-anchor="middle">StoryMaps</text>
  <text x="640" y="420" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" text-anchor="middle">Share your stories with location</text>
</svg>`;

const screenshotNarrow = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 1334" width="750" height="1334">
  <rect width="750" height="1334" fill="#0a0a0f"/>
  <rect x="20" y="20" width="710" height="1294" rx="40" fill="#1a1a2e" stroke="#00d4ff" stroke-width="2"/>
  <text x="375" y="667" font-family="Arial, sans-serif" font-size="36" fill="#00d4ff" text-anchor="middle">StoryMaps</text>
  <text x="375" y="720" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" text-anchor="middle">Share your stories with location</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'screenshot-wide.svg'), screenshotWide);
fs.writeFileSync(path.join(publicDir, 'screenshot-narrow.svg'), screenshotNarrow);

console.log('✅ All icons and assets created successfully!');
console.log('📁 Location: src/public/');
console.log('📋 Created files:');
iconSizes.forEach(size => console.log(`   - icon-${size}.svg`));
console.log('   - favicon.svg');
console.log('   - apple-touch-icon.svg');
console.log('   - screenshot-wide.svg');
console.log('   - screenshot-narrow.svg');
console.log('');
console.log('🎨 Note: These are SVG files. For better PWA support, convert them to PNG using:');
console.log('   - Online tools like cloudconvert.com');
console.log('   - Or use imagemagick: convert icon-192.svg icon-192.png');