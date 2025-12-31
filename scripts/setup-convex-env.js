#!/usr/bin/env node

/**
 * Setup Convex Environment Variables
 *
 * This script automatically configures the correct CLERK_JWT_ISSUER_DOMAIN
 * based on the current environment (development or production).
 *
 * Usage:
 *   node scripts/setup-convex-env.js          # Auto-detect from .env.local
 *   node scripts/setup-convex-env.js --dev    # Force development config
 *   node scripts/setup-convex-env.js --prod   # Force production config
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLERK_DOMAINS = {
  development: 'https://expert-lab-71.clerk.accounts.dev',
  production: 'https://clerk.thumbzap.com',
};

function getEnvFromFile() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    console.log('No .env.local found, defaulting to development');
    return 'development';
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');

  // Check if using test Clerk keys (pk_test_)
  if (envContent.includes('pk_test_')) {
    return 'development';
  }

  // Check if using live Clerk keys (pk_live_)
  if (envContent.includes('pk_live_')) {
    return 'production';
  }

  // Default to development
  return 'development';
}

function setConvexEnv(env) {
  const domain = CLERK_DOMAINS[env];

  console.log(`\nSetting up Convex for ${env.toUpperCase()} environment...`);
  console.log(`CLERK_JWT_ISSUER_DOMAIN: ${domain}\n`);

  try {
    execSync(`npx convex env set CLERK_JWT_ISSUER_DOMAIN "${domain}"`, {
      stdio: 'inherit',
    });
    console.log(`\n✅ Convex environment configured for ${env}`);
    console.log('\nNote: Restart `npx convex dev` to apply changes.');
  } catch (error) {
    console.error('Failed to set Convex environment variable:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

let targetEnv;

if (args.includes('--prod') || args.includes('--production')) {
  targetEnv = 'production';
} else if (args.includes('--dev') || args.includes('--development')) {
  targetEnv = 'development';
} else {
  // Auto-detect from .env.local
  targetEnv = getEnvFromFile();
  console.log(`Auto-detected environment: ${targetEnv}`);
}

setConvexEnv(targetEnv);
