# Configuration MongoDB pour LabStartup

## Comment obtenir votre URI MongoDB

### Option 1: MongoDB Atlas (Recommandé pour production)

1. Créez un compte gratuit sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Créez un nouveau cluster (choisissez le plan gratuit M0)
3. Configurez la sécurité:
   - Créez un utilisateur de base de données (nom d'utilisateur et mot de passe)
   - Ajoutez votre adresse IP à la liste blanche (ou utilisez `0.0.0.0/0` pour permettre toutes les IP - uniquement pour le développement)
4. Cliquez sur "Connect" puis "Connect your application"
5. Copiez la chaîne de connexion qui ressemble à:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Remplacez `<password>` par le mot de passe de votre utilisateur

### Option 2: MongoDB local (pour développement local)

Si vous avez MongoDB installé localement:
```
MONGODB_URI=mongodb://localhost:27017/taalimia
```

## Configuration du fichier .env

1. Copiez `.env.example` vers `.env` (ou utilisez le fichier `.env` existant)
2. Remplacez `MONGODB_URI` par votre URI MongoDB réelle
3. Assurez-vous que `NEXTAUTH_SECRET` est défini (un secret a déjà été généré)
4. Vérifiez que `NEXTAUTH_URL` correspond à votre URL de déploiement

## Exemple de fichier .env correct

```env
NODE_ENV=production
NEXTAUTH_URL=https://labstartup-acf8.onrender.com
NEXTAUTH_SECRET=qpoOF/2x0kL+huYZ9fmA3QC1U1GPoJsoUCdZ2jq73JU=
MONGODB_URI=mongodb+srv://monuser:mypassword123@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=taalimia
```

## Vérification

Après avoir configuré le `.env`, redémarrez votre serveur:
```bash
npm run dev
# ou
node server.js
```

L'erreur `querySrv ENOTFOUND _mongodb._tcp.cluster.mongodb.net` devrait disparaître une fois que vous aurez remplacé l'URI placeholder par votre vraie URI MongoDB.


