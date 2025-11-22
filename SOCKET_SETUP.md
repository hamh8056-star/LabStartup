# Configuration Socket.io pour la Collaboration en Temps Réel

## Installation

Les dépendances Socket.io sont déjà installées :
- `socket.io`
- `socket.io-client`
- `@types/socket.io`
- `@types/socket.io-client`

## Utilisation

### Option 1 : Serveur personnalisé (Recommandé)

Pour activer Socket.io avec Next.js, utilisez le serveur personnalisé :

```bash
# Développement
npm run dev:socket

# Production
npm run start:socket
```

Le serveur personnalisé (`server.js`) intègre Socket.io avec Next.js et gère :
- Les connexions WebSocket
- Le signaling WebRTC (offres, réponses, candidats ICE)
- Le chat en temps réel
- La gestion des salles de collaboration

### Option 2 : Serveur Socket.io séparé

Si vous préférez un serveur Socket.io séparé, vous pouvez :

1. Créer un serveur Socket.io dédié sur un port différent (ex: 3001)
2. Mettre à jour `NEXT_PUBLIC_SOCKET_URL` dans `.env.local` :
   ```
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

## Configuration

### Variables d'environnement

Ajoutez dans `.env.local` (optionnel si vous utilisez le serveur personnalisé) :

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Ports

Par défaut, le serveur écoute sur le port 3000. Pour changer :

```bash
PORT=3000 npm run dev:socket
```

## Fonctionnalités

### WebRTC Signaling

Le serveur gère automatiquement :
- Les offres WebRTC (`webrtc-offer`)
- Les réponses WebRTC (`webrtc-answer`)
- Les candidats ICE (`webrtc-ice-candidate`)

### Chat en Temps Réel

- Les messages sont sauvegardés dans MongoDB via l'API
- Diffusion en temps réel à tous les participants de la salle
- Événement `chat-message` pour recevoir les nouveaux messages

### Gestion des Salles

- `join-room` : Rejoindre une salle de collaboration
- `leave-room` : Quitter une salle
- `user-joined` : Notification quand un utilisateur rejoint
- `user-left` : Notification quand un utilisateur quitte
- `room-users` : Liste des utilisateurs dans la salle

## Test

1. Démarrer le serveur :
   ```bash
   npm run dev:socket
   ```

2. Ouvrir plusieurs onglets/navigateurs sur `http://localhost:3000/dashboard/collaboration`

3. Rejoindre la même salle depuis différents onglets

4. Tester :
   - Le chat en temps réel
   - La vidéo/audio (nécessite des permissions caméra/micro)
   - Le partage d'écran

## Dépannage

### Erreur de connexion Socket.io

- Vérifiez que le serveur personnalisé est démarré (`npm run dev:socket`)
- Vérifiez les logs du serveur pour les erreurs
- Vérifiez que le port n'est pas déjà utilisé

### WebRTC ne fonctionne pas

- Vérifiez les permissions caméra/micro dans le navigateur
- Vérifiez que vous utilisez HTTPS en production (WebRTC nécessite HTTPS)
- Vérifiez les logs de la console du navigateur

### Messages du chat ne s'affichent pas

- Vérifiez la connexion Socket.io dans la console du navigateur
- Vérifiez que l'API `/api/collaboration/rooms` fonctionne
- Vérifiez les logs du serveur pour les erreurs de sauvegarde

## Production

Pour la production, utilisez :

```bash
npm run build
npm run start:socket
```

Ou configurez votre plateforme de déploiement (Vercel, Railway, etc.) pour utiliser `server.js` comme point d'entrée.

**Note** : Certaines plateformes (comme Vercel) ne supportent pas les serveurs personnalisés. Dans ce cas, utilisez un service Socket.io externe (Socket.io Cloud, Pusher, etc.) ou un serveur séparé.



