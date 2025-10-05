#!/usr/bin/env bun
/**
 * Post-build script to copy TypeScript plugin files to dist/typescript-plugin/
 * This runs after tsdown builds to ensure all files are in the main dist directory
 */

import { cpSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const distDir = resolve(__dirname, '../dist')
const tsPluginDistDir = resolve(distDir, 'typescript-plugin')
const tsPluginSrcDir = resolve(__dirname, '../packages/typescript-plugin/dist')

// Ensure dist directory exists
try {
  mkdirSync(distDir, { recursive: true })
} catch {
  // Directory likely already exists
}

// Copy TypeScript plugin files to dist/typescript-plugin/
try {
  mkdirSync(tsPluginDistDir, { recursive: true })
  cpSync(tsPluginSrcDir, tsPluginDistDir, { recursive: true })
  console.log('✓ Copied TypeScript plugin files to dist/typescript-plugin/')
} catch (error) {
  console.error('✗ Failed to copy TypeScript plugin files:', error)
  process.exit(1)
}

// Create typescript-plugin.cjs wrapper (must be .cjs for CommonJS in ES module package)
const pluginJs = `// Re-export the TypeScript Language Service Plugin
module.exports = require('./typescript-plugin/index.js');
`

writeFileSync(resolve(distDir, 'typescript-plugin.cjs'), pluginJs, 'utf8')
console.log('✓ Created dist/typescript-plugin.cjs')

// Create typescript-plugin.d.ts type definitions
const pluginDts = `// Re-export the TypeScript Language Service Plugin types
export = require('./typescript-plugin/index');
`

writeFileSync(resolve(distDir, 'typescript-plugin.d.ts'), pluginDts, 'utf8')
console.log('✓ Created dist/typescript-plugin.d.ts')

// Also create .d.cts for proper CommonJS types
writeFileSync(resolve(distDir, 'typescript-plugin.d.cts'), pluginDts, 'utf8')
console.log('✓ Created dist/typescript-plugin.d.cts')

console.log('✓ TypeScript plugin setup completed successfully')
