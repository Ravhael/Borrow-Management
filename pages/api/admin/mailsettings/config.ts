import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })

  try {
    const filePath = path.resolve(process.cwd(), 'data', 'mail-settings.json')
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Config not found' })
    const raw = fs.readFileSync(filePath, 'utf-8')
    const json = JSON.parse(raw)
    return res.status(200).json(json)
  } catch (err) {
    console.error('Failed to read mail-settings.json', err)
    return res.status(500).json({ message: 'Failed to read mail settings' })
  }
}
