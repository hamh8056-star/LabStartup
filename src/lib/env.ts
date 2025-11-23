import { z } from "zod";

/**
 * Extrait le nom de la base de données depuis une URI MongoDB
 * Formats supportés:
 * - mongodb://host:port/databaseName
 * - mongodb+srv://user:pass@cluster.net/databaseName?options
 * - mongodb://user:pass@host:port/databaseName?options
 */
export function extractDatabaseName(uri: string): string {
  try {
    const url = new URL(uri);
    // Le nom de la base de données est dans le pathname après le premier slash
    const pathname = url.pathname;
    const dbName = pathname.split('/')[1] || pathname.slice(1);
    
    // Si pas de nom de base dans l'URI, utiliser 'test' comme défaut
    // ou retourner 'taalimia' pour compatibilité
    return dbName || 'taalimia';
  } catch (error) {
    // Fallback: chercher le pattern dans l'URI
    const match = uri.match(/\/+([^\/\?]+)(?:\?|$)/);
    if (match && match[1]) {
      return match[1];
    }
    // Dernier recours
    return 'taalimia';
  }
}

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
});

type Env = z.infer<typeof envSchema> & {
  MONGODB_DB: string;
};

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    const parsed = envSchema.parse({
      MONGODB_URI: process.env.MONGODB_URI,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      PUSHER_APP_ID: process.env.PUSHER_APP_ID,
      PUSHER_KEY: process.env.PUSHER_KEY,
      PUSHER_SECRET: process.env.PUSHER_SECRET,
      PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
    });

    // Extraire le nom de la base de données depuis l'URI
    const dbName = process.env.MONGODB_DB || extractDatabaseName(parsed.MONGODB_URI);

    cachedEnv = {
      ...parsed,
      MONGODB_DB: dbName,
    };
  }

  return cachedEnv;
}

