// generate-vapid.js - Script untuk generate VAPID key yang valid
const crypto = require('crypto');

function generateVapidKeys() {
  console.log('🔑 Generating VAPID keys...');
  
  try {
    // Generate key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'der'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'der'
      }
    });
    
    // Convert to base64url
    const publicKeyBase64 = publicKey.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const privateKeyBase64 = privateKey.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    console.log('✅ VAPID keys generated successfully!');
    console.log('');
    console.log('📋 Public Key (use in client):');
    console.log(publicKeyBase64);
    console.log('');
    console.log('🔒 Private Key (use in server):');
    console.log(privateKeyBase64);
    console.log('');
    console.log('📝 Add to your push-manager.js:');
    console.log(`this.vapidPublicKey = '${publicKeyBase64}';`);
    console.log('');
    console.log('⚠️ Keep the private key secure on your server!');
    
  } catch (error) {
    console.error('❌ Failed to generate VAPID keys:', error.message);
    console.log('');
    console.log('💡 Alternative: Use online VAPID generator');
    console.log('   https://vapidkeys.com/');
    console.log('');
    console.log('🔧 Or use web-push CLI:');
    console.log('   npm install -g web-push');
    console.log('   web-push generate-vapid-keys');
  }
}

generateVapidKeys();