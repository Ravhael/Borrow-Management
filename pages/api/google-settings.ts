import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'
import { AppsScriptConfig, updateAppsScriptConfig, getAppsScriptConfig, defaultAppsScriptConfig } from '../../data/appscript'
import { prisma } from '../../lib/prisma'

const configFilePath = path.join(process.cwd(), 'data', 'appscript-config.json')

async function handleTestRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const config = await getAppsScriptConfig()

    if (!config.enabled || !config.scriptUrl || !config.spreadsheetId) {
      return res.status(400).json({
        success: false,
        message: 'Google Sheets integration not configured or not enabled'
      })
    }

    // Create test data
    const testData = {
      id: 'test-' + Date.now(),
      submittedAt: new Date().toISOString(),
      isDraft: false,
      borrowerName: 'Test User', // Nama peminjam
      entitasId: 'test-entity',
      borrowerPhone: '08123456789',
      needType: 'test',
      company: 'Test Company',
      outDate: new Date().toISOString().split('T')[0],
      useDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      returnDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
      productDetailsText: 'Test submission from API - Laptop, Mouse, Keyboard',
      pickupMethod: 'test',
      note: 'This is a test submission from API',
      approvalAgreementFlag: true,
      lainnya: 'Test data from API'
    }

    // Send to Google Apps Script
    const response = await fetch(config.scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'submitLoan',
        data: testData,
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName || 'Loan Submissions'
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    return res.status(200).json({
      success: true,
      message: 'Test submission successful',
      result: result,
      testData: testData
    })

  } catch (error) {
    console.error('Error testing Google Sheets integration:', error)
    return res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // First try the database record (id=1) if available
      const dbRecord = await prisma.appscriptConfig.findUnique({ where: { id: 1 } })

      if (dbRecord) {
        const configFromDb: AppsScriptConfig = {
          spreadsheetId: dbRecord.spreadsheetId,
          scriptUrl: dbRecord.scriptUrl ?? '',
          sheetName: dbRecord.sheetName ?? defaultAppsScriptConfig.sheetName,
          enabled: Boolean(dbRecord.enabled)
        }
        return res.status(200).json(configFromDb)
      }

      // Fallback to reading from file
      const config = await getAppsScriptConfig()
      return res.status(200).json(config)
    } catch (error) {
      console.error('Error loading Apps Script config:', error)
      return res.status(200).json(defaultAppsScriptConfig)
    }
  }

  if (req.method === 'POST') {
    try {
      const config: Partial<AppsScriptConfig> = req.body

      // Check if this is a test request
      if (req.query.test === 'true') {
        return await handleTestRequest(req, res)
      }

      // Validate required fields
      if (!config.spreadsheetId || !config.scriptUrl) {
        return res.status(400).json({ message: 'Spreadsheet ID and Script URL are required' })
      }

      // Persist to database (upsert id=1) and also write the file snapshot
      const dataToPersist = {
        spreadsheetId: config.spreadsheetId,
        scriptUrl: config.scriptUrl ?? '',
        sheetName: config.sheetName ?? defaultAppsScriptConfig.sheetName,
        enabled: config.enabled ?? true
      }

      try {
        await prisma.appscriptConfig.upsert({
          where: { id: 1 },
          update: dataToPersist,
          create: dataToPersist
        })
      } catch (e) {
        // If DB access fails, still fallback to writing the file so settings are preserved
        console.warn('Failed to persist AppscriptConfig to DB — falling back to file', e)
      }

      // Save to file as canonical local snapshot
      await updateAppsScriptConfig(dataToPersist)

      return res.status(200).json({ message: 'Settings saved successfully' })
    } catch (error) {
      console.error('Error saving Apps Script config:', error)
      return res.status(500).json({ message: 'Failed to save settings' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}