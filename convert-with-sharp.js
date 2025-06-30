// convert-with-sharp.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'src', 'public');
const sizes = [16, 32, 48, 72, 96, 144, 192, 256, 384, 512];

async function convertIcons() {
  console.log('🎨 Converting SVG icons to PNG...');
  
  // Check if sharp is available
  try {
    await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    }).png().toBuffer();
    console.log('✅ Sharp is working correctly');
  } catch (error) {
    console.error('❌ Sharp is not working:', error.message);
    console.log('💡 Try: npm install sharp --save-dev');
    process.exit(1);
  }
  
  // Convert icons
  for (const size of sizes) {
    const svgPath = path.join(publicDir, `icon-${size}.svg`);
    const pngPath = path.join(publicDir, `icon-${size}.png`);
    
    if (fs.existsSync(svgPath)) {
      try {
        console.log(`🔄 Converting icon-${size}.svg...`);
        
        // Read SVG content
        const svgBuffer = fs.readFileSync(svgPath);
        
        // Convert to PNG
        await sharp(svgBuffer)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png({
            quality: 100,
            compressionLevel: 6
          })
          .toFile(pngPath);
          
        console.log(`✅ Created icon-${size}.png (${size}x${size})`);
        
        // Verify file was created
        if (fs.existsSync(pngPath)) {
          const stats = fs.statSync(pngPath);
          console.log(`   📊 Size: ${(stats.size / 1024).toFixed(1)} KB`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to convert icon-${size}.svg:`, error.message);
      }
    } else {
      console.warn(`⚠️ SVG file not found: ${svgPath}`);
    }
  }
  
  // Convert special icons
  const specialIcons = [
    { name: 'favicon', size: 32 },
    { name: 'apple-touch-icon', size: 180 }
  ];
  
  for (const icon of specialIcons) {
    const svgPath = path.join(publicDir, `${icon.name}.svg`);
    const pngPath = path.join(publicDir, `${icon.name}.png`);
    
    if (fs.existsSync(svgPath)) {
      try {
        console.log(`🔄 Converting ${icon.name}.svg...`);
        
        const svgBuffer = fs.readFileSync(svgPath);
        
        await sharp(svgBuffer)
          .resize(icon.size, icon.size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png({
            quality: 100,
            compressionLevel: 6
          })
          .toFile(pngPath);
          
        console.log(`✅ Created ${icon.name}.png (${icon.size}x${icon.size})`);
        
      } catch (error) {
        console.error(`❌ Failed to convert ${icon.name}.svg:`, error.message);
      }
    }
  }
  
  // Convert screenshots
  const screenshots = [
    { name: 'screenshot-wide', width: 1280, height: 720 },
    { name: 'screenshot-narrow', width: 750, height: 1334 }
  ];
  
  for (const screenshot of screenshots) {
    const svgPath = path.join(publicDir, `${screenshot.name}.svg`);
    const pngPath = path.join(publicDir, `${screenshot.name}.png`);
    
    if (fs.existsSync(svgPath)) {
      try {
        console.log(`🔄 Converting ${screenshot.name}.svg...`);
        
        const svgBuffer = fs.readFileSync(svgPath);
        
        await sharp(svgBuffer)
          .resize(screenshot.width, screenshot.height, {
            fit: 'contain',
            background: { r: 10, g: 10, b: 15, alpha: 1 }
          })
          .png({
            quality: 90,
            compressionLevel: 6
          })
          .toFile(pngPath);
          
        console.log(`✅ Created ${screenshot.name}.png (${screenshot.width}x${screenshot.height})`);
        
      } catch (error) {
        console.error(`❌ Failed to convert ${screenshot.name}.svg:`, error.message);
      }
    }
  }
  
  console.log('');
  console.log('🎉 Icon conversion completed!');
  console.log('📁 Check the src/public/ directory for PNG files');
  
  // List created PNG files
  console.log('');
  console.log('📋 Created PNG files:');
  const pngFiles = fs.readdirSync(publicDir).filter(file => file.endsWith('.png'));
  pngFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    const stats = fs.statSync(filePath);
    console.log(`   ✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
  });
}

// Run conversion
convertIcons().catch(error => {
  console.error('❌ Conversion failed:', error);
  process.exit(1);
});