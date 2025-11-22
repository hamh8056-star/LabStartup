# 🚀 Guide de déploiement sur Vercel - Étapes détaillées

## 📋 Prérequis

- ✅ Compte Vercel ([vercel.com](https://vercel.com))
- ✅ Compte GitHub/GitLab/Bitbucket
- ✅ Projet poussé sur Git
- ✅ MongoDB Atlas configuré (ou autre base de données)

---

## 🔧 Étape 1 : Préparer le projet localement

### 1.1 Vérifier que le code est sur Git

```bash
# Vérifier le statut
git status

# Si des fichiers ne sont pas commités
git add .
git commit -m "Préparation pour déploiement Vercel"
git push origin main
```

### 1.2 Tester le build localement

```bash
# Installer les dépendances
npm install

# Tester le build
npm run build

# Si le build réussit, vous êtes prêt !
```

---

## 🌐 Étape 2 : Configurer MongoDB Atlas

### 2.1 Créer un cluster MongoDB Atlas

1. Allez sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un compte gratuit
3. Créez un nouveau cluster (gratuit M0)

### 2.2 Configurer l'accès réseau

1. Dans Atlas → **Network Access**
2. Cliquez sur **Add IP Address**
3. Ajoutez `0.0.0.0/0` (autorise toutes les IPs) ou l'IP de Vercel
4. Cliquez sur **Confirm**

### 2.3 Créer un utilisateur de base de données

1. Dans Atlas → **Database Access**
2. Cliquez sur **Add New Database User**
3. Choisissez **Password** comme méthode d'authentification
4. Créez un nom d'utilisateur et un mot de passe (⚠️ **SAUVEGARDEZ-LE**)
5. Donnez les permissions **Read and write to any database**
6. Cliquez sur **Add User**

### 2.4 Récupérer l'URI de connexion

1. Dans Atlas → **Database** → **Connect**
2. Choisissez **Connect your application**
3. Sélectionnez **Node.js** et la version la plus récente
4. Copiez l'URI de connexion (ex: `mongodb+srv://username:<password>@cluster.mongodb.net/dbname?retryWrites=true&w=majority`)
5. Remplacez `<password>` par votre mot de passe réel

---

## 🔐 Étape 3 : Générer NEXTAUTH_SECRET

```bash
# Sur Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Sur Mac/Linux
openssl rand -base64 32

# Ou utilisez un générateur en ligne
# https://generate-secret.vercel.app/32
```

**⚠️ Sauvegardez cette valeur, vous en aurez besoin !**

---

## 📦 Étape 4 : Déployer sur Vercel (Méthode Interface Web)

### 4.1 Importer le projet

1. Allez sur [vercel.com/new](https://vercel.com/new)
2. Connectez votre compte GitHub/GitLab/Bitbucket
3. Sélectionnez votre dépôt
4. Cliquez sur **Import**

### 4.2 Configurer le projet

Vercel détecte automatiquement Next.js, mais vérifiez :

- **Framework Preset** : `Next.js` ✅
- **Root Directory** : `./` (racine)
- **Build Command** : `npm run build` ✅
- **Output Directory** : `.next` ✅
- **Install Command** : `npm install` ✅

### 4.3 Ajouter les variables d'environnement

Cliquez sur **Environment Variables** et ajoutez :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | URI MongoDB Atlas (étape 2.4) |
| `NEXTAUTH_URL` | `https://votre-app.vercel.app` | URL de votre site Vercel (sera générée) |
| `NEXTAUTH_SECRET` | `votre-secret-genere` | Secret généré (étape 3) |
| `NODE_ENV` | `production` | Environnement de production |

**⚠️ Important** : Cochez **Production**, **Preview**, et **Development** pour chaque variable.

### 4.4 Déployer

1. Cliquez sur **Deploy**
2. Attendez 2-5 minutes pour le build
3. Une fois terminé, vous obtiendrez une URL : `https://votre-app.vercel.app`

### 4.5 Mettre à jour NEXTAUTH_URL

1. Une fois déployé, notez votre URL Vercel
2. Allez dans **Settings** → **Environment Variables**
3. Modifiez `NEXTAUTH_URL` avec votre URL réelle
4. Redéployez (ou attendez le prochain push)

---

## 💻 Étape 5 : Déployer via CLI (Alternative)

### 5.1 Installer Vercel CLI

```bash
npm i -g vercel
```

### 5.2 Se connecter

```bash
vercel login
```

### 5.3 Déployer

```bash
# Première fois (déploiement de prévisualisation)
vercel

# Déployer en production
vercel --prod
```

### 5.4 Ajouter les variables d'environnement via CLI

```bash
vercel env add MONGODB_URI
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add NODE_ENV
```

---

## ⚠️ Étape 6 : Configuration Socket.io (Important)

Vercel utilise des fonctions serverless qui ne supportent pas WebSocket nativement. Vous avez 3 options :

### Option A : Désactiver Socket.io temporairement

Si Socket.io n'est pas critique, vous pouvez le désactiver en production.

### Option B : Utiliser un service externe pour Socket.io

**Recommandé pour la production** :

1. **Railway** ([railway.app](https://railway.app)) :
   - Déployez `server.js` sur Railway
   - Utilisez l'URL Railway pour Socket.io

2. **Render** ([render.com](https://render.com)) :
   - Créez un service WebSocket
   - Déployez votre serveur Socket.io

3. **DigitalOcean** ([digitalocean.com](https://digitalocean.com)) :
   - Créez un Droplet
   - Installez Node.js et déployez `server.js`

### Option C : Utiliser Pusher ou Ably

Remplacez Socket.io par un service WebSocket managé :
- **Pusher** : [pusher.com](https://pusher.com) (gratuit jusqu'à 200k messages/jour)
- **Ably** : [ably.com](https://ably.com) (gratuit jusqu'à 3M messages/mois)

---

## ✅ Étape 7 : Vérifier le déploiement

### 7.1 Tester l'application

1. Visitez votre URL Vercel
2. Testez la connexion
3. Testez les fonctionnalités principales

### 7.2 Vérifier les logs

1. Allez dans votre projet Vercel
2. Cliquez sur **Logs**
3. Vérifiez qu'il n'y a pas d'erreurs

### 7.3 Tester la base de données

1. Connectez-vous à l'application
2. Vérifiez que les données sont sauvegardées dans MongoDB Atlas

---

## 🔄 Étape 8 : Déploiement continu

Vercel déploie automatiquement :
- ✅ **Production** : À chaque push sur `main`/`master`
- ✅ **Preview** : À chaque pull request

Pour forcer un redéploiement :
1. Allez dans **Deployments**
2. Cliquez sur les 3 points (⋯) d'un déploiement
3. Cliquez sur **Redeploy**

---

## 🐛 Résolution de problèmes courants

### Erreur : "Module not found"

```bash
# Vérifiez localement
npm install
npm run build
```

### Erreur : "Build failed"

1. Consultez les logs sur Vercel
2. Vérifiez les erreurs TypeScript/ESLint
3. Testez le build localement : `npm run build`

### Erreur : "MongoDB connection failed"

1. Vérifiez que `MONGODB_URI` est correcte
2. Vérifiez que l'IP `0.0.0.0/0` est autorisée dans MongoDB Atlas
3. Vérifiez que le mot de passe dans l'URI est correct

### Erreur : "NextAuth configuration error"

1. Vérifiez que `NEXTAUTH_URL` correspond à votre URL Vercel
2. Vérifiez que `NEXTAUTH_SECRET` est défini
3. Redéployez après avoir modifié les variables

### Socket.io ne fonctionne pas

- C'est normal sur Vercel (limitations serverless)
- Utilisez une des options de l'étape 6

---

## 📊 Checklist de déploiement

Avant de déployer :

- [ ] Code poussé sur Git
- [ ] Build testé localement (`npm run build`)
- [ ] MongoDB Atlas configuré
- [ ] `NEXTAUTH_SECRET` généré
- [ ] Variables d'environnement préparées
- [ ] `vercel.json` vérifié (optionnel)

Après le déploiement :

- [ ] Application accessible sur l'URL Vercel
- [ ] Connexion fonctionne
- [ ] Base de données connectée
- [ ] Variables d'environnement configurées
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] Fonctionnalités principales testées

---

## 🎯 Configuration avancée

### Ajouter un domaine personnalisé

1. Allez dans **Settings** → **Domains**
2. Ajoutez votre domaine
3. Suivez les instructions DNS

### Activer Vercel Analytics

1. Allez dans **Analytics**
2. Activez **Web Analytics** (gratuit)
3. Suivez les performances de votre site

### Configurer les redirections

Créez/modifiez `vercel.json` :

```json
{
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ]
}
```

---

## 📚 Ressources utiles

- [Documentation Vercel](https://vercel.com/docs)
- [Next.js sur Vercel](https://vercel.com/docs/frameworks/nextjs)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [NextAuth.js](https://next-auth.js.org/)

---

## 🎉 Félicitations !

Votre application est maintenant déployée sur Vercel ! 🚀

**URL de production** : `https://votre-app.vercel.app`

---

## 💡 Astuces

1. **Environnements multiples** : Utilisez des variables d'environnement différentes pour Preview et Production
2. **Monitoring** : Activez Vercel Analytics pour suivre les performances
3. **Backup** : Configurez des sauvegardes MongoDB Atlas régulières
4. **Performance** : Utilisez Vercel Edge Functions pour améliorer les performances
5. **Sécurité** : Ne commitez jamais vos variables d'environnement dans Git

---

**Besoin d'aide ?** Consultez les logs Vercel ou la documentation officielle.

