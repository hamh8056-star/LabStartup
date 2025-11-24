# Correction de l'erreur: querySrv ENOTFOUND _mongodb._tcp.201

## Problème

L'erreur `querySrv ENOTFOUND _mongodb._tcp.201` se produit lorsque votre URI MongoDB contient des caractères spéciaux non encodés dans le mot de passe ou le nom d'utilisateur.

Dans votre cas, votre URI MongoDB Atlas contient:
```
MONGODB_URI_ATLAS=mongodb+srv://nassir:Test@2017@cluster0.8iorewt.mongodb.net/...
```

Le problème est que le mot de passe `Test@2017` contient un caractère `@`, qui n'est pas encodé. MongoDB interprète ce `@` comme un séparateur entre les credentials et l'hôte, ce qui casse l'URI.

## Solution

### Option 1: Encoder les caractères spéciaux (Recommandé)

Encoder le caractère `@` dans le mot de passe en `%40`:

**Avant (cassé):**
```env
MONGODB_URI_ATLAS=mongodb+srv://nassir:Test@2017@cluster0.8iorewt.mongodb.net/taalimia?retryWrites=true&w=majority
```

**Après (corrigé):**
```env
MONGODB_URI_ATLAS=mongodb+srv://nassir:Test%402017@cluster0.8iorewt.mongodb.net/taalimia?retryWrites=true&w=majority
```

### Option 2: Créer un script d'encodage automatique

Vous pouvez utiliser ce script PowerShell pour encoder automatiquement votre URI:

```powershell
$password = "Test@2017"
$encodedPassword = [System.Web.HttpUtility]::UrlEncode($password)
Write-Host "Mot de passe encode: $encodedPassword"
```

### Caractères spéciaux à encoder dans les URIs MongoDB

Si votre mot de passe ou nom d'utilisateur contient des caractères spéciaux, vous devez les encoder:

| Caractère | Encodage URL |
|-----------|--------------|
| `@`       | `%40`        |
| `#`       | `%23`        |
| `$`       | `%24`        |
| `%`       | `%25`        |
| `&`       | `%26`        |
| `+`       | `%2B`        |
| `=`       | `%3D`        |
| `?`       | `%3F`        |
| `/`       | `%2F`        |
| ` ` (espace) | `%20`     |

### Option 3: Changer le mot de passe (Alternative)

Si possible, changez le mot de passe MongoDB pour utiliser uniquement des caractères alphanumériques et des symboles qui n'ont pas besoin d'encodage.

## Étapes de correction

1. **Ouvrez votre fichier `.env`**

2. **Trouvez la ligne `MONGODB_URI_ATLAS`**

3. **Remplacez `Test@2017` par `Test%402017`**

   **Ligne actuelle:**
   ```env
   MONGODB_URI_ATLAS=mongodb+srv://nassir:Test@2017@cluster0.8iorewt.mongodb.net/taalimia?retryWrites=true&w=majority
   ```

   **Ligne corrigée:**
   ```env
   MONGODB_URI_ATLAS=mongodb+srv://nassir:Test%402017@cluster0.8iorewt.mongodb.net/taalimia?retryWrites=true&w=majority
   ```

4. **Sauvegardez le fichier `.env`**

5. **Réessayez votre script d'import:**
   ```bash
   node scripts/import-database.mjs --source-uri="mongodb://localhost:27017"
   ```

## Vérification

Pour vérifier que l'URI est correcte, vous pouvez utiliser ce script Node.js:

```javascript
const uri = "mongodb+srv://nassir:Test%402017@cluster0.8iorewt.mongodb.net/taalimia?retryWrites=true&w=majority";
console.log("URI:", uri);

// Tester la connexion
const { MongoClient } = require('mongodb');
const client = new MongoClient(uri);

client.connect()
  .then(() => {
    console.log("✅ Connexion réussie!");
    return client.close();
  })
  .catch(err => {
    console.error("❌ Erreur de connexion:", err.message);
  });
```

## Autres causes possibles

Si après avoir encodé le mot de passe, l'erreur persiste, vérifiez:

1. **Résolution DNS:** Vérifiez que votre connexion internet fonctionne
2. **Firewall:** Vérifiez que le port 27017 ou HTTPS est ouvert
3. **IP autorisée:** Assurez-vous que votre IP est autorisée dans MongoDB Atlas (Network Access)
4. **Cluster actif:** Vérifiez que votre cluster MongoDB Atlas est actif
5. **Format de l'URI:** Assurez-vous que l'URI commence par `mongodb+srv://` pour Atlas

## Exemple d'URI MongoDB Atlas correcte

Format général:
```
mongodb+srv://username:password@cluster-name.xxxxx.mongodb.net/database-name?retryWrites=true&w=majority
```

Exemple avec mot de passe contenant des caractères spéciaux:
```
mongodb+srv://user:P%40ssw0rd%23@cluster0.xxxxx.mongodb.net/mydb?retryWrites=true&w=majority
```

Où:
- `user` = nom d'utilisateur
- `P%40ssw0rd%23` = mot de passe encodé (`P@ssw0rd#`)
- `cluster0.xxxxx.mongodb.net` = nom de votre cluster
- `mydb` = nom de votre base de données



