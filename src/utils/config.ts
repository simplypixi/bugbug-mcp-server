import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load environment configuration based on NODE_ENV
 * Loads .env.development for development, .env.production for production
 */
export function loadEnvironmentConfig(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFile = `.env.${nodeEnv}`;
  const envPath = join(__dirname, '..', '..', envFile);
  
  // Load the environment-specific file
  const result = config({ path: envPath });
  
  if (result.error) {
    console.warn(`Warning: Could not load ${envFile}. Using system environment variables.`);
    console.warn(`Error: ${result.error.message}`);
  } else {
    console.log(`✅ Loaded environment configuration from ${envFile}`);
  }
  
  // Validate required environment variables
  validateEnvironmentVariables();
}

/**
 * Validate that required environment variables are set
 */
function validateEnvironmentVariables(): void {
  const required = ['API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please check your environment configuration file.');
  }
  
  // Log configuration status (without sensitive values)
  console.log('🔧 Environment configuration:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  DEBUG: ${process.env.DEBUG || 'false'}`);
  console.log(`  LOG_LEVEL: ${process.env.LOG_LEVEL || 'info'}`);
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    apiKey: process.env.API_KEY,
    sentryDsn: process.env.SENTRY_DSN,
    debug: process.env.DEBUG === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
    isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
    isProduction: process.env.NODE_ENV === 'production'
  };
}
