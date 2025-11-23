#!/usr/bin/env node

/**
 * Script pour exporter/sauvegarder la base de données MongoDB
 * Usage: node scripts/export-database.mjs [options]
 */

import { MongoClient } from 'mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'taalimia';
const OUTPUT_DIR = process.env.OUTPUT_DIR || join(process.cwd(), 'backups');

async function ensureDirectoryExists(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
    console.log(`✓ Répertoire créé: ${dir}`);
  }
}

async function exportCollection(client, db, collectionName) {
  try {
    const collection = db.collection(collectionName);
    const count = await collection.countDocuments();
    
    if (count === 0) {
      console.log(`  ⚠ Collection vide: ${collectionName}`);
      return { collection: collectionName, count: 0, data: [] };
    }

    console.log(`  📦 Export de ${collectionName} (${count} documents)...`);
    const data = await collection.find({}).toArray();
    
    return { collection: collectionName, count: data.length, data };
  } catch (error) {
    console.error(`  ❌ Erreur lors de l'export de ${collectionName}:`, error.message);
    return { collection: collectionName, count: 0, data: [], error: error.message };
  }
}

async function exportDatabase() {
  console.log('🚀 Début de l\'export de la base de données...\n');
  console.log(`📊 Base de données: ${MONGODB_DB}`);
  console.log(`🔗 URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);

  let client;
  
  try {
    // Se connecter à MongoDB
    console.log('🔌 Connexion à MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✓ Connecté à MongoDB\n');

    const db = client.db(MONGODB_DB);
    
    // Lister toutes les collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (collectionNames.length === 0) {
      console.log('⚠ Aucune collection trouvée dans la base de données');
      return;
    }

    console.log(`📋 Collections trouvées: ${collectionNames.length}`);
    collectionNames.forEach(name => console.log(`   - ${name}`));
    console.log();

    // Créer le répertoire de sortie
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const outputPath = join(OUTPUT_DIR, `${MONGODB_DB}_${timestamp}`);
    await ensureDirectoryExists(outputPath);

    // Exporter chaque collection
    const exportResults = [];
    for (const collectionName of collectionNames) {
      const result = await exportCollection(client, db, collectionName);
      exportResults.push(result);
      
      if (result.data && result.data.length > 0) {
        const filePath = join(outputPath, `${collectionName}.json`);
        await writeFile(filePath, JSON.stringify(result.data, null, 2), 'utf-8');
        console.log(`  ✓ Sauvegardé: ${filePath}\n`);
      }
    }

    // Créer un fichier de résumé
    const summary = {
      exportDate: new Date().toISOString(),
      database: MONGODB_DB,
      uri: MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
      collections: exportResults.map(r => ({
        name: r.collection,
        count: r.count,
        exported: r.data && r.data.length > 0,
        error: r.error || null
      }))
    };

    const summaryPath = join(outputPath, '_summary.json');
    await writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

    console.log('✅ Export terminé!\n');
    console.log('📊 Résumé:');
    console.log(`   Total collections: ${collectionNames.length}`);
    const exportedCount = exportResults.filter(r => r.count > 0).length;
    console.log(`   Collections exportées: ${exportedCount}`);
    const totalDocuments = exportResults.reduce((sum, r) => sum + r.count, 0);
    console.log(`   Total documents: ${totalDocuments}`);
    console.log(`\n📁 Fichiers sauvegardés dans: ${outputPath}`);
    console.log(`📄 Résumé: ${summaryPath}`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error.message);
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Vérifiez que:');
      console.error('   1. MongoDB est démarré (si local)');
      console.error('   2. L\'URI MongoDB dans .env est correcte');
      console.error('   3. Vous avez accès au serveur MongoDB');
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Déconnecté de MongoDB');
    }
  }
}

// Exécuter le script
exportDatabase().catch(console.error);

