// create-icons.js - Simple icon generator
const fs = require('fs');
const path = require('path');

// Simple SVG icon
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#grad)"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" fill="white" text-anchor="middle">📍</text>
  <text x="256" y="400" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" opacity="0.9">StoryMaps</text>
</svg>
`;

// Ensure public directory exists
const publicDir = path.join(__dirname, 'src', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write icon files
fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg);

console.log('✅ Icons created successfully!');
console.log('📁 Location: src/public/');
console.log('🎨 You can convert SVG to PNG using online tools or replace with your own icons');