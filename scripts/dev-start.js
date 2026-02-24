#!/usr/bin/env node
// Cross-platform dev starter: sets NODE_ENV and runs `next dev` using the local node_modules binary
const { spawn } = require('child_process')
const path = require('path')

// Make sure we force 'development'
process.env.NODE_ENV = 'development'

// Prefer invoking through npx/next via shell which works consistently on Windows and Unix
// Turbopack speeds up dev rebuilds significantly versus webpack
const cmd = process.platform === 'win32' ? 'npx.cmd next dev --turbo' : 'npx next dev --turbo'

const child = spawn(cmd, {
  stdio: 'inherit',
  env: process.env,
  shell: true,
})

child.on('close', (code) => process.exit(code))
child.on('error', (err) => {
  console.error('Failed to start next dev:', err)
  process.exit(1)
})
