#!/usr/bin/env node

/**
 * Script para configurar secrets de GitHub usando la API
 * 
 * Uso:
 * 1. Crear un Personal Access Token en GitHub con permisos 'repo' y 'admin:repo_hook'
 * 2. Ejecutar: node scripts/setup-secrets.js <GITHUB_TOKEN>
 * 
 * O configurar la variable de entorno GITHUB_TOKEN
 */

import https from 'https';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_OWNER = 'fafadaloia';
const REPO_NAME = 'portfolio';

const secrets = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_GOOGLE_TRANSLATE_API_KEY',
];

// Función para encriptar el secret usando la API de GitHub
async function setSecret(token, secretName, secretValue) {
  return new Promise((resolve, reject) => {
    // Primero obtener la clave pública del repositorio
    const getPublicKeyOptions = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/actions/secrets/public-key`,
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Node.js',
      },
    };

    https.get(getPublicKeyOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Error obteniendo clave pública: ${res.statusCode} - ${data}`));
          return;
        }

        const { key, key_id } = JSON.parse(data);

        // Encriptar el valor usando la clave pública (sodium)
        // Nota: Esto requiere la librería 'tweetsodium' o similar
        // Por ahora, solo mostramos las instrucciones
        console.log(`\n⚠️  Para configurar ${secretName}:`);
        console.log(`   1. Ve a: https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/secrets/actions`);
        console.log(`   2. Click en "New repository secret"`);
        console.log(`   3. Name: ${secretName}`);
        console.log(`   4. Value: [tu valor del .env]`);
        console.log(`   5. Click en "Add secret"\n`);

        resolve();
      });
    }).on('error', reject);
  });
}

async function main() {
  const token = process.argv[2] || process.env.GITHUB_TOKEN;

  if (!token) {
    console.error('❌ Error: Se requiere un token de GitHub');
    console.error('\nUso:');
    console.error('  node scripts/setup-secrets.js <GITHUB_TOKEN>');
    console.error('  o');
    console.error('  GITHUB_TOKEN=<token> node scripts/setup-secrets.js');
    console.error('\nPara crear un token:');
    console.error('  1. Ve a https://github.com/settings/tokens');
    console.error('  2. Click en "Generate new token (classic)"');
    console.error('  3. Selecciona los scopes: repo, admin:repo_hook');
    console.error('  4. Copia el token generado');
    process.exit(1);
  }

  console.log('📋 Configurando secrets en GitHub...\n');

  // Leer el archivo .env si existe
  let envVars = {};
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  } catch (error) {
    console.warn('⚠️  No se pudo leer el archivo .env, continuando sin valores...\n');
  }

  // Mostrar instrucciones para cada secret
  console.log('🔐 Para configurar los secrets, sigue estos pasos:\n');
  console.log(`1. Ve a: https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/secrets/actions\n`);
  console.log('2. Para cada secret, haz click en "New repository secret" y configura:\n');

  for (const secretName of secrets) {
    const value = envVars[secretName] || '[valor del .env]';
    console.log(`   📌 ${secretName}`);
    console.log(`      Name: ${secretName}`);
    console.log(`      Value: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
    console.log('');
  }

  console.log('\n✅ Una vez configurados todos los secrets, el workflow de GitHub Actions podrá hacer el build correctamente.\n');
}

main().catch(console.error);
