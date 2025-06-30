// convert-icons.js - Script untuk convert SVG ke PNG
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'src', 'public');

// Instructions untuk convert SVG ke PNG
const instructions = `
🎨 Icon Conversion Instructions
================================

Your SVG icons have been created in: ${publicDir}

To convert them to PNG for better PWA support:

METHOD 1 - Online Conversion (Recommended):
1. Go to https://cloudconvert.com/svg-to-png
2. Upload each SVG file
3. Set the width/height to match the filename (e.g., icon-192.svg → 192x192)
4. Download and replace the SVG files

METHOD 2 - Using ImageMagick (if installed):
Run these commands in your terminal:

cd ${publicDir}
magick icon-72.svg icon-72.png
magick icon-96.svg icon-96.png
magick icon-144.svg icon-144.png
magick icon-192.svg icon-192.png
magick icon-256.svg icon-256.png
magick icon-384.svg icon-384.png
magick icon-512.svg icon-512.png
magick screenshot-wide.svg screenshot-wide.png
magick screenshot-narrow.svg screenshot-narrow.png

METHOD 3 - Using Sharp (Node.js):
npm install sharp
node convert-with-sharp.js

Files to convert:
- icon-72.svg → icon-72.png
- icon-96.svg → icon-96.png  
- icon-144.svg → icon-144.png
- icon-192.svg → icon-192.png
- icon-256.svg → icon-256.png
- icon-384.svg → icon-384.png
- icon-512.svg → icon-512.png
- screenshot-wide.svg → screenshot-wide.png
- screenshot-narrow.svg → screenshot-narrow.png

After conversion, your PWA will be installable! 🎉
`;

console.log(instructions);

// Create Sharp conversion script
const sharpScript = `
// convert-with-sharp.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'src', 'public');
const sizes = [72, 96, 144, 192, 256, 384, 512];

async function convertIcons() {
  console.log('🎨 Converting SVG icons to PNG...');
  
  for (const size of sizes) {
    const svgPath = path.join(publicDir, \`icon-\${size}.svg\`);
    const pngPath = path.join(publicDir, \`icon-\${size}.png\`);
    
    if (fs.existsSync(svgPath)) {
      try {
        await sharp(svgPath)
          .resize(size, size)
          .png()
          .toFile(pngPath);
        console.log(\`✅ Converted icon-\${size}.svg to PNG\`);
      } catch (error) {
        console.error(\`❌ Failed to convert icon-\${size}.svg:\`, error.message);
      }
    }
  }
  
  // Convert screenshots
  const screenshots = [
    { name: 'screenshot-wide', width: 1280, height: 720 },
    { name: 'screenshot-narrow', width: 750, height: 1334 }
  ];
  
  for (const screenshot of screenshots) {
    const svgPath = path.join(publicDir, \`\${screenshot.name}.svg\`);
    const pngPath = path.join(publicDir, \`\${screenshot.name}.png\`);
    
    if (fs.existsSync(svgPath)) {
      try {
        await sharp(svgPath)
          .resize(screenshot.width, screenshot.height)
          .png()
          .toFile(pngPath);
        console.log(\`✅ Converted \${screenshot.name}.svg to PNG\`);
      } catch (error) {
        console.error(\`❌ Failed to convert \${screenshot.name}.svg:\`, error.message);
      }
    }
  }
  
  console.log('🎉 Icon conversion completed!');
}

convertIcons().catch(console.error);
`;

fs.writeFileSync(path.join(__dirname, 'convert-with-sharp.js'), sharpScript);

// Create package.json script entry instruction
const packageInstructions = `
📦 Add these scripts to your package.json:

"scripts": {
  "create-icons": "node create-icons-proper.js",
  "convert-icons": "npm install sharp && node convert-with-sharp.js",
  "icons": "npm run create-icons && npm run convert-icons"
}

Then run: npm run icons
`;

console.log(packageInstructions);