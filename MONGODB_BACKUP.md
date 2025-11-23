# Guide de sauvegarde MongoDB

## Option 1: Script Node.js (Recommandé - Pas besoin d'installer MongoDB)

J'ai créé un script Node.js qui peut exporter votre base de données MongoDB sans avoir besoin d'installer MongoDB Database Tools.

### Utilisation

1. Assurez-vous que votre fichier `.env` contient votre URI MongoDB correcte:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=taalimia
   ```

2. Exécutez le script d'export:
   ```bash
   npm run export:db
   # ou
   node scripts/export-database.mjs
   ```

3. Les fichiers seront sauvegardés dans le dossier `backups/` avec la structure suivante:
   ```
   backups/
   └── taalimia_2024-01-15/
       ├── _summary.json      # Résumé de l'export
       ├── users.json         # Collection users
       ├── labs.json          # Collection labs
       └── ...                # Autres collections
   ```

### Configuration du répertoire de sortie

Vous pouvez définir le répertoire de sortie via la variable d'environnement `OUTPUT_DIR`:
```bash
OUTPUT_DIR=./my-backups npm run export:db
```

## Option 2: Installer MongoDB Database Tools

Si vous préférez utiliser les outils officiels MongoDB:

### Windows

1. Téléchargez MongoDB Database Tools depuis:
   https://www.mongodb.com/try/download/database-tools

2. Extrayez l'archive dans un dossier (ex: `C:\mongodb-tools`)

3. Ajoutez le dossier au PATH:
   - Ouvrez "Variables d'environnement" dans Windows
   - Ajoutez `C:\mongodb-tools\bin` au PATH utilisateur ou système

4. Vérifiez l'installation:
   ```powershell
   mongodump --version
   ```

5. Exécutez mongodump:
   ```powershell
   # Pour MongoDB local
   mongodump.exe --uri="mongodb://localhost:27017" --db=taalimia --out="backups"

   # Pour MongoDB Atlas
   mongodump.exe --uri="mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority" --db=taalimia --out="backups"
   ```

### Alternative: Utiliser MongoDB Compass

MongoDB Compass est une interface graphique qui permet d'exporter des collections:
1. Téléchargez MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connectez-vous à votre base de données
3. Sélectionnez une collection
4. Cliquez sur "Export Collection" et choisissez le format JSON ou CSV

## Restauration d'une sauvegarde

### Avec le script Node.js

Un script de restauration est maintenant disponible! Voir `MONGODB_RESTORE.md` pour les instructions complètes.

**Exemple rapide:**
```bash
# Restaurer vers MongoDB Atlas depuis la dernière sauvegarde
npm run import:db

# Restaurer depuis un dossier spécifique
npm run import:db taalimia_2025-11-23

# Transférer directement depuis local vers Atlas
node scripts/import-database.mjs --source-uri="mongodb://localhost:27017"
```

### Avec mongorestore (alternative)

```powershell
# Restaurer depuis une sauvegarde mongodump
mongorestore.exe --uri="mongodb://localhost:27017" --db=taalimia backups/taalimia_2024-01-15/
```

### Notes importantes

- ⚠️ Les mots de passe dans les URIs MongoDB ne doivent jamais être partagés publiquement
- 💾 Faites des sauvegardes régulières de votre base de données
- 🔒 Assurez-vous que les fichiers de sauvegarde sont sécurisés (chiffrement recommandé)
- 📝 Ajoutez le dossier `backups/` à `.gitignore` pour ne pas commiter les sauvegardes

## Dépannage

### Erreur: "ENOTFOUND" ou "ECONNREFUSED"
- Vérifiez que MongoDB est démarré (si local)
- Vérifiez que l'URI MongoDB dans `.env` est correcte
- Vérifiez que vous avez accès au serveur MongoDB (IP whitelist si MongoDB Atlas)

### Erreur: "Authentication failed"
- Vérifiez le nom d'utilisateur et le mot de passe dans l'URI
- Assurez-vous que l'utilisateur a les permissions nécessaires

