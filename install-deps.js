#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing dependencies for expo-webview-app...');

// Check if we're in the right directory
const currentDir = process.cwd();
console.log('Current directory:', currentDir);

// Check if package.json exists
const packageJsonPath = path.join(currentDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found in current directory');
    process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
console.log('Package name:', packageJson.name);
console.log('Dependencies:', Object.keys(packageJson.dependencies || {}));

// Install dependencies
try {
    console.log('Running npm install...');
    execSync('npm install --legacy-peer-deps', { 
        stdio: 'inherit',
        cwd: currentDir 
    });
    
    console.log('✅ Dependencies installed successfully');
    
    // Verify installation
    const nodeModulesPath = path.join(currentDir, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
        console.log('✅ node_modules directory created');
        
        // Check for key dependencies
        const keyDeps = ['expo', 'expo-notifications', 'react-native'];
        keyDeps.forEach(dep => {
            const depPath = path.join(nodeModulesPath, dep);
            if (fs.existsSync(depPath)) {
                console.log(`✅ ${dep} installed`);
            } else {
                console.log(`❌ ${dep} missing`);
            }
        });
    } else {
        console.log('❌ node_modules directory not found');
    }
    
} catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
}