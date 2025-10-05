#!/usr/bin/env bun
/**
 * Post-build script to create TypeScript plugin wrapper files in dist/
 * This runs after tsdown builds to ensure the wrapper files exist
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const distDir = resolve(__dirname, '../dist')

// Ensure dist directory exists
try {
  mkdirSync(distDir, { recursive: true })
} catch {
  // Directory likely already exists
}

// Create typescript-plugin.cjs wrapper (must be .cjs for CommonJS in ES module package)
const pluginJs = `// Re-export the TypeScript Language Service Plugin from packages/typescript-plugin
module.exports = require('../packages/typescript-plugin/dist/index.js');
`

writeFileSync(resolve(distDir, 'typescript-plugin.cjs'), pluginJs, 'utf8')
console.log('✓ Created dist/typescript-plugin.cjs')

// Create typescript-plugin.d.ts type definitions
const pluginDts = `// Re-export the TypeScript Language Service Plugin types
export = require('../packages/typescript-plugin/dist/index');
`

writeFileSync(resolve(distDir, 'typescript-plugin.d.ts'), pluginDts, 'utf8')
console.log('✓ Created dist/typescript-plugin.d.ts')

// Also create .d.cts for proper CommonJS types
writeFileSync(resolve(distDir, 'typescript-plugin.d.cts'), pluginDts, 'utf8')
console.log('✓ Created dist/typescript-plugin.d.cts')

console.log('✓ TypeScript plugin wrappers created successfully')
