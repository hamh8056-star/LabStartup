# 🚀 Guide de déploiement sur Render

Render est une excellente alternative à Vercel, surtout pour les applications avec Socket.io car il supporte les serveurs Node.js complets.

## 📋 Prérequis

- ✅ Compte Render ([render.com](https://render.com))
- ✅ Compte GitHub/GitLab/Bitbucket
- ✅ Projet poussé sur Git
- ✅ MongoDB Atlas configuré (ou autre base de données)

---

## 🔧 Étape 1 : Préparer le projet

### 1.1 Vérifier la configuration

Assurez-vous que votre `package.json` contient :

```json
{
  "scripts": {
    "start": "NODE_ENV=production node server.js",
    "build": "next build"
  }
}
```

### 1.2 Créer un fichier `render.yaml` (optionnel mais recommandé)

Créez un fichier `render.yaml` à la racine du projet :

```yaml
services:
  - type: web
    name: taalimia-app
    env: node
    plan: free  # ou starter/pro pour plus de ressources
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false  # À définir manuellement
      - key: NEXTAUTH_URL
        sync: false  # Sera généré automatiquement
      - key: NEXTAUTH_SECRET
        sync: false  # À définir manuellement
    healthCheckPath: /
```

### 1.3 Vérifier que le code est sur Git

```bash
git status
git add .
git commit -m "Préparation pour déploiement Render"
git push origin main
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
3. Ajoutez `0.0.0.0/0` (autorise toutes les IPs)
4. Cliquez sur **Confirm**

### 2.3 Créer un utilisateur de base de données

1. Dans Atlas → **Database Access**
2. Cliquez sur **Add New Database User**
3. Créez un nom d'utilisateur et un mot de passe
4. Donnez les permissions **Read and write to any database**
5. Cliquez sur **Add User**

### 2.4 Récupérer l'URI de connexion

1. Dans Atlas → **Database** → **Connect**
2. Choisissez **Connect your application**
3. Copiez l'URI de connexion
4. Remplacez `<password>` par votre mot de passe réel

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

**⚠️ Sauvegardez cette valeur !**

---

## 📦 Étape 4 : Déployer sur Render

### 4.1 Créer un compte Render

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **Get Started for Free**
3. Connectez-vous avec GitHub/GitLab/Bitbucket

### 4.2 Créer un nouveau service Web

1. Dans le Dashboard Render, cliquez sur **New +**
2. Sélectionnez **Web Service**
3. Connectez votre dépôt Git
4. Sélectionnez votre projet

### 4.3 Configurer le service

Remplissez les champs suivants :

| Champ | Valeur |
|-------|--------|
| **Name** | `taalimia-app` (ou votre nom) |
| **Environment** | `Node` |
| **Region** | `Frankfurt (EU)` ou `Oregon (US)` |
| **Branch** | `main` (ou votre branche principale) |
| **Root Directory** | `/` (racine) |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

### 4.4 Ajouter les variables d'environnement

Cliquez sur **Advanced** → **Add Environment Variable** et ajoutez :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NODE_ENV` | `production` | Environnement de production |
| `MONGODB_URI` | `mongodb+srv://...` | URI MongoDB Atlas |
| `NEXTAUTH_SECRET` | `votre-secret-genere` | Secret généré (étape 3) |
| `NEXTAUTH_URL` | `https://votre-app.onrender.com` | URL Render (sera générée) |
| `PORT` | `10000` | Port par défaut Render (optionnel) |

**⚠️ Important** : Pour `NEXTAUTH_URL`, utilisez d'abord une URL temporaire, puis mettez à jour avec l'URL réelle après le premier déploiement.

### 4.5 Choisir un plan

- **Free** : Gratuit, mais le service s'endort après 15 minutes d'inactivité
- **Starter** : $7/mois, pas de mise en veille
- **Pro** : $25/mois, meilleures performances

Pour commencer, choisissez **Free**.

### 4.6 Déployer

1. Cliquez sur **Create Web Service**
2. Render va automatiquement :
   - Cloner votre dépôt
   - Installer les dépendances
   - Builder l'application
   - Démarrer le service
3. Attendez 5-10 minutes pour le premier déploiement

### 4.7 Mettre à jour NEXTAUTH_URL

1. Une fois déployé, notez votre URL Render : `https://votre-app.onrender.com`
2. Allez dans **Environment** → **Environment Variables**
3. Modifiez `NEXTAUTH_URL` avec votre URL réelle
4. Cliquez sur **Save Changes**
5. Render redéploiera automatiquement

---

## ⚙️ Étape 5 : Configuration Socket.io sur Render

### 5.1 Vérifier server.js

Assurez-vous que votre `server.js` écoute sur le port fourni par Render :

```javascript
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 5.2 Configuration Socket.io

Votre `server.js` devrait déjà être configuré pour Socket.io. Render supporte les WebSockets nativement, donc pas besoin de configuration supplémentaire.

### 5.3 Vérifier la connexion

Une fois déployé, testez la connexion Socket.io dans votre application.

---

## 🔄 Étape 6 : Déploiement continu

Render déploie automatiquement :
- ✅ À chaque push sur la branche principale
- ✅ À chaque merge de pull request (si configuré)

Pour forcer un redéploiement :
1. Allez dans votre service
2. Cliquez sur **Manual Deploy**
3. Sélectionnez **Deploy latest commit**

---

## 🐛 Résolution de problèmes

### Erreur : "Build failed"

1. Consultez les logs de build sur Render
2. Vérifiez les erreurs dans les logs
3. Testez le build localement : `npm run build`

### Erreur : "Application failed to start"

1. Vérifiez les logs de runtime
2. Vérifiez que `startCommand` est correct
3. Vérifiez que le port est correctement configuré

### Erreur : "MongoDB connection failed"

1. Vérifiez que `MONGODB_URI` est correcte
2. Vérifiez que l'IP `0.0.0.0/0` est autorisée dans MongoDB Atlas
3. Vérifiez que le mot de passe dans l'URI est correct

### Le service s'endort (plan gratuit)

- Le service gratuit s'endort après 15 minutes d'inactivité
- Le premier démarrage après veille prend 30-60 secondes
- Solution : Passez au plan Starter ($7/mois) pour éviter la mise en veille

### Socket.io ne fonctionne pas

1. Vérifiez que `server.js` est bien utilisé
2. Vérifiez les logs pour les erreurs de connexion
3. Vérifiez que le port est correctement configuré

---

## 📊 Monitoring et logs

### Consulter les logs

1. Allez dans votre service Render
2. Cliquez sur **Logs**
3. Consultez les logs en temps réel

### Métriques

Render fournit des métriques de base :
- CPU usage
- Memory usage
- Request count

---

## 🔒 Sécurité

### Variables d'environnement sensibles

- Ne commitez jamais vos variables d'environnement
- Utilisez les variables d'environnement Render pour les secrets
- Activez **Auto-Deploy** uniquement pour la branche principale

### HTTPS

Render fournit automatiquement HTTPS pour tous les services.

---

## 💰 Plans et tarifs

| Plan | Prix | Caractéristiques |
|------|------|------------------|
| **Free** | $0/mois | 512 MB RAM, mise en veille après 15 min |
| **Starter** | $7/mois | 512 MB RAM, pas de mise en veille |
| **Pro** | $25/mois | 2 GB RAM, meilleures performances |

---

## ✅ Checklist de déploiement

Avant de déployer :

- [ ] Code poussé sur Git
- [ ] `render.yaml` créé (optionnel)
- [ ] Build testé localement (`npm run build`)
- [ ] MongoDB Atlas configuré
- [ ] `NEXTAUTH_SECRET` généré
- [ ] Variables d'environnement préparées
- [ ] `server.js` vérifié pour le port

Après le déploiement :

- [ ] Application accessible sur l'URL Render
- [ ] Connexion fonctionne
- [ ] Base de données connectée
- [ ] Variables d'environnement configurées
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] Socket.io fonctionne
- [ ] Fonctionnalités principales testées

---

## 🎯 Configuration avancée

### Ajouter un domaine personnalisé

1. Allez dans **Settings** → **Custom Domains**
2. Ajoutez votre domaine
3. Suivez les instructions DNS

### Variables d'environnement par environnement

Vous pouvez créer des services séparés pour :
- **Production** : Service principal
- **Staging** : Service de test (gratuit)

### Health Checks

Render vérifie automatiquement la santé de votre service via `healthCheckPath`.

---

## 📚 Ressources utiles

- [Documentation Render](https://render.com/docs)
- [Deploy Node.js on Render](https://render.com/docs/deploy-node-js)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [NextAuth.js](https://next-auth.js.org/)

---

## 🎉 Félicitations !

Votre application est maintenant déployée sur Render ! 🚀

**URL de production** : `https://votre-app.onrender.com`

---

## 💡 Avantages de Render vs Vercel

✅ **Support WebSocket natif** : Socket.io fonctionne sans configuration supplémentaire  
✅ **Serveur Node.js complet** : Pas de limitations serverless  
✅ **Gratuit pour commencer** : Plan gratuit disponible  
✅ **Déploiement automatique** : Intégration Git native  
✅ **HTTPS automatique** : Certificats SSL gratuits  

⚠️ **Inconvénients** :
- Mise en veille après 15 min (plan gratuit)
- Démarrage plus lent après veille (30-60 secondes)

---

**Besoin d'aide ?** Consultez les logs Render ou la documentation officielle.

