/**
 * Fonctions utilitaires pour les scripts MongoDB
 */

/**
 * Extrait le nom de la base de données depuis une URI MongoDB
 * Formats supportés:
 * - mongodb://host:port/databaseName
 * - mongodb+srv://user:pass@cluster.net/databaseName?options
 * - mongodb://user:pass@host:port/databaseName?options
 */
export function extractDatabaseName(uri) {
  if (!uri) {
    return 'taalimia'; // Défaut
  }

  try {
    // Pour les URIs mongodb:// ou mongodb+srv://
    const url = new URL(uri);
    // Le nom de la base de données est dans le pathname après le premier slash
    const pathname = url.pathname;
    const dbName = pathname.split('/').filter(p => p)[0]; // Prendre le premier segment non vide
    
    if (dbName) {
      return dbName;
    }
  } catch (error) {
    // Fallback: chercher le pattern dans l'URI avec regex
    // Format: .../databaseName? ou .../databaseName
    const match = uri.match(/\/([^\/\?]+)(?:\?|$)/);
    if (match && match[1] && match[1] !== '') {
      return match[1];
    }
  }

  // Dernier recours: utiliser 'taalimia' par défaut
  return 'taalimia';
}

/**
 * Extrait l'URI MongoDB sans le nom de la base de données
 */
export function getMongoUriWithoutDb(uri) {
  if (!uri) {
    return uri;
  }

  try {
    const url = new URL(uri);
    // Retirer le pathname (nom de la base)
    url.pathname = '';
    return url.toString().replace(/\/$/, ''); // Retirer le slash final
  } catch (error) {
    // Fallback: retirer le dernier segment après le dernier slash
    return uri.replace(/\/[^\/]+(\?.*)?$/, '$1');
  }
}



