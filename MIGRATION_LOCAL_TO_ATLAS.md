# Guide de migration: Local → MongoDB Atlas

Guide rapide pour transférer votre base de données MongoDB locale vers MongoDB Atlas.

## 📋 Prérequis

1. **MongoDB Atlas configuré:**
   - Cluster créé
   - Utilisateur de base de données créé
   - Votre IP autorisée dans "Network Access"
   - URI de connexion copiée

2. **MongoDB local actif:**
   - MongoDB fonctionne sur `localhost:27017`
   - Base de données `taalimia` existe

## 🚀 Méthode rapide (Transfert direct)

### Étape 1: Configurer le fichier `.env`

Ouvrez votre fichier `.env` et ajoutez/modifiez ces variables:

```env
# Base de données locale (source)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=taalimia

# Base de données Atlas (destination)
MONGODB_URI_ATLAS=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_ATLAS=taalimia
```

**Important**: 
- Remplacez `username`, `password` et `cluster0.xxxxx.mongodb.net` par vos vraies valeurs
- L'URI doit ressembler à celle fournie par MongoDB Atlas

### Étape 2: Transférer les données

```bash
# Transférer toutes les données de local vers Atlas
node scripts/import-database.mjs --source-uri="mongodb://localhost:27017"
```

Le script va:
1. ✅ Se connecter à MongoDB local
2. ✅ Se connecter à MongoDB Atlas
3. ✅ Transférer toutes les collections
4. ✅ Afficher un résumé

## 🗂️ Méthode avec sauvegarde (Recommandée)

Si vous préférez créer d'abord une sauvegarde:

### Étape 1: Sauvegarder la base locale

```bash
# S'assurer que MONGODB_URI pointe vers local
# Dans .env: MONGODB_URI=mongodb://localhost:27017

npm run export:db
```

Cela créera une sauvegarde dans `backups/taalimia_YYYY-MM-DD/`

### Étape 2: Configurer l'URI Atlas

Dans `.env`, ajoutez:

```env
# URI Atlas (destination)
MONGODB_URI_ATLAS=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_ATLAS=taalimia
```

### Étape 3: Restaurer vers Atlas

```bash
# Restaurer depuis la dernière sauvegarde
npm run import:db

# Ou spécifier un dossier de sauvegarde
npm run import:db taalimia_2025-11-23
```

## ⚙️ Options avancées

### Transférer seulement certaines collections

```bash
# Transférer uniquement les utilisateurs
node scripts/import-database.mjs --source-uri="mongodb://localhost:27017" --collection=users
```

### Supprimer les collections existantes avant import

⚠️ **Attention**: Cela supprime toutes les données existantes dans Atlas!

```bash
node scripts/import-database.mjs --source-uri="mongodb://localhost:27017" --drop
```

### Spécifier l'URI manuellement

```bash
node scripts/import-database.mjs \
  --source-uri="mongodb://localhost:27017" \
  --target-uri="mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority" \
  --target-db="taalimia"
```

## 📊 Vérification après migration

### Option 1: MongoDB Compass

1. Téléchargez MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connectez-vous avec votre URI Atlas
3. Vérifiez que toutes les collections sont présentes
4. Vérifiez le nombre de documents

### Option 2: Vérifier via le script

Après migration, le script affiche:
- Nombre de documents importés
- Collections traitées
- Erreurs éventuelles

## 🔧 Dépannage

### Erreur: "ENOTFOUND" ou "ECONNREFUSED"

**Problème**: Impossible de se connecter à Atlas

**Solutions**:
1. Vérifiez que l'URI Atlas est correcte dans `.env`
2. Vérifiez que votre IP est autorisée:
   - Allez sur MongoDB Atlas → Network Access
   - Ajoutez votre IP actuelle
   - Ou temporairement: `0.0.0.0/0` (toutes les IP)
3. Vérifiez que le cluster Atlas est actif

### Erreur: "Authentication failed"

**Problème**: Identifiants incorrects

**Solutions**:
1. Vérifiez le nom d'utilisateur et le mot de passe dans l'URI
2. Assurez-vous que l'utilisateur existe dans MongoDB Atlas
3. Vérifiez les permissions de l'utilisateur

### Erreur: "ECONNREFUSED" pour MongoDB local

**Problème**: MongoDB local n'est pas démarré

**Solutions**:
1. Démarrez MongoDB local:
   ```bash
   # Windows (si installé comme service)
   net start MongoDB
   ```
2. Vérifiez que MongoDB écoute sur le port 27017

### Erreur: "E11000 duplicate key error"

**Problème**: Des documents avec les mêmes IDs existent déjà dans Atlas

**Solutions**:
1. Utilisez `--drop` pour supprimer les collections avant import:
   ```bash
   node scripts/import-database.mjs --source-uri="mongodb://localhost:27017" --drop
   ```
2. Ou importez seulement les collections manquantes

## 📝 Checklist de migration

Avant de migrer:
- [ ] MongoDB Atlas cluster créé
- [ ] Utilisateur de base de données créé dans Atlas
- [ ] IP autorisée dans "Network Access" Atlas
- [ ] URI Atlas copiée et ajoutée dans `.env` comme `MONGODB_URI_ATLAS`
- [ ] MongoDB local fonctionne
- [ ] Fichier `.env` configuré correctement

Pendant la migration:
- [ ] Exécuter le script de transfert
- [ ] Vérifier qu'il n'y a pas d'erreurs critiques
- [ ] Attendre la fin du transfert

Après la migration:
- [ ] Vérifier les collections dans MongoDB Compass/Atlas
- [ ] Vérifier le nombre de documents
- [ ] Tester l'application avec la nouvelle base de données
- [ ] Mettre à jour `MONGODB_URI` dans `.env` pour utiliser Atlas

## 🎯 Exemple complet

```bash
# 1. Vérifier que MongoDB local fonctionne
mongosh "mongodb://localhost:27017"

# 2. Configurer .env avec:
#    MONGODB_URI=mongodb://localhost:27017
#    MONGODB_URI_ATLAS=mongodb+srv://user:pass@cluster.mongodb.net/...

# 3. Transférer les données
node scripts/import-database.mjs --source-uri="mongodb://localhost:27017"

# 4. Vérifier dans MongoDB Compass que les données sont présentes
```

## 🔄 Après migration

Une fois la migration terminée, vous pouvez mettre à jour votre `.env` pour utiliser Atlas par défaut:

```env
# Utiliser Atlas comme base principale
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=taalimia
```

Puis redémarrer votre application pour qu'elle utilise Atlas.



