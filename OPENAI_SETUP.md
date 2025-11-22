# Configuration OpenAI (ChatGPT) pour l'Assistant IA

## 🚀 Configuration Rapide

### 1. Obtenir une clé API OpenAI

1. Va sur [OpenAI Platform](https://platform.openai.com/api-keys)
2. Connecte-toi ou crée un compte
3. Clique sur "Create new secret key"
4. Copie la clé API (commence par `sk-`)

### 2. Configurer dans `.env.local`

Ajoute ou modifie ces lignes dans ton fichier `.env.local` :

```bash
# OpenAI (ChatGPT) - PRIORITÉ
OPENAI_API_KEY=sk-...  # Remplace par ta clé API
OPENAI_MODEL=gpt-4o-mini  # Modèle à utiliser (optionnel)

# Si tu veux désactiver Gemini, commente ou supprime cette ligne :
# GEMINI_API_KEY=...
```

### 3. Modèles OpenAI Disponibles

| Modèle | Description | Coût (approximatif) |
|--------|-------------|---------------------|
| **gpt-4o** | Le plus récent et puissant | ~$2.50 / 1M tokens input |
| **gpt-4o-mini** | Version allégée, économique | ~$0.15 / 1M tokens input |
| **gpt-3.5-turbo** | Le plus économique | ~$0.50 / 1M tokens input |

**Modèle par défaut** : `gpt-4o-mini` (bon équilibre performance/prix)

### 4. Configuration du Modèle

Tu peux spécifier le modèle dans `.env.local` :

```bash
# Pour utiliser GPT-4o (le plus puissant)
OPENAI_MODEL=gpt-4o

# Pour utiliser GPT-4o-mini (recommandé, économique)
OPENAI_MODEL=gpt-4o-mini

# Pour utiliser GPT-3.5-turbo (le plus économique)
OPENAI_MODEL=gpt-3.5-turbo
```

## 📝 Exemple de Configuration Complète

```bash
# OpenAI (ChatGPT) - PRIORITÉ
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=taalimia

# NextAuth Configuration
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## ✅ Vérification

Après avoir configuré, redémarre le serveur :

```bash
npm run dev
```

Tu devrais voir dans la console :
```
✅ Assistant IA configuré avec OpenAI (ChatGPT)
```

## 🔄 Priorité des Providers

Le système utilise les providers dans cet ordre :

1. **OpenAI** (si `OPENAI_API_KEY` est défini) ⭐ **PRIORITÉ**
2. Gemini (si `GEMINI_API_KEY` est défini)
3. Anthropic (si `ANTHROPIC_API_KEY` est défini)
4. Mode simulé (si aucune clé n'est configurée)

## 💰 Coûts

**Important** : OpenAI est un service payant. Les coûts sont basés sur l'utilisation :

- **GPT-4o-mini** : ~$0.15 par million de tokens d'entrée
- **GPT-3.5-turbo** : ~$0.50 par million de tokens d'entrée
- **GPT-4o** : ~$2.50 par million de tokens d'entrée

Tu peux surveiller ton utilisation sur [OpenAI Usage](https://platform.openai.com/usage)

## 🆘 Dépannage

### Erreur : "Invalid API Key"
- Vérifie que ta clé API commence par `sk-`
- Assure-toi qu'elle est correctement copiée dans `.env.local`
- Redémarre le serveur après modification

### Erreur : "Insufficient quota"
- Vérifie ton solde sur [OpenAI Billing](https://platform.openai.com/account/billing)
- Ajoute des crédits si nécessaire

### Le système utilise toujours Gemini
- Vérifie que `OPENAI_API_KEY` est bien défini dans `.env.local`
- Assure-toi qu'il n'y a pas d'erreur de syntaxe
- Redémarre le serveur

## 📚 Ressources

- [Documentation OpenAI API](https://platform.openai.com/docs)
- [Tarifs OpenAI](https://openai.com/pricing)
- [Guide des modèles](https://platform.openai.com/docs/models)



