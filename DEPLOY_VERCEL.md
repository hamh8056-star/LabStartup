# Guide de déploiement sur Vercel

## ⚠️ Points importants avant le déploiement

Votre application utilise **Socket.io** avec un serveur personnalisé (`server.js`), ce qui nécessite une configuration spéciale sur Vercel.

## 📋 Prérequis

1. **Compte Vercel** : Créez un compte sur [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket** : Votre code doit être dans un dépôt Git
3. **Variables d'environnement** : Préparez vos variables d'environnement

## 🚀 Méthode 1 : Déploiement via l'interface Vercel (Recommandé)

### Étape 1 : Préparer votre projet

1. **Assurez-vous que votre code est sur GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Préparation pour déploiement Vercel"
   git push origin main
   ```

2. **Créez un fichier `vercel.json`** à la racine du projet :
   ```json
   {
     "version": 2,
     "buildCommand": "npm run build",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "framework": "nextjs",
     "regions": ["cdg1"],
     "functions": {
       "app/api/**/*.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

### Étape 2 : Configuration Socket.io pour Vercel

⚠️ **Important** : Vercel utilise des fonctions serverless, ce qui pose problème pour Socket.io en temps réel. Vous avez deux options :

#### Option A : Utiliser Vercel Serverless Functions (Recommandé pour commencer)

Créez un fichier `vercel.json` avec cette configuration :

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/socket",
      "dest": "/api/socket"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Option B : Utiliser un service externe pour Socket.io (Recommandé pour production)

Pour Socket.io en production, utilisez un service dédié :
- **Socket.io avec Redis Adapter** sur un service comme Railway, Render, ou DigitalOcean
- **Pusher** ou **Ably** (services WebSocket managés)

### Étape 3 : Variables d'environnement

1. **Créez un fichier `.env.example`** (sans valeurs sensibles) :
   ```
   MONGODB_URI=
   NEXTAUTH_URL=
   NEXTAUTH_SECRET=
   NODE_ENV=production
   ```

2. **Sur Vercel**, ajoutez vos variables d'environnement :
   - Allez dans votre projet → Settings → Environment Variables
   - Ajoutez chaque variable :
     - `MONGODB_URI` : Votre URI MongoDB Atlas
     - `NEXTAUTH_URL` : URL de votre site Vercel (ex: https://votre-app.vercel.app)
     - `NEXTAUTH_SECRET` : Générez avec `openssl rand -base64 32`

### Étape 4 : Déployer sur Vercel

1. **Connectez votre dépôt Git** :
   - Allez sur [vercel.com/new](https://vercel.com/new)
   - Importez votre dépôt GitHub/GitLab/Bitbucket
   - Sélectionnez votre projet

2. **Configurez le projet** :
   - **Framework Preset** : Next.js (détecté automatiquement)
   - **Root Directory** : `./` (racine)
   - **Build Command** : `npm run build` (par défaut)
   - **Output Directory** : `.next` (par défaut)
   - **Install Command** : `npm install` (par défaut)

3. **Ajoutez les variables d'environnement** :
   - Cliquez sur "Environment Variables"
   - Ajoutez toutes vos variables (Production, Preview, Development)

4. **Déployez** :
   - Cliquez sur "Deploy"
   - Attendez la fin du build (2-5 minutes)

## 🔧 Méthode 2 : Déploiement via CLI Vercel

### Installation

```bash
npm i -g vercel
```

### Déploiement

```bash
# Se connecter à Vercel
vercel login

# Déployer (première fois)
vercel

# Déployer en production
vercel --prod
```

## 📝 Configuration MongoDB Atlas

1. **Créez un cluster MongoDB Atlas** (gratuit) : [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Configurez l'accès réseau** :
   - Dans Atlas → Network Access
   - Ajoutez `0.0.0.0/0` pour autoriser toutes les IPs (ou l'IP de Vercel)

3. **Créez un utilisateur de base de données** :
   - Dans Atlas → Database Access
   - Créez un utilisateur avec mot de passe

4. **Récupérez votre URI de connexion** :
   - Dans Atlas → Connect → Connect your application
   - Copiez l'URI (remplacez `<password>` par votre mot de passe)

## 🔐 Variables d'environnement requises

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=https://votre-app.vercel.app
NEXTAUTH_SECRET=votre-secret-genere-aleatoirement

# Environnement
NODE_ENV=production
```

## ⚙️ Configuration Socket.io pour Vercel

### Solution recommandée : Utiliser un service externe

Créez un fichier `lib/socket-server.ts` pour gérer Socket.io différemment en production :

```typescript
// lib/socket-server.ts
import { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null

export function getSocketServer() {
  if (!io && typeof window === 'undefined') {
    // Configuration pour Vercel Serverless
    io = new SocketIOServer({
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || '*',
        methods: ['GET', 'POST']
      }
    })
  }
  return io
}
```

### Alternative : Utiliser Pusher ou Ably

Pour une solution WebSocket managée, remplacez Socket.io par :
- **Pusher** : [pusher.com](https://pusher.com)
- **Ably** : [ably.com](https://ably.com)

## 🐛 Résolution de problèmes

### Erreur : "Module not found"
- Vérifiez que toutes les dépendances sont dans `package.json`
- Exécutez `npm install` localement pour vérifier

### Erreur : "Build failed"
- Vérifiez les logs de build sur Vercel
- Testez le build localement : `npm run build`

### Socket.io ne fonctionne pas
- Vercel Serverless Functions ont des limitations pour WebSocket
- Utilisez un service externe (Railway, Render) pour Socket.io
- Ou migrez vers Pusher/Ably

### Erreur de connexion MongoDB
- Vérifiez que l'IP `0.0.0.0/0` est autorisée dans MongoDB Atlas
- Vérifiez que `MONGODB_URI` est correctement configurée

## 📊 Monitoring et logs

1. **Vercel Dashboard** :
   - Allez sur votre projet → Logs
   - Consultez les logs en temps réel

2. **Analytics** :
   - Vercel Analytics (gratuit)
   - Intégration avec d'autres outils

## 🔄 Déploiement continu

Vercel déploie automatiquement :
- **Production** : À chaque push sur `main`/`master`
- **Preview** : À chaque pull request

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Next.js sur Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Socket.io avec Vercel](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js#websocket-support)

## ✅ Checklist de déploiement

- [ ] Code poussé sur GitHub/GitLab/Bitbucket
- [ ] Fichier `vercel.json` créé (si nécessaire)
- [ ] Variables d'environnement configurées
- [ ] MongoDB Atlas configuré et accessible
- [ ] `NEXTAUTH_SECRET` généré
- [ ] `NEXTAUTH_URL` configuré avec l'URL Vercel
- [ ] Build testé localement (`npm run build`)
- [ ] Socket.io configuré (service externe si nécessaire)
- [ ] Déploiement effectué
- [ ] Tests fonctionnels sur l'URL de production

## 🎉 Après le déploiement

1. **Testez votre application** sur l'URL fournie par Vercel
2. **Configurez un domaine personnalisé** (optionnel) :
   - Settings → Domains
   - Ajoutez votre domaine
3. **Activez les analytics** pour suivre les performances

