export interface ServerEnv {
  FAL_API_KEY: string;
  GOOGLE_API_KEY?: string;
  CEREBRAS_API_KEY?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

export const getEnv = (): ServerEnv => {
  const FAL_API_KEY = process.env.FAL_API_KEY;
  if (!FAL_API_KEY) {
    throw new Error('FAL_API_KEY missing in environment');
  }
  return {
    FAL_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
};
