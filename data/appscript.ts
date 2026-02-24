// Google Apps Script configuration data
import fs from 'fs/promises'
import path from 'path'

export interface AppsScriptConfig {
  spreadsheetId: string
  scriptUrl: string
  sheetName?: string
  enabled: boolean
  token?: string
}

export const defaultAppsScriptConfig: AppsScriptConfig = {
  spreadsheetId: '',
  scriptUrl: '',
  sheetName: 'Loan Submissions',
  enabled: false
}

const configFilePath = path.join(process.cwd(), 'data', 'appscript-config.json')

// Load config from JSON file
async function loadConfigFromFile(): Promise<AppsScriptConfig> {
  try {
    const configData = await fs.readFile(configFilePath, 'utf-8')
    return JSON.parse(configData)
  } catch (error) {
    return defaultAppsScriptConfig
  }
}

// Save config to JSON file
async function saveConfigToFile(config: AppsScriptConfig): Promise<void> {
  await fs.writeFile(configFilePath, JSON.stringify(config, null, 2), 'utf-8')
}

// In-memory config (loaded on first access)
let cachedConfig: AppsScriptConfig | null = null

// Function to get current configuration
export async function getAppsScriptConfig(): Promise<AppsScriptConfig> {
  if (!cachedConfig) {
    cachedConfig = await loadConfigFromFile()
  }
  return { ...cachedConfig }
}

// Function to update configuration
export async function updateAppsScriptConfig(config: Partial<AppsScriptConfig>): Promise<void> {
  const currentConfig = await getAppsScriptConfig()
  const newConfig = {
    ...currentConfig,
    ...config
  }

  // Save to file
  await saveConfigToFile(newConfig)

  // Update cache
  cachedConfig = newConfig
}

// Function to check if Apps Script integration is enabled
export async function isAppsScriptEnabled(): Promise<boolean> {
  const config = await getAppsScriptConfig()
  return config.enabled &&
         config.spreadsheetId.trim() !== '' &&
         config.scriptUrl.trim() !== ''
}