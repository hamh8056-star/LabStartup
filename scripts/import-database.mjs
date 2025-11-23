#!/usr/bin/env node

/**
 * Script pour importer/restaurer une base de données MongoDB
 * Usage: node scripts/import-database.mjs [backup-directory] [options]
 * 
 * Options:
 *   --source-uri=URI      URI MongoDB source (pour transfert direct)
 *   --target-uri=URI      URI MongoDB destination (Atlas)
 *   --target-db=DB        Nom de la base de données destination
 *   --collection=NAME     Importer seulement une collection spécifique
 *   --drop                Supprimer les collections existantes avant import
 */

import { MongoClient } from 'mongodb';
import { readFile, readdir } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: resolve(process.cwd(), '.env') });

// Parser les arguments
const args = process.argv.slice(2);
let backupDir = null;
let sourceUri = null;
let targetUri = process.env.MONGODB_URI_ATLAS || process.env.MONGODB_URI;
let targetDb = process.env.MONGODB_DB_ATLAS || process.env.MONGODB_DB || 'taalimia';
let collectionFilter = null;
let dropCollections = false;

// Parser les options
args.forEach(arg => {
  if (arg.startsWith('--source-uri=')) {
    sourceUri = arg.split('=')[1];
  } else if (arg.startsWith('--target-uri=')) {
    targetUri = arg.split('=')[1];
  } else if (arg.startsWith('--target-db=')) {
    targetDb = arg.split('=')[1];
  } else if (arg.startsWith('--collection=')) {
    collectionFilter = arg.split('=')[1];
  } else if (arg === '--drop') {
    dropCollections = true;
  } else if (!arg.startsWith('--')) {
    backupDir = arg;
  }
});

if (!targetUri) {
  console.error('❌ Erreur: URI MongoDB destination non définie');
  console.error('   Définissez MONGODB_URI_ATLAS dans .env ou utilisez --target-uri=URI');
  process.exit(1);
}

const BACKUP_BASE_DIR = join(process.cwd(), 'backups');

async function readJsonFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture de ${filePath}:`, error.message);
    return null;
  }
}

async function importFromBackupFiles(backupPath, targetClient, targetDatabase) {
  console.log('📂 Import depuis les fichiers de sauvegarde...\n');

  if (!existsSync(backupPath)) {
    console.error(`❌ Le dossier de sauvegarde n'existe pas: ${backupPath}`);
    process.exit(1);
  }

  const files = await readdir(backupPath);
  const jsonFiles = files.filter(f => f.endsWith('.json') && f !== '_summary.json');

  if (jsonFiles.length === 0) {
    console.error('❌ Aucun fichier JSON trouvé dans le dossier de sauvegarde');
    process.exit(1);
  }

  console.log(`📋 Fichiers trouvés: ${jsonFiles.length}\n`);

  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const file of jsonFiles) {
    const collectionName = file.replace('.json', '');
    
    // Filtrer si une collection spécifique est demandée
    if (collectionFilter && collectionName !== collectionFilter) {
      continue;
    }

    const filePath = join(backupPath, file);
    console.log(`📦 Import de ${collectionName}...`);

    const data = await readJsonFile(filePath);
    
    if (!data || !Array.isArray(data)) {
      console.error(`  ⚠️  Fichier invalide ou vide: ${file}`);
      errorCount++;
      continue;
    }

    if (data.length === 0) {
      console.log(`  ⏭️  Collection vide, ignorée`);
      skippedCount++;
      continue;
    }

    try {
      const collection = targetDatabase.collection(collectionName);

      // Supprimer la collection si demandé
      if (dropCollections) {
        console.log(`  🗑️  Suppression de la collection existante...`);
        await collection.drop().catch(() => {
          // Ignorer l'erreur si la collection n'existe pas
        });
      }

      // Insérer les documents
      if (data.length > 0) {
        await collection.insertMany(data, { ordered: false });
        console.log(`  ✅ ${data.length} documents importés`);
        importedCount += data.length;
      }
    } catch (error) {
      if (error.code === 11000) {
        // Erreur de duplication - essayer d'insérer un par un
        console.log(`  ⚠️  Conflits de clés dupliquées détectés, insertion avec mise à jour...`);
        let inserted = 0;
        let updated = 0;
        
        for (const doc of data) {
          try {
            await collection.replaceOne(
              { _id: doc._id },
              doc,
              { upsert: true }
            );
            inserted++;
          } catch (err) {
            console.error(`  ❌ Erreur lors de l'insertion d'un document:`, err.message);
            errorCount++;
          }
        }
        console.log(`  ✅ ${inserted} documents insérés/mis à jour`);
        importedCount += inserted;
      } else {
        console.error(`  ❌ Erreur lors de l'import:`, error.message);
        errorCount++;
      }
    }
    console.log();
  }

  return { importedCount, skippedCount, errorCount, collectionsProcessed: importedCount > 0 ? 1 : 0 };
}

