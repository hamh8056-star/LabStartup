# Guide de restauration/transfert MongoDB vers Atlas

## Configuration

### 1. Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env`:

```env
# Base de données locale (source)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=taalimia

# Base de données Atlas (destination)
MONGODB_URI_ATLAS=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_ATLAS=taalimia
```

**Important**: Remplacez `MONGODB_URI_ATLAS` par votre vraie URI MongoDB Atlas.

## Méthode 1: Importer depuis une sauvegarde vers Atlas

Cette méthode utilise les fichiers JSON sauvegardés précédemment.

### Étape 1: Créer une sauvegarde (si pas déjà fait)

```bash
npm run export:db
```

Cela créera une sauvegarde dans le dossier `backups/`.

### Étape 2: Importer la sauvegarde vers Atlas

```bash
# Utiliser la dernière sauvegarde
npm run import:db

# Ou spécifier un dossier de sauvegarde
npm run import:db taalimia_2025-11-23
```

### Exemples

1. **Importer toutes les collections depuis la dernière sauvegarde:**
   ```bash
   node scripts/import-database.mjs
   ```

2. **Importer depuis un dossier spécifique:**
   ```bash
   node scripts/import-database.mjs taalimia_2025-11-23
   ```

3. **Importer une seule collection:**
   ```bash
   node scripts/import-database.mjs taalimia_2025-11-23 --collection=users
   ```

4. **Supprimer les collections existantes avant import (⚠️ attention!):**
   ```bash
   node scripts/import-database.mjs --drop
   ```

## Méthode 2: Transfert direct local → Atlas

Cette méthode transfère directement les données de MongoDB local vers Atlas sans créer de fichiers intermédiaires.

### Configuration dans .env

```env
# URI MongoDB locale (source)
MONGODB_URI=mongodb://localhost:27017

# URI MongoDB Atlas (destination)
MONGODB_URI_ATLAS=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Exécuter le transfert

```bash
# Transfert direct depuis MongoDB local vers Atlas
node scripts/import-database.mjs --source-uri="mongodb://localhost:27017"
```

Ou si vous avez configuré `MONGODB_URI` dans `.env`:

```bash
# Le script utilisera automatiquement MONGODB_URI comme source
node scripts/import-database.mjs --source-uri="${MONGODB_URI}"
```

## Options avancées

### Spécifier l'URI Atlas manuellement

Si vous ne voulez pas utiliser les variables d'environnement:

```bash
node scripts/import-database.mjs \
  --source-uri="mongodb://localhost:27017" \
  --target-uri="mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority" \
  --target-db="taalimia"
```

### Options disponibles

- `--source-uri=URI`: URI MongoDB source (local ou autre)
- `--target-uri=URI`: URI MongoDB destination (Atlas)
- `--target-db=DB`: Nom de la base de données destination
- `--collection=NAME`: Importer seulement une collection spécifique
- `--drop`: Supprimer les collections existantes avant import (⚠️ attention!)
- `--help`: Afficher l'aide

## Exemples complets

### Exemple 1: Migration complète local → Atlas

```bash
# 1. Assurez-vous que MongoDB local fonctionne
# 2. Configurez MONGODB_URI_ATLAS dans .env

# 3. Transférer toutes les données
node scripts/import-database.mjs --source-uri="mongodb://localhost:27017"
```

### Exemple 2: Restaurer une sauvegarde spécifique vers Atlas

```bash
# 1. Voir les sauvegardes disponibles
ls backups/

# 2. Restaurer une sauvegarde spécifique
node scripts/import-database.mjs backups/taalimia_2025-11-23
```

### Exemple 3: Mettre à jour seulement les utilisateurs

```bash
node scripts/import-database.mjs taalimia_2025-11-23 --collection=users
```

## Vérifications préalables

Avant de transférer vers Atlas, assurez-vous que:

1. ✅ **MongoDB Atlas est configuré:**
   - Cluster créé
   - Utilisateur de base de données créé
   - Votre IP est autorisée dans "Network Access"
   - L'URI de connexion est correcte

2. ✅ **MongoDB local fonctionne** (si transfert direct):
   ```bash
   # Vérifier que MongoDB local est actif
   mongosh "mongodb://localhost:27017"
   ```

3. ✅ **Les variables d'environnement sont correctes:**
   - `MONGODB_URI_ATLAS` contient votre URI Atlas complète
   - Le mot de passe est correct
   - Le nom d'utilisateur est correct

## Résolution des problèmes

### Erreur: "ENOTFOUND" ou "ECONNREFUSED"

**Cause**: Connexion impossible à MongoDB Atlas

**Solutions**:
1. Vérifiez que l'URI `MONGODB_URI_ATLAS` est correcte
2. Vérifiez que votre IP est autorisée dans MongoDB Atlas:
   - Allez dans "Network Access"
   - Ajoutez votre IP actuelle ou utilisez `0.0.0.0/0` (temporaire pour le test)
3. Vérifiez que le cluster Atlas est actif

### Erreur: "Authentication failed"

**Cause**: Identifiants incorrects

**Solutions**:
1. Vérifiez le nom d'utilisateur et le mot de passe dans l'URI
2. Assurez-vous que l'utilisateur existe dans MongoDB Atlas
3. Vérifiez que l'utilisateur a les permissions nécessaires

### Erreur: "E11000 duplicate key error"

**Cause**: Des documents avec les mêmes IDs existent déjà

**Solutions**:
1. Utilisez `--drop` pour supprimer les collections avant import:
   ```bash
   node scripts/import-database.mjs --drop
   ```
2. Le script essaie automatiquement d'utiliser `upsert` pour les duplications

### Erreur: "Collection already exists"

**Cause**: La collection existe déjà et l'option `--drop` n'est pas utilisée

**Solutions**:
1. Utilisez `--drop` pour remplacer les collections existantes
2. Ou importez seulement les collections manquantes

## Bonnes pratiques

1. **Toujours faire une sauvegarde avant migration:**
   ```bash
   npm run export:db
   ```

2. **Tester d'abord avec une collection spécifique:**
   ```bash
   node scripts/import-database.mjs --collection=users
   ```

3. **Vérifier les données dans Atlas après import:**
   - Utilisez MongoDB Compass pour visualiser les données
   - Ou connectez-vous via mongosh

4. **Utiliser `--drop` avec précaution:**
   - Cela supprime toutes les données existantes
   - Assurez-vous d'avoir une sauvegarde

5. **Surveiller les logs:**
   - Le script affiche le nombre de documents importés
   - Vérifiez qu'il n'y a pas d'erreurs

## Workflow recommandé

### Migration complète

```bash
# 1. Sauvegarder la base locale
npm run export:db

# 2. Vérifier la sauvegarde
ls -la backups/

# 3. Importer vers Atlas
npm run import:db

# 4. Vérifier dans MongoDB Atlas/Compass que les données sont présentes
```

### Mise à jour incrémentale

```bash
# Si vous voulez seulement mettre à jour certaines collections
node scripts/import-database.mjs taalimia_2025-11-23 --collection=users
node scripts/import-database.mjs taalimia_2025-11-23 --collection=labs
```

