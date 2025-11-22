export async function withFallback<T>(
  loader: () => Promise<T>,
  fallback: () => T,
  context?: string,
): Promise<T> {
  try {
    return await loader()
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[taalimia:data:${context ?? "unknown"}]`, error)
    }
    return fallback()
  }
}