async function transferFromSourceToTarget(sourceUri, sourceDb, targetClient, targetDatabase) {
  console.log('🔄 Transfert direct depuis la base de données source...\n');

  let sourceClient = null;

  try {
    // Se connecter à la base source
    console.log('🔌 Connexion à la base de données source...');
    sourceClient = new MongoClient(sourceUri);
    await sourceClient.connect();
    console.log('✅ Connecté à la source\n');

    const sourceDatabase = sourceClient.db(sourceDb || 'taalimia');
    
    // Lister les collections
    const collections = await sourceDatabase.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (collectionNames.length === 0) {
      console.log('⚠️  Aucune collection trouvée dans la base source');
      return { importedCount: 0, skippedCount: 0, errorCount: 0, collectionsProcessed: 0 };
    }

    console.log(`📋 Collections trouvées: ${collectionNames.length}\n`);

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let processedCollections = 0;

    for (const collectionName of collectionNames) {
      // Filtrer si une collection spécifique est demandée
      if (collectionFilter && collectionName !== collectionFilter) {
        continue;
      }

      console.log(`📦 Transfert de ${collectionName}...`);

      try {
        const sourceCollection = sourceDatabase.collection(collectionName);
        const targetCollection = targetDatabase.collection(collectionName);

        // Compter les documents
        const count = await sourceCollection.countDocuments();
        
        if (count === 0) {
          console.log(`  ⏭️  Collection vide, ignorée`);
          skippedCount++;
          continue;
        }

        console.log(`  📊 ${count} documents à transférer...`);

        // Supprimer la collection cible si demandé
        if (dropCollections) {
          console.log(`  🗑️  Suppression de la collection existante...`);
          await targetCollection.drop().catch(() => {
            // Ignorer l'erreur si la collection n'existe pas
          });
        }

        // Transférer les documents par lots
        const batchSize = 1000;
        const cursor = sourceCollection.find({});
        let batch = [];
        let batchCount = 0;

        for await (const doc of cursor) {
          batch.push(doc);
          
          if (batch.length >= batchSize) {
            try {
              await targetCollection.insertMany(batch, { ordered: false });
              batchCount += batch.length;
              batch = [];
            } catch (error) {
              if (error.code === 11000) {
                // Erreur de duplication - essayer d'insérer un par un
                for (const item of batch) {
                  await targetCollection.replaceOne(
                    { _id: item._id },
                    item,
                    { upsert: true }
                  ).catch(() => {});
                }
                batchCount += batch.length;
                batch = [];
              } else {
                throw error;
              }
            }
          }
        }

        // Insérer les derniers documents
        if (batch.length > 0) {
          try {
            await targetCollection.insertMany(batch, { ordered: false });
            batchCount += batch.length;
          } catch (error) {
            if (error.code === 11000) {
              for (const item of batch) {
                await targetCollection.replaceOne(
                  { _id: item._id },
                  item,
                  { upsert: true }
                ).catch(() => {});
              }
              batchCount += batch.length;
            } else {
              throw error;
            }
          }
        }

        console.log(`  ✅ ${batchCount} documents transférés`);
        importedCount += batchCount;
        processedCollections++;
      } catch (error) {
        console.error(`  ❌ Erreur lors du transfert:`, error.message);
        errorCount++;
      }
      console.log();
    }

    return { importedCount, skippedCount, errorCount, collectionsProcessed: processedCollections };
  } finally {
    if (sourceClient) {
      await sourceClient.close();
      console.log('🔌 Déconnecté de la source');
    }
  }
}

