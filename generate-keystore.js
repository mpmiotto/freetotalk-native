#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔑 Generating Android keystore locally...');

// Check if Java is available
try {
  execSync('java -version', { stdio: 'pipe' });
  console.log('✅ Java is available');
} catch (error) {
  console.log('❌ Java not found - installing...');
  try {
    execSync('apt-get update && apt-get install -y default-jdk', { stdio: 'inherit' });
    console.log('✅ Java installed');
  } catch (installError) {
    console.error('❌ Failed to install Java:', installError.message);
    process.exit(1);
  }
}

// Generate keystore
const keystorePassword = 'freetotalk2025';
const alias = 'freetotalk';
const keystorePath = 'android-keystore.jks';

try {
  const cmd = `keytool -genkeypair -v -keystore ${keystorePath} -alias ${alias} -keyalg RSA -keysize 2048 -validity 10000 -storepass ${keystorePassword} -keypass ${keystorePassword} -dname "CN=Free to Talk, OU=Mobile, O=Free to Talk, L=Unknown, ST=Unknown, C=US"`;
  
  execSync(cmd, { stdio: 'inherit' });
  
  if (fs.existsSync(keystorePath)) {
    console.log('✅ Keystore generated successfully');
    console.log(`📁 Keystore file: ${keystorePath}`);
    console.log(`🔑 Store password: ${keystorePassword}`);
    console.log(`🏷️ Alias: ${alias}`);
    console.log(`🔐 Key password: ${keystorePassword}`);
    
    // Create credentials file
    const credentials = {
      android: {
        keystore: {
          keystorePath: `./${keystorePath}`,
          keystorePassword,
          keyAlias: alias,
          keyPassword: keystorePassword
        }
      }
    };
    
    fs.writeFileSync('android-credentials.json', JSON.stringify(credentials, null, 2));
    console.log('✅ Credentials file created: android-credentials.json');
    
  } else {
    console.error('❌ Keystore file not found after generation');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Failed to generate keystore:', error.message);
  process.exit(1);
}

console.log('🎉 Android keystore setup complete!');
console.log('Now run: eas build --platform android --profile internal');