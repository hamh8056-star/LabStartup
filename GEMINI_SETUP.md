# Configuration de l'Assistant IA - Modèles Gratuits

## 🆓 Modèles Gratuits Disponibles

### Google Gemini (Recommandé - 100% Gratuit)

Gemini offre plusieurs modèles **gratuits** via l'API :

1. **gemini-1.5-flash** ⭐ (Recommandé)
   - Rapide et gratuit
   - Idéal pour la plupart des cas d'usage
   - Modèle par défaut

2. **gemini-1.5-pro**
   - Plus puissant que flash
   - Gratuit
   - Idéal pour des tâches complexes

3. **gemini-pro**
   - Modèle classique
   - Gratuit
   - Bonne alternative

### Comment obtenir une clé API Gemini (Gratuite)

1. Va sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connecte-toi avec ton compte Google
3. Clique sur "Create API Key"
4. Copie la clé API (gratuite, pas de carte bancaire requise)

### Configuration dans `.env.local`

```bash
# Google Gemini (GRATUIT)
GEMINI_API_KEY=AIza...  # Remplace par ta clé API
GEMINI_MODEL=gemini-1.5-flash  # Modèle gratuit (par défaut)
```

## 💰 OpenAI ChatGPT (Payant mais Économique)

**Note importante** : OpenAI n'offre **pas** de modèle vraiment gratuit via l'API. Cependant, `gpt-3.5-turbo` est très économique (environ $0.0015 par 1000 tokens).

### Modèles OpenAI disponibles

1. **gpt-3.5-turbo** (Économique)
   - ~$0.0015 par 1000 tokens
   - Très rapide
   - Bon pour la plupart des cas

2. **gpt-4o-mini** (Économique)
   - ~$0.15 par 1000 tokens
   - Plus puissant que 3.5-turbo
   - Bon rapport qualité/prix

### Configuration dans `.env.local`

```bash
# OpenAI (PAYANT mais économique)
OPENAI_API_KEY=sk-...  # Remplace par ta clé API
OPENAI_MODEL=gpt-3.5-turbo  # Modèle le plus économique
```

## 🎯 Recommandation

**Pour un usage gratuit** : Utilise **Google Gemini** avec `gemini-1.5-flash`

1. C'est 100% gratuit
2. Pas besoin de carte bancaire
3. Performances excellentes
4. Quota généreux

## Configuration Actuelle

Le système est configuré pour utiliser **Gemini** par défaut avec le modèle gratuit `gemini-1.5-flash`.

Si tu veux changer de modèle, modifie simplement `GEMINI_MODEL` dans `.env.local` :

```bash
# Pour utiliser le modèle pro (gratuit aussi)
GEMINI_MODEL=gemini-1.5-pro

# Pour utiliser le modèle classique (gratuit)
GEMINI_MODEL=gemini-pro
```

## Fallback Automatique

Le système bascule automatiquement vers un modèle gratuit si :
- Le modèle configuré n'est pas disponible (404)
- Le quota est dépassé (429)
- Le modèle nécessite un plan payant

Dans ces cas, le système essaiera automatiquement :
1. `gemini-1.5-flash` (gratuit)
2. `gemini-pro` (gratuit)

## Support

Pour plus d'informations :
- [Documentation Gemini API](https://ai.google.dev/gemini-api/docs)
- [Tarifs OpenAI](https://openai.com/pricing)