async function importDatabase() {
  console.log('🚀 Début de l\'import/transfert de la base de données...\n');
  
  if (dropCollections) {
    console.log('⚠️  ATTENTION: Les collections existantes seront supprimées!\n');
  }

  console.log(`📊 Base de données destination: ${targetDb}`);
  console.log(`🔗 URI destination: ${targetUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);

  let targetClient = null;

  try {
    // Se connecter à la base destination (Atlas)
    console.log('🔌 Connexion à MongoDB Atlas...');
    targetClient = new MongoClient(targetUri);
    await targetClient.connect();
    console.log('✅ Connecté à MongoDB Atlas\n');

    const targetDatabase = targetClient.db(targetDb);

    let result;

    if (sourceUri) {
      // Transfert direct depuis la base source
      const sourceDbName = process.env.MONGODB_DB || 'taalimia';
      result = await transferFromSourceToTarget(sourceUri, sourceDbName, targetClient, targetDatabase);
    } else if (backupDir) {
      // Import depuis les fichiers de sauvegarde
      const backupPath = join(BACKUP_BASE_DIR, backupDir);
      result = await importFromBackupFiles(backupPath, targetClient, targetDatabase);
    } else {
      // Chercher la dernière sauvegarde
      try {
        const backups = await readdir(BACKUP_BASE_DIR);
        const backupDirs = backups
          .filter(f => {
            const fullPath = join(BACKUP_BASE_DIR, f);
            return statSync(fullPath).isDirectory();
          })
          .sort()
          .reverse();

        if (backupDirs.length === 0) {
          console.error('❌ Aucune sauvegarde trouvée');
          console.error('   Utilisez: node scripts/import-database.mjs [nom-du-dossier-backup]');
          console.error('   Exemple: node scripts/import-database.mjs taalimia_2025-11-23');
          process.exit(1);
        }

        const latestBackup = backupDirs[0];
        console.log(`📂 Utilisation de la dernière sauvegarde: ${latestBackup}\n`);
        
        const backupPath = join(BACKUP_BASE_DIR, latestBackup);
        result = await importFromBackupFiles(backupPath, targetClient, targetDatabase);
      } catch (error) {
        console.error('❌ Erreur lors de la recherche des sauvegardes:', error.message);
        process.exit(1);
      }
    }

    // Résumé
    console.log('\n✅ Import terminé!\n');
    console.log('📊 Résumé:');
    console.log(`   Documents importés: ${result.importedCount}`);
    console.log(`   Collections traitées: ${result.collectionsProcessed}`);
    console.log(`   Collections ignorées: ${result.skippedCount}`);
    if (result.errorCount > 0) {
      console.log(`   Erreurs: ${result.errorCount}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error.message);
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Vérifiez que:');
      console.error('   1. L\'URI MongoDB Atlas est correcte');
      console.error('   2. Votre IP est autorisée dans MongoDB Atlas (Network Access)');
      console.error('   3. Les identifiants sont corrects');
    }
    if (error.message.includes('authentication')) {
      console.error('\n💡 Vérifiez que:');
      console.error('   1. Le nom d\'utilisateur et le mot de passe sont corrects');
      console.error('   2. L\'utilisateur a les permissions nécessaires');
    }
    process.exit(1);
  } finally {
    if (targetClient) {
      await targetClient.close();
      console.log('\n🔌 Déconnecté de MongoDB Atlas');
    }
  }
}

// Afficher l'aide si demandé
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/import-database.mjs [options] [backup-directory]

Options:
  --source-uri=URI      URI MongoDB source (pour transfert direct depuis local vers Atlas)
  --target-uri=URI      URI MongoDB destination Atlas (défaut: MONGODB_URI_ATLAS ou MONGODB_URI)
  --target-db=DB        Nom de la base de données destination (défaut: taalimia)
  --collection=NAME     Importer seulement une collection spécifique
  --drop                Supprimer les collections existantes avant import
  --help, -h            Afficher cette aide

Exemples:

1. Importer depuis la dernière sauvegarde vers Atlas:
   node scripts/import-database.mjs

2. Importer depuis un dossier de sauvegarde spécifique:
   node scripts/import-database.mjs taalimia_2025-11-23

3. Transférer directement depuis MongoDB local vers Atlas:
   node scripts/import-database.mjs --source-uri="mongodb://localhost:27017"

4. Importer une collection spécifique:
   node scripts/import-database.mjs taalimia_2025-11-23 --collection=users

5. Supprimer les collections existantes avant import:
   node scripts/import-database.mjs --drop
`);
  process.exit(0);
}

// Exécuter le script
importDatabase().catch(console.error);


