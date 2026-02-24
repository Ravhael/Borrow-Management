import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

function run(cmd: string) {
  console.log(`> ${cmd}`)
  return execSync(cmd, { stdio: 'inherit' })
}

const root = process.cwd()

async function main() {
  try {
    console.log('Running DB export to data/*.json (checkpoint)...')
    // Use the existing export script to create the snapshots
    run('npx tsx scripts/export-current-db.ts')

    // If this isn't a git repo, just skip commit steps
    const gitDir = path.join(root, '.git')
    const isGit = fs.existsSync(gitDir)

    if (!isGit) {
      console.log('No .git directory found — export completed but auto-commit skipped (not a git repo).')
      return
    }

    // Check git for changes in data/
    const status = execSync('git status --porcelain data', { cwd: root }).toString().trim()

    if (!status) {
      console.log('No changes in data/*.json — nothing to commit.')
      return
    }

    console.log('Detected changes in data/ — staging files...')
    run('git add data/*.json')

    const date = new Date().toISOString().split('T')[0]
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: root }).toString().trim()
    const message = `checkpoint: snapshot from ${date} (on ${branch})`

    // Commit the snapshot
    run(`git commit -m "${message}"`)

    // Show short log of the commit
    const short = execSync('git show --summary --oneline -1', { cwd: root }).toString().trim()
    console.log('Committed snapshot:', short)
  } catch (err) {
    console.error('Failed to checkpoint and commit:', err)
    process.exit(1)
  }
}

main()
