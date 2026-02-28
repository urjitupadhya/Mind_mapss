#!/usr/bin/env node

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Bootstrap the CLI
import('../src/index.js').catch(err => {
    console.error('Failed to start mindctl:', err.message);
    process.exit(1);
});
