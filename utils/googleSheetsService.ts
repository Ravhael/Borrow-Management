import { AppsScriptConfig, getAppsScriptConfig, isAppsScriptEnabled } from '../data/appscript'
import { NeedType, NeedTypeLabels } from '../utils/needTypes'

export class GoogleSheetsService {

  static async submitToGoogleSheets(loanData: any): Promise<boolean> {
    try {
      // Check if Apps Script is enabled
      if (!(await isAppsScriptEnabled())) {
        console.log('Google Sheets integration not enabled or not configured')
        return false
      }

      const settings = await getAppsScriptConfig()
      if (!settings || !settings.scriptUrl) {
        console.log('Google Sheets integration not configured')
        return false
      }

      // Prepare data for Google Sheets
      // prefer structured `needDetails` but keep `demo`/`backup` properties for backward compat
      const nd = (loanData && loanData.needDetails) ? loanData.needDetails : {}

      const sheetData = {
        id: loanData.id,
        submittedAt: loanData.submittedAt,
        isDraft: loanData.isDraft,
        borrowerName: loanData.borrowerName,
        entitasId: loanData.entitasId,
        borrowerPhone: loanData.borrowerPhone,
        needType: loanData.needType,
        company: Array.isArray(loanData.company) ? loanData.company.join(', ') : loanData.company,
        outDate: loanData.outDate,
        useDate: loanData.useDate,
        returnDate: loanData.returnDate,
        productDetailsText: loanData.productDetailsText,
        pickupMethod: loanData.pickupMethod,
        note: loanData.note,
        approvalAgreementFlag: loanData.approvalAgreementFlag,
        lainnya: loanData.lainnya,
        // also include needDetails and backward-compat demo/backup maps
        needDetails: nd,
        demo: loanData.needType === 'DEMO_PRODUCT' ? nd : (loanData.demo ?? null),
        backup: loanData.needType === 'BARANG_BACKUP' ? nd : (loanData.backup ?? null),
        approvals: loanData.approvals ?? null,
        approvalNotifications: loanData.approvalNotifications ?? null
      }

      // Send to Google Apps Script
      // Map needType to the desired sheet name (override default sheet if present)
      const sheetMap: Record<string, string> = {
        [NeedType.DEMO_PRODUCT]: 'Demo Product',
        [NeedType.BARANG_BACKUP]: 'Barang Backup',
        [NeedType.ANALISA_TESTING]: 'Analisa Testing',
        [NeedType.DEMO_SHOWROOM]: 'Demo Showroom',
        [NeedType.PAMERAN_EVENT]: 'Pameran Event',
        [NeedType.LAINNYA]: 'Lainnya',
      }

      // Resolve sheet name robustly: accept enum keys (e.g., 'DEMO_PRODUCT') or human labels ('Demo Product')
      const resolveSheetName = (needTypeValue) => {
        if (!needTypeValue) return null
        const raw = String(needTypeValue).trim()
        // direct key match
        if (sheetMap[raw]) return sheetMap[raw]
        // uppercase enum-like match
        const upper = raw.toUpperCase()
        if (sheetMap[upper]) return sheetMap[upper]
        // try match by label (case-insensitive)
        for (const [k, label] of Object.entries(NeedTypeLabels)) {
          if (String(label).toLowerCase() === raw.toLowerCase()) {
            if (sheetMap[k]) return sheetMap[k]
          }
        }
        return null
      }

      const resolved = resolveSheetName(loanData?.needType)
      const selectedSheetName = resolved || settings.sheetName || 'Loan Submissions'

      if (!resolved) console.warn(`Could not map needType='${loanData?.needType}' to sheet; using default='${selectedSheetName}'`)
      console.log(`Submitting to Google Sheets (sheet='${selectedSheetName}') for needType='${loanData?.needType}'`)

      // Debug: log the exact payload we're sending to Apps Script
      try {
        console.log('GoogleSheetsService: payload=', JSON.stringify({ action: 'submitLoan', data: sheetData, spreadsheetId: settings.spreadsheetId, sheetName: selectedSheetName }));
      } catch (e) {
        console.warn('GoogleSheetsService: error stringifying payload', e)
      }

      const { fetchWithTimeout } = await import('../utils/fetchWithTimeout')
      const response = await fetchWithTimeout(settings.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submitLoan',
          data: sheetData,
          spreadsheetId: settings.spreadsheetId,
          sheetName: selectedSheetName,
          token: settings.token || undefined
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Data submitted to Google Sheets:', result)

      return result.success === true
    } catch (error) {
      console.error('Error submitting to Google Sheets:', error)
      return false
    }
  }

  /**
   * Update the MKT Status column for an existing loan row identified by loanId.
   * The Apps Script must implement action 'updateMktStatus' to locate the row and update the column.
   */
  static async updateMktStatus(loanId: string, mktStatus: string, sheetName?: string): Promise<boolean> {
    try {
      if (!(await isAppsScriptEnabled())) {
        console.log('Google Sheets integration not enabled or not configured')
        return false
      }
      const settings = await getAppsScriptConfig()
      if (!settings || !settings.scriptUrl) {
        console.log('Google Sheets integration not configured')
        return false
      }

      const selectedSheetName = sheetName || settings.sheetName || 'Loan Submissions'
      console.log(`Updating MKT Status in Google Sheets (sheet='${selectedSheetName}') for loanId='${loanId}'`)

      const payload: any = {
        action: 'updateMktStatus',
        spreadsheetId: settings.spreadsheetId,
        sheetName: selectedSheetName,
        loanId,
        mktStatus
      }
      if (settings.token) payload.token = settings.token

      try { console.log('GoogleSheetsService.updateMktStatus payload=', JSON.stringify(payload)) } catch (_) {}

      const { fetchWithTimeout } = await import('../utils/fetchWithTimeout')
      const timeoutValue = Number(process.env.GOOGLE_SHEETS_TIMEOUT_MS ?? '')
      const timeoutMs = !Number.isNaN(timeoutValue) && timeoutValue > 0 ? timeoutValue : 15000
      const response = await fetchWithTimeout(settings.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, timeoutMs)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('GoogleSheetsService.updateMktStatus result=', result)
      return result.success === true
    } catch (err) {
      console.error('Error updating MKT Status on Google Sheets:', err)
      return false
    }
  }

  /**
   * Update the Warehouse Status column for an existing loan row identified by loanId.
   * The Apps Script must implement action 'updateWarehouseStatus'.
   */
  static async updateWarehouseStatus(loanId: string, warehouseStatus: string, sheetName?: string): Promise<boolean> {
    try {
      if (!(await isAppsScriptEnabled())) {
        console.log('Google Sheets integration not enabled or not configured')
        return false
      }
      const settings = await getAppsScriptConfig()
      if (!settings || !settings.scriptUrl) {
        console.log('Google Sheets integration not configured')
        return false
      }

      const selectedSheetName = sheetName || settings.sheetName || 'Loan Submissions'
      console.log(`Updating Warehouse Status in Google Sheets (sheet='${selectedSheetName}') for loanId='${loanId}'`)

      const payload: any = {
        action: 'updateWarehouseStatus',
        spreadsheetId: settings.spreadsheetId,
        sheetName: selectedSheetName,
        loanId,
        warehouseStatus
      }
      if (settings.token) payload.token = settings.token

      try { console.log('GoogleSheetsService.updateWarehouseStatus payload=', JSON.stringify(payload)) } catch (_) {}

      const { fetchWithTimeout } = await import('../utils/fetchWithTimeout')
      const response = await fetchWithTimeout(settings.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('GoogleSheetsService.updateWarehouseStatus result=', result)
      return result.success === true
    } catch (err) {
      console.error('Error updating Warehouse Status on Google Sheets:', err)
      return false
    }
  }

  /**
   * Update the Extend Status column for an existing loan row identified by loanId.
   * The Apps Script must implement action 'updateExtendStatus'.
   */
  static async updateExtendStatus(loanId: string, extendStatus: string, sheetName?: string): Promise<boolean> {
    try {
      if (!(await isAppsScriptEnabled())) {
        console.log('Google Sheets integration not enabled or not configured')
        return false
      }
      const settings = await getAppsScriptConfig()
      if (!settings || !settings.scriptUrl) {
        console.log('Google Sheets integration not configured')
        return false
      }

      const selectedSheetName = sheetName || settings.sheetName || 'Loan Submissions'
      console.log(`Updating Extend Status in Google Sheets (sheet='${selectedSheetName}') for loanId='${loanId}'`)

      const payload: any = {
        action: 'updateExtendStatus',
        spreadsheetId: settings.spreadsheetId,
        sheetName: selectedSheetName,
        loanId,
        extendStatus
      }
      if (settings.token) payload.token = settings.token

      try { console.log('GoogleSheetsService.updateExtendStatus payload=', JSON.stringify(payload)) } catch (_) {}

      const { fetchWithTimeout } = await import('../utils/fetchWithTimeout')
      const response = await fetchWithTimeout(settings.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('GoogleSheetsService.updateExtendStatus result=', result)
      return result.success === true
    } catch (err) {
      console.error('Error updating Extend Status on Google Sheets:', err)
      return false
    }
  }

  /**
   * Update the Return Requested column for an existing loan row identified by loanId.
   * The Apps Script must implement action 'updateReturnRequested'.
   */
  static async updateReturnRequested(loanId: string, returnRequested: string, sheetName?: string): Promise<boolean> {
    try {
      if (!(await isAppsScriptEnabled())) {
        console.log('Google Sheets integration not enabled or not configured')
        return false
      }
      const settings = await getAppsScriptConfig()
      if (!settings || !settings.scriptUrl) {
        console.log('Google Sheets integration not configured')
        return false
      }

      const selectedSheetName = sheetName || settings.sheetName || 'Loan Submissions'
      console.log(`Updating Return Requested in Google Sheets (sheet='${selectedSheetName}') for loanId='${loanId}'`)

      const payload: any = {
        action: 'updateReturnRequested',
        spreadsheetId: settings.spreadsheetId,
        sheetName: selectedSheetName,
        loanId,
        returnRequested
      }
      if (settings.token) payload.token = settings.token

      try { console.log('GoogleSheetsService.updateReturnRequested payload=', JSON.stringify(payload)) } catch (_) {}

      const { fetchWithTimeout } = await import('../utils/fetchWithTimeout')
      const response = await fetchWithTimeout(settings.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('GoogleSheetsService.updateReturnRequested result=', result)
      return result.success === true
    } catch (err) {
      const abortName = (err as any)?.name
      if (abortName === 'AbortError') {
        const abortMessage = (err as any)?.message ?? err
        console.warn('Return Requested update timed out on Google Sheets; will rely on fallback if configured.', abortMessage)
      } else {
        console.error('Error updating Return Requested on Google Sheets:', err)
      }
      return false
    }
  }

  /**
   * Update the Return Accepted column for an existing loan row identified by loanId.
   * The Apps Script must implement action 'updateReturnAccepted'.
   */
  static async updateReturnAccepted(loanId: string, returnAccepted: string, sheetName?: string): Promise<boolean> {
    try {
      if (!(await isAppsScriptEnabled())) {
        console.log('Google Sheets integration not enabled or not configured')
        return false
      }
      const settings = await getAppsScriptConfig()
      if (!settings || !settings.scriptUrl) {
        console.log('Google Sheets integration not configured')
        return false
      }

      const selectedSheetName = sheetName || settings.sheetName || 'Loan Submissions'
      console.log(`Updating Return Accepted in Google Sheets (sheet='${selectedSheetName}') for loanId='${loanId}'`)

      const payload: any = {
        action: 'updateReturnAccepted',
        spreadsheetId: settings.spreadsheetId,
        sheetName: selectedSheetName,
        loanId,
        returnAccepted
      }
      if (settings.token) payload.token = settings.token

      try { console.log('GoogleSheetsService.updateReturnAccepted payload=', JSON.stringify(payload)) } catch (_) {}

      const { fetchWithTimeout } = await import('../utils/fetchWithTimeout')
      const response = await fetchWithTimeout(settings.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('GoogleSheetsService.updateReturnAccepted result=', result)
      return result.success === true
    } catch (err) {
      console.error('Error updating Return Accepted on Google Sheets:', err)
      return false
    }
  }

  /**
   * Update the Completed column for an existing loan row identified by loanId.
   * The Apps Script must implement action 'updateCompleted'.
   */
  static async updateCompleted(loanId: string, completed: string, sheetName?: string): Promise<boolean> {
    try {
      if (!(await isAppsScriptEnabled())) {
        console.log('Google Sheets integration not enabled or not configured')
        return false
      }
      const settings = await getAppsScriptConfig()
      if (!settings || !settings.scriptUrl) {
        console.log('Google Sheets integration not configured')
        return false
      }

      const selectedSheetName = sheetName || settings.sheetName || 'Loan Submissions'
      console.log(`Updating Completed in Google Sheets (sheet='${selectedSheetName}') for loanId='${loanId}'`)

      const payload: any = {
        action: 'updateCompleted',
        spreadsheetId: settings.spreadsheetId,
        sheetName: selectedSheetName,
        loanId,
        completed
      }
      if (settings.token) payload.token = settings.token

      try { console.log('GoogleSheetsService.updateCompleted payload=', JSON.stringify(payload)) } catch (_) {}

      const { fetchWithTimeout } = await import('../utils/fetchWithTimeout')
      const response = await fetchWithTimeout(settings.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('GoogleSheetsService.updateCompleted result=', result)
      return result.success === true
    } catch (err) {
      console.error('Error updating Completed on Google Sheets:', err)
      return false
    }
  }

  // Helper: resolve sheet name from needType (kept static so other callers can reuse the mapping)
  static resolveSheetNameFromNeedType(needTypeValue?: string) {
    const sheetMap: Record<string, string> = {
      [NeedType.DEMO_PRODUCT]: 'Demo Product',
      [NeedType.BARANG_BACKUP]: 'Barang Backup',
      [NeedType.ANALISA_TESTING]: 'Analisa Testing',
      [NeedType.DEMO_SHOWROOM]: 'Demo Showroom',
      [NeedType.PAMERAN_EVENT]: 'Pameran Event',
      [NeedType.LAINNYA]: 'Lainnya',
    }
    if (!needTypeValue) return null
    const raw = String(needTypeValue).trim()
    if (sheetMap[raw]) return sheetMap[raw]
    const upper = raw.toUpperCase()
    if (sheetMap[upper]) return sheetMap[upper]
    for (const [k, label] of Object.entries(NeedTypeLabels)) {
      if (String(label).toLowerCase() === raw.toLowerCase()) {
        if (sheetMap[k]) return sheetMap[k]
      }
    }
    return null
  }

  static async updateMktStatusForLoan(loan: any, mktStatus: string): Promise<boolean> {
    try {
      const settings = await getAppsScriptConfig()
      const resolved = GoogleSheetsService.resolveSheetNameFromNeedType(loan?.needType)
      const primarySheetName = resolved || settings?.sheetName || 'Loan Submissions'
      const loanId = String(loan?.id || loan?.form_number || '')

      console.log(`updateMktStatusForLoan: primary sheet='${primarySheetName}' (needType='${loan?.needType}') loanId='${loanId}'`)

      const primaryOk = await GoogleSheetsService.updateMktStatus(loanId, mktStatus, primarySheetName)
      if (primaryOk) return true

      const fallbackSheetName = settings?.sheetName
      if (fallbackSheetName && fallbackSheetName !== primarySheetName) {
        console.log(`updateMktStatusForLoan: retrying fallback sheet='${fallbackSheetName}'`)
        return await GoogleSheetsService.updateMktStatus(loanId, mktStatus, fallbackSheetName)
      }

      return false
    } catch (err) {
      console.error('Error in updateMktStatusForLoan:', err)
      return false
    }
  }

  static async updateWarehouseStatusForLoan(loan: any, warehouseStatus: string): Promise<boolean> {
    try {
      const settings = await getAppsScriptConfig()
      const resolved = GoogleSheetsService.resolveSheetNameFromNeedType(loan?.needType)
      const primarySheetName = resolved || settings?.sheetName || 'Loan Submissions'
      const loanId = String(loan?.id || loan?.form_number || '')

      console.log(`updateWarehouseStatusForLoan: primary sheet='${primarySheetName}' (needType='${loan?.needType}') loanId='${loanId}'`)

      const primaryOk = await GoogleSheetsService.updateWarehouseStatus(loanId, warehouseStatus, primarySheetName)
      if (primaryOk) return true

      const fallbackSheetName = settings?.sheetName
      if (fallbackSheetName && fallbackSheetName !== primarySheetName) {
        console.log(`updateWarehouseStatusForLoan: retrying fallback sheet='${fallbackSheetName}'`)
        return await GoogleSheetsService.updateWarehouseStatus(loanId, warehouseStatus, fallbackSheetName)
      }

      return false
    } catch (err) {
      console.error('Error in updateWarehouseStatusForLoan:', err)
      return false
    }
  }

  static async updateExtendStatusForLoan(loan: any, extendStatus: string): Promise<boolean> {
    try {
      const settings = await getAppsScriptConfig()
      const resolved = GoogleSheetsService.resolveSheetNameFromNeedType(loan?.needType)
      const primarySheetName = resolved || settings?.sheetName || 'Loan Submissions'
      const loanId = String(loan?.id || loan?.form_number || '')

      console.log(`updateExtendStatusForLoan: primary sheet='${primarySheetName}' (needType='${loan?.needType}') loanId='${loanId}'`)

      const primaryOk = await GoogleSheetsService.updateExtendStatus(loanId, extendStatus, primarySheetName)
      if (primaryOk) return true

      const fallbackSheetName = settings?.sheetName
      if (fallbackSheetName && fallbackSheetName !== primarySheetName) {
        console.log(`updateExtendStatusForLoan: retrying fallback sheet='${fallbackSheetName}'`)
        return await GoogleSheetsService.updateExtendStatus(loanId, extendStatus, fallbackSheetName)
      }

      return false
    } catch (err) {
      console.error('Error in updateExtendStatusForLoan:', err)
      return false
    }
  }

  static async updateReturnRequestedForLoan(loan: any, returnRequested: string): Promise<boolean> {
    try {
      const settings = await getAppsScriptConfig()
      const resolved = GoogleSheetsService.resolveSheetNameFromNeedType(loan?.needType)
      const primarySheetName = resolved || settings?.sheetName || 'Loan Submissions'
      const loanId = String(loan?.id || loan?.form_number || '')

      console.log(`updateReturnRequestedForLoan: primary sheet='${primarySheetName}' (needType='${loan?.needType}') loanId='${loanId}'`)

      const primaryOk = await GoogleSheetsService.updateReturnRequested(loanId, returnRequested, primarySheetName)
      if (primaryOk) return true

      const fallbackSheetName = settings?.sheetName
      if (fallbackSheetName && fallbackSheetName !== primarySheetName) {
        console.log(`updateReturnRequestedForLoan: retrying fallback sheet='${fallbackSheetName}'`)
        return await GoogleSheetsService.updateReturnRequested(loanId, returnRequested, fallbackSheetName)
      }

      return false
    } catch (err) {
      console.error('Error in updateReturnRequestedForLoan:', err)
      return false
    }
  }

  static async updateReturnAcceptedForLoan(loan: any, returnAccepted: string): Promise<boolean> {
    try {
      const settings = await getAppsScriptConfig()
      const resolved = GoogleSheetsService.resolveSheetNameFromNeedType(loan?.needType)
      const primarySheetName = resolved || settings?.sheetName || 'Loan Submissions'
      const loanId = String(loan?.id || loan?.form_number || '')

      console.log(`updateReturnAcceptedForLoan: primary sheet='${primarySheetName}' (needType='${loan?.needType}') loanId='${loanId}'`)

      const primaryOk = await GoogleSheetsService.updateReturnAccepted(loanId, returnAccepted, primarySheetName)
      if (primaryOk) return true

      const fallbackSheetName = settings?.sheetName
      if (fallbackSheetName && fallbackSheetName !== primarySheetName) {
        console.log(`updateReturnAcceptedForLoan: retrying fallback sheet='${fallbackSheetName}'`)
        return await GoogleSheetsService.updateReturnAccepted(loanId, returnAccepted, fallbackSheetName)
      }

      return false
    } catch (err) {
      console.error('Error in updateReturnAcceptedForLoan:', err)
      return false
    }
  }

  static async updateCompletedForLoan(loan: any, completed: string): Promise<boolean> {
    try {
      const settings = await getAppsScriptConfig()
      const resolved = GoogleSheetsService.resolveSheetNameFromNeedType(loan?.needType)
      const primarySheetName = resolved || settings?.sheetName || 'Loan Submissions'
      const loanId = String(loan?.id || loan?.form_number || '')

      console.log(`updateCompletedForLoan: primary sheet='${primarySheetName}' (needType='${loan?.needType}') loanId='${loanId}'`)

      const primaryOk = await GoogleSheetsService.updateCompleted(loanId, completed, primarySheetName)
      if (primaryOk) return true

      const fallbackSheetName = settings?.sheetName
      if (fallbackSheetName && fallbackSheetName !== primarySheetName) {
        console.log(`updateCompletedForLoan: retrying fallback sheet='${fallbackSheetName}'`)
        return await GoogleSheetsService.updateCompleted(loanId, completed, fallbackSheetName)
      }

      return false
    } catch (err) {
      console.error('Error in updateCompletedForLoan:', err)
      return false
    }
  }
}