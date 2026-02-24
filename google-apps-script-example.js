// Google Apps Script code for handling form submissions
// Deploy as web app with "Execute as: Me" and "Who has access: Anyone"
// NOTE: Headers must be created manually in rows 1-3. This script only appends data starting from row 4.

function doPost(e) {
  try {
    const raw = (e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const data = JSON.parse(raw || '{}');

    // Optional secret token check (set APPS_SCRIPT_SECRET in Project Properties to require it)
    const secret = PropertiesService.getScriptProperties().getProperty('APPS_SCRIPT_SECRET') || '';
    if (secret && String(data.token || '') !== String(secret)) {
      return jsonResponse({ success: false, message: 'Unauthorized: invalid token' }, 401);
    }

    const action = (data.action || '').toString().trim();
    if (!action) return jsonResponse({ success: false, message: 'No action specified' }, 400);

    if (action === 'submitLoan') {
      const sheetName = data.sheetName || undefined;
      console.log(`doPost: submitLoan received for sheet='${sheetName}'`);
      return submitLoanToSheet(data.data, data.spreadsheetId, sheetName);
    } else if (action === 'updateMktStatus') {
      console.log('doPost: updateMktStatus received', data.loanId);
      return handleUpdateMktStatus(data);
    } else if (action === 'updateWarehouseStatus') {
      console.log('doPost: updateWarehouseStatus received', data.loanId);
      return handleUpdateWarehouseStatus(data);
    } else if (action === 'updateExtendStatus') {
      console.log('doPost: updateExtendStatus received', data.loanId);
      return handleUpdateExtendStatus(data);
    } else if (action === 'updateReturnRequested') {
      console.log('doPost: updateReturnRequested received', data.loanId);
      return handleUpdateReturnRequested(data);
    } else if (action === 'updateReturnAccepted') {
      console.log('doPost: updateReturnAccepted received', data.loanId);
      return handleUpdateReturnAccepted(data);
    } else if (action === 'updateCompleted') {
      console.log('doPost: updateCompleted received', data.loanId);
      return handleUpdateCompleted(data);
    }

    return jsonResponse({ success: false, message: `Unknown action '${action}'` }, 400);

  } catch (error) {
    console.error('Error in doPost:', error);
    return jsonResponse({ success: false, message: error.toString() }, 500);
  }
} 

function submitLoanToSheet(loanData, spreadsheetId, sheetName = 'Master Request') {
  try {
    // Open the spreadsheet (use fallback id if not provided)
    const ssId = spreadsheetId || '1Nn1LxPKEUpVAsqEolMkaovioXJquRfSxINwWeCjDn2E';
    const spreadsheet = SpreadsheetApp.openById(ssId);

    // Ensure sheet exists (create if it does not)
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      console.log(`Created new sheet: ${sheetName}`);
    }

    const headerRowIndex = 3;
    const dataStartRow = 4;

    const headersMap = {
      'Demo Product': [
        'No','Timestamp','No. Pengajuan','Nama Peminjam','Entitas Peminjam','No Telepon Peminjam','Jenis Kebutuhan',
        'Nama Customer','Nama Perusahaan / Institusi','Alamat','No Telepon Customer','MKT Company','Rincian Product',
        'Metode Pengambilan Barang','Tanggal barang keluar dari gudang','Tanggal barang dipakai','Tanggal barang dikembalikan',
        'Catatan','MKT Status','Warehouse Status','Extend Status','Return Requested','Return Accepted','Completed'
      ],
      'Barang Backup': [
        'No','Timestamp','No. Pengajuan','Nama Peminjam','Entitas Peminjam','No Telepon Peminjam','Jenis Kebutuhan',
        'Nama Customer','Nama Perusahaan / Institusi','Alamat','No Telepon Customer','Alasan Kebutuhan Barang Backup?','MKT Company',
        'Rincian Product','Metode Pengambilan Barang','Tanggal barang keluar dari gudang','Tanggal barang dipakai','Tanggal barang dikembalikan',
        'Catatan','MKT Status','Warehouse Status','Extend Status','Return Requested','Return Accepted','Completed'
      ],
      'Analisa Testing': [
        'No','Timestamp','No. Pengajuan','Nama Peminjam','Entitas Peminjam','No Telepon Peminjam','Jenis Kebutuhan',
        'MKT Company','Rincian Product','Metode Pengambilan Barang','Tanggal barang keluar dari gudang','Tanggal barang dipakai','Tanggal barang dikembalikan',
        'Catatan','MKT Status','Warehouse Status','Extend Status','Return Requested','Return Accepted','Completed'
      ],
      'Lainnya': [
        'No','Timestamp','No. Pengajuan','Nama Peminjam','Entitas Peminjam','No Telepon Peminjam','Jenis Kebutuhan','Tuliskan Kebutuhan Peminjaman','MKT Company','Rincian Product','Metode Pengambilan Barang','Tanggal barang keluar dari gudang','Tanggal barang dipakai','Tanggal barang dikembalikan',
        'Catatan','MKT Status','Warehouse Status','Extend Status','Return Requested','Return Accepted','Completed'
      ],
      'default': [
        'No','Timestamp','No. Pengajuan','Nama Peminjam','Entitas Peminjam','No Telepon Peminjam','Jenis Kebutuhan',
        'Nama Customer / Perusahaan','Alamat','No Telepon Customer','MKT Company','Rincian Product','Metode Pengambilan Barang',
        'Tanggal barang keluar dari gudang','Tanggal barang dipakai','Tanggal barang dikembalikan','Catatan','MKT Status','Warehouse Status',
        'Extend Status','Return Requested','Return Accepted','Completed'
      ]
    };

    const headers = headersMap[sheetName] || headersMap['default'];

    // Debug logs to help diagnose MKT Status population issues
    try {
      console.log('submitLoanToSheet: received sheetName=', sheetName);
      console.log('submitLoanToSheet: received company=', JSON.stringify(loanData.company));
      console.log('submitLoanToSheet: received approvals=', JSON.stringify(loanData.approvals));
    } catch (e) {
      console.warn('submitLoanToSheet: error logging payload', e);
    }

    // Ensure headers are present (write if the header row is empty)
    const existing = sheet.getRange(headerRowIndex, 1, 1, headers.length).getValues()[0];
    const needWriteHeader = existing.length === 0 || existing.every(c => c === '' || c === null);
    if (needWriteHeader) {
      sheet.getRange(headerRowIndex, 1, 1, headers.length).setValues([headers]);
      console.log(`Wrote headers to sheet '${sheetName}' at row ${headerRowIndex}`);
    }

    // Determine the next available row (do not write above dataStartRow)
    const lastRow = sheet.getLastRow();
    const writeRow = lastRow < dataStartRow ? dataStartRow : lastRow + 1;

    // Compute sequential No based on dataStartRow
    const seqNo = writeRow - dataStartRow + 1;

    // Format timestamp as DD/MMMM/YYYY (e.g. 22/Desember/2025)
    const formatTimestamp = (iso) => {
      const d = iso ? new Date(iso) : new Date();
      if (isNaN(d)) return '';
      const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      const dd = String(d.getDate()).padStart(2, '0');
      return `${dd}/${months[d.getMonth()]}/${d.getFullYear()}`;
    }

    // Helper: compute MKT Status cell value
    const getMktStatus = (loan) => {
      try {
        if (!loan) return ''
        // If approvals exist and there is a single company in payload, prefer the company's approvals object
        if (loan.approvals && loan.approvals.companies && loan.company) {
          const comp = Array.isArray(loan.company) ? loan.company[0] : loan.company
          if (comp && loan.approvals.companies[comp]) return JSON.stringify(loan.approvals.companies[comp])
        }
        if (loan.approvals) return JSON.stringify(loan.approvals)
        if (loan.approvalNotifications) return JSON.stringify(loan.approvalNotifications)
      } catch (e) {
        console.warn('getMktStatus: error', e)
      }
      return ''
    }

    // Build row depending on sheet type
    let row;
    if (sheetName === 'Demo Product') {
      const demo = (loanData && loanData.needDetails && loanData.needType === 'DEMO_PRODUCT') ? loanData.needDetails : (loanData.demo || {});
      row = [
        '', // No (manual entry in sheet)
        formatTimestamp(loanData.submittedAt), // Timestamp (DD/MMMM/YYYY)
        loanData.id || '', // No. Pengajuan
        loanData.borrowerName || '', // Nama Peminjam
        loanData.entitasId || '', // Entitas Peminjam
        loanData.borrowerPhone || '', // No Telepon Peminjam
        loanData.needType || '', // Jenis Kebutuhan
        demo.namaCustomer || '', // Nama Customer
        demo.namaPerusahaan || '', // Nama Perusahaan / Institusi
        demo.alamat || '', // Alamat
        demo.telepon || '', // No Telepon Customer
        Array.isArray(loanData.company) ? loanData.company.join(', ') : (loanData.company || ''), // MKT Company
        loanData.productDetailsText || '', // Rincian Product
        loanData.pickupMethod || '', // Metode Pengambilan Barang
        loanData.outDate ? new Date(loanData.outDate) : (loanData.outDate || ''), // Tanggal keluar gudang
        loanData.useDate ? new Date(loanData.useDate) : (loanData.useDate || ''), // Tanggal dipakai
        loanData.returnDate ? new Date(loanData.returnDate) : (loanData.returnDate || ''), // Tanggal dikembalikan
        loanData.note || '', // Catatan
        getMktStatus(loanData), // MKT Status
        (loanData.warehouseStatus !== undefined) ? JSON.stringify(loanData.warehouseStatus) : '', // Warehouse Status
        (loanData.extendStatus !== undefined) ? JSON.stringify(loanData.extendStatus) : '', // Extend Status
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'returnRequested');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Return Requested
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'returnAccepted');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Return Accepted
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'completed');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Completed
      ];
    } else if (sheetName === 'Barang Backup') {
      const backup = (loanData && loanData.needDetails && loanData.needType === 'BARANG_BACKUP') ? loanData.needDetails : (loanData.backup || {});
      row = [
        '', // No (manual entry in sheet)
        formatTimestamp(loanData.submittedAt), // Timestamp (DD/MMMM/YYYY)
        loanData.id || '', // No. Pengajuan
        loanData.borrowerName || '', // Nama Peminjam
        loanData.entitasId || '', // Entitas Peminjam
        loanData.borrowerPhone || '', // No Telepon Peminjam
        loanData.needType || '', // Jenis Kebutuhan
        backup.namaCustomer || '', // Nama Customer
        backup.namaPerusahaan || '', // Nama Perusahaan / Institusi
        backup.alamat || '', // Alamat
        backup.telepon || '', // No Telepon Customer
        backup.alasan || '', // Alasan Kebutuhan Barang Backup?
        Array.isArray(loanData.company) ? loanData.company.join(', ') : (loanData.company || ''), // MKT Company
        loanData.productDetailsText || '', // Rincian Product
        loanData.pickupMethod || '', // Metode Pengambilan Barang
        loanData.outDate ? new Date(loanData.outDate) : (loanData.outDate || ''), // Tanggal keluar gudang
        loanData.useDate ? new Date(loanData.useDate) : (loanData.useDate || ''), // Tanggal dipakai
        loanData.returnDate ? new Date(loanData.returnDate) : (loanData.returnDate || ''), // Tanggal dikembalikan
        loanData.note || '', // Catatan
        getMktStatus(loanData), // MKT Status
        (loanData.warehouseStatus !== undefined) ? JSON.stringify(loanData.warehouseStatus) : '', // Warehouse Status
        (loanData.extendStatus !== undefined) ? JSON.stringify(loanData.extendStatus) : '', // Extend Status
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'returnRequested');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Return Requested
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'returnAccepted');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Return Accepted
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'completed');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Completed
      ];
    } else if (sheetName === 'Demo Showroom') {
      const company = Array.isArray(loanData.company) ? loanData.company.join(', ') : (loanData.company || '');
      row = [
        '', // No (manual entry in sheet)
        formatTimestamp(loanData.submittedAt), // Timestamp (DD/MMMM/YYYY)
        loanData.id || '', // No. Pengajuan
        loanData.borrowerName || '', // Nama Peminjam
        loanData.entitasId || '', // Entitas Peminjam
        loanData.borrowerPhone || '', // No Telepon Peminjam
        loanData.needType || '', // Jenis Kebutuhan
        company, // MKT Company
        loanData.productDetailsText || '', // Rincian Product
        loanData.pickupMethod || '', // Metode Pengambilan Barang
        loanData.outDate ? new Date(loanData.outDate) : (loanData.outDate || ''), // Tanggal keluar gudang
        loanData.useDate ? new Date(loanData.useDate) : (loanData.useDate || ''), // Tanggal dipakai
        loanData.returnDate ? new Date(loanData.returnDate) : (loanData.returnDate || ''), // Tanggal dikembalikan
        loanData.note || '', // Catatan
        getMktStatus(loanData), // MKT Status
        (loanData.warehouseStatus !== undefined) ? JSON.stringify(loanData.warehouseStatus) : '', // Warehouse Status
        (loanData.extendStatus !== undefined) ? JSON.stringify(loanData.extendStatus) : '', // Extend Status
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'returnRequested');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Return Requested
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'returnAccepted');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Return Accepted
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'completed');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Completed
      ];
    } else if (sheetName === 'Pameran Event') {
      const company = Array.isArray(loanData.company) ? loanData.company.join(', ') : (loanData.company || '');
      row = [
        '', // No (manual entry in sheet)
        formatTimestamp(loanData.submittedAt), // Timestamp (DD/MMMM/YYYY)
        loanData.id || '', // No. Pengajuan
        loanData.borrowerName || '', // Nama Peminjam
        loanData.entitasId || '', // Entitas Peminjam
        loanData.borrowerPhone || '', // No Telepon Peminjam
        loanData.needType || '', // Jenis Kebutuhan
        company, // MKT Company
        loanData.productDetailsText || '', // Rincian Product
        loanData.pickupMethod || '', // Metode Pengambilan Barang
        loanData.outDate ? new Date(loanData.outDate) : (loanData.outDate || ''), // Tanggal keluar gudang
        loanData.useDate ? new Date(loanData.useDate) : (loanData.useDate || ''), // Tanggal dipakai
        loanData.returnDate ? new Date(loanData.returnDate) : (loanData.returnDate || ''), // Tanggal dikembalikan
        loanData.note || '', // Catatan
        getMktStatus(loanData), // MKT Status
        (loanData.warehouseStatus !== undefined) ? JSON.stringify(loanData.warehouseStatus) : '', // Warehouse Status
        (loanData.extendStatus !== undefined) ? JSON.stringify(loanData.extendStatus) : '', // Extend Status
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'returnRequested');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Return Requested
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'returnAccepted');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Return Accepted
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'completed');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Completed
      ];
    } else if (sheetName === 'Lainnya') {
      const company = Array.isArray(loanData.company) ? loanData.company.join(', ') : (loanData.company || '');
      const needText = (loanData && loanData.needDetails && loanData.needType === 'LAINNYA') ? (loanData.needDetails.lainnya || loanData.needDetails.description || '') : (loanData.lainnya || '');
      row = [
        '', // No (manual entry in sheet)
        formatTimestamp(loanData.submittedAt), // Timestamp (DD/MMMM/YYYY)
        loanData.id || '', // No. Pengajuan
        loanData.borrowerName || '', // Nama Peminjam
        loanData.entitasId || '', // Entitas Peminjam
        loanData.borrowerPhone || '', // No Telepon Peminjam
        loanData.needType || '', // Jenis Kebutuhan
        needText, // Tuliskan Kebutuhan Peminjaman
        company, // MKT Company
        loanData.productDetailsText || '', // Rincian Product
        loanData.pickupMethod || '', // Metode Pengambilan Barang
        loanData.outDate ? new Date(loanData.outDate) : (loanData.outDate || ''), // Tanggal keluar gudang
        loanData.useDate ? new Date(loanData.useDate) : (loanData.useDate || ''), // Tanggal dipakai
        loanData.returnDate ? new Date(loanData.returnDate) : (loanData.returnDate || ''), // Tanggal dikembalikan
        loanData.note || '', // Catatan
        getMktStatus(loanData), // MKT Status
        (loanData.warehouseStatus !== undefined) ? JSON.stringify(loanData.warehouseStatus) : '', // Warehouse Status
        (loanData.extendStatus !== undefined) ? JSON.stringify(loanData.extendStatus) : '', // Extend Status
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'returnRequested');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Return Requested
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'returnAccepted');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Return Accepted
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'completed');
          return matches.length ? JSON.stringify(matches) : '';
        })(), // Completed
      ];
    } else {
      // Generic fallback: align first N fields, then JSON statuses
      const personName = loanData.borrowerName || '';
      const contact = loanData.borrowerPhone || '';
      const company = Array.isArray(loanData.company) ? loanData.company.join(', ') : (loanData.company || '');
      row = [
        '',
        formatTimestamp(loanData.submittedAt),
        loanData.id || '',
        personName,
        loanData.entitasId || '',
        contact,
        loanData.needType || '',
        loanData.borrowerName || '',
        loanData.note || '',
        '',
        '',
        company,
        loanData.productDetailsText || '',
        loanData.pickupMethod || '',
        loanData.outDate ? new Date(loanData.outDate) : (loanData.outDate || ''),
        loanData.useDate ? new Date(loanData.useDate) : (loanData.useDate || ''),
        loanData.returnDate ? new Date(loanData.returnDate) : (loanData.returnDate || ''),
        loanData.note || '',
        getMktStatus(loanData),
        (loanData.warehouseStatus !== undefined) ? JSON.stringify(loanData.warehouseStatus) : '',
        (loanData.extendStatus !== undefined) ? JSON.stringify(loanData.extendStatus) : '',
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'returnRequested');
          return matches.length ? JSON.stringify(matches) : '';
        })(),
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'returnAccepted');
          return matches.length ? JSON.stringify(matches) : '';
        })(),
        (function() {
          if (!loanData.returnRequest) return '';
          const arr = Array.isArray(loanData.returnRequest) ? loanData.returnRequest : [loanData.returnRequest];
          const matches = arr.filter(r => String(r.status) === 'completed');
          return matches.length ? JSON.stringify(matches) : '';
        })(),
      ];
    }

    // Write row to the computed row index, preserving Data-Types (dates as Date objects)
    sheet.getRange(writeRow, 1, 1, row.length).setValues([row]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Data submitted successfully', sheet: sheetName, row: writeRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error submitting to sheet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ---------- Apps Script helpers ---------- */

/**
 * Update the MKT Status column for an existing loan row identified by loanId.
 * If headers/columns are missing we create them and append a new row.
 */
function handleUpdateMktStatus(payload) {
  try {
    // Defensive: if the function is invoked directly (no args) payload may be undefined
    if (!payload || typeof payload !== 'object') {
      // Avoid alarming logs when called manually; give clear guidance instead
      const msg = 'payload is required. To test locally, run testUpdateMktStatus(). For web calls: POST { action: "updateMktStatus", loanId, mktStatus, token? }'
      try { Logger.log('handleUpdateMktStatus: %s', msg) } catch (e) { /* noop */ }
      return jsonResponse({ success: false, message: msg }, 400)
    }

    const spreadsheetId = payload.spreadsheetId || null;
    const sheetName = payload.sheetName || 'Master Request';
    const loanId = payload.loanId;
    const mktStatus = payload.mktStatus || '';

    if (!loanId) return jsonResponse({ success: false, message: 'loanId is required' }, 400);

    const ss = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
    const desiredSheet = ss.getSheetByName(sheetName);
    const allSheets = ss.getSheets();
    if (!allSheets || allSheets.length === 0) return jsonResponse({ success: false, message: 'Spreadsheet has no sheets' }, 404);

    const target = String(loanId || '').trim();

    const findAndUpdateOnSheet = (sheet) => {
      const data = sheet.getDataRange().getValues();
      if (!data || data.length === 0) return { ok: false, reason: 'empty' };

      // Locate header row: some sheets use header row = 3; search top 5 rows.
      let headerRowIndex = 0;
      const topRowsToCheck = Math.min(data.length, 5);
      for (let r = 0; r < topRowsToCheck; r++) {
        const row = data[r].map(c => String(c || '').toLowerCase());
        const hasMkt = row.some(cell => cell.includes('mkt') && cell.includes('status'));
        const hasId = row.some(cell => (cell.includes('no') && cell.includes('pengajuan')) || cell === 'id' || (cell.includes('form') && (cell.includes('number') || cell.includes('no'))));
        if (hasMkt || hasId) {
          headerRowIndex = r;
          break;
        }
      }

      const headers = data[headerRowIndex].map(h => String(h || '').trim());

      // Robust id column detection
      const idCol = headers.findIndex(h => {
        const k = String(h || '').toLowerCase();
        if (k === 'id') return true;
        if (k.includes('no') && k.includes('pengajuan')) return true;
        if (k === 'no') return true;
        if (k.includes('form') && (k.includes('number') || k.includes('no'))) return true;
        if (k.includes('form_number') || k.includes('form number')) return true;
        return false;
      });

      // MKT Status column (create header if missing on THIS sheet)
      let mktCol = headers.findIndex(h => {
        const k = String(h || '').toLowerCase();
        return k === 'mkt status' || k === 'mkt_status' || k === 'mktstatus';
      });

      if (mktCol === -1) {
        mktCol = headers.length;
        sheet.getRange(headerRowIndex + 1, mktCol + 1).setValue('MKT Status');
        headers.push('MKT Status');
      }

      // Find row by idCol if present; otherwise scan entire sheet
      let foundRow = -1;
      if (idCol !== -1) {
        for (let r = headerRowIndex + 1; r < data.length; r++) {
          const cell = String(data[r][idCol] || '').trim();
          if (cell === target) {
            foundRow = r + 1;
            break;
          }
        }
      }

      if (foundRow === -1) {
        for (let r = headerRowIndex + 1; r < data.length; r++) {
          for (let c = 0; c < data[r].length; c++) {
            const cell = String(data[r][c] || '').trim();
            if (cell === target) {
              foundRow = r + 1;
              break;
            }
          }
          if (foundRow !== -1) break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, mktCol + 1).setValue(mktStatus);
        return { ok: true, row: foundRow, mktCol: mktCol + 1 };
      }

      return { ok: false, reason: 'not_found' };
    };

    // Build try-order: desired sheet first (if exists), then all other sheets
    const sheetsToTry = [];
    if (desiredSheet) sheetsToTry.push(desiredSheet);
    allSheets.forEach(s => {
      if (!desiredSheet || s.getName() !== desiredSheet.getName()) sheetsToTry.push(s);
    });

    for (let i = 0; i < sheetsToTry.length; i++) {
      const s = sheetsToTry[i];
      const result = findAndUpdateOnSheet(s);
      if (result && result.ok) {
        try { Logger.log('handleUpdateMktStatus: updated sheet=%s row=%s col=%s loanId=%s', s.getName(), result.row, result.mktCol, target); } catch (e) {}
        return jsonResponse({ success: true, message: `Updated MKT Status for loanId ${loanId} on sheet '${s.getName()}' row ${result.row}` });
      }
    }

    // Nothing matched anywhere — do not silently write to a random sheet.
    // If the desired sheet exists, append a new row there as last resort (keeps data visible in expected tab).
    if (desiredSheet) {
      const appendAt = desiredSheet.getLastRow() + 1;
      desiredSheet.getRange(appendAt, 1).setValue(loanId);
      desiredSheet.getRange(appendAt, 2).setValue(mktStatus);
      return jsonResponse({ success: true, message: `LoanId not found on any sheet; appended to '${sheetName}' at row ${appendAt}` });
    }

    return jsonResponse({ success: false, message: `LoanId not found on any sheet, and sheet '${sheetName}' does not exist` }, 404);
  } catch (err) {
    console.error('handleUpdateMktStatus error', err);
    return jsonResponse({ success: false, message: 'Failed to update MKT Status', error: String(err) }, 500);
  }
}

function jsonResponse(obj, statusCode) {
  const payload = Object.assign({ status: statusCode || 200 }, obj);
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

// Test function (run this to test the script)
function testSubmit() {
  // IMPORTANT: Replace 'YOUR_SPREADSHEET_ID_HERE' with your actual Google Sheets ID
  // You can find the ID in the URL: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit

  const SPREADSHEET_ID = '1Nn1LxPKEUpVAsqEolMkaovioXJquRfSxINwWeCjDn2E'; // <-- GANTI DENGAN ID SPREADSHEET ANDA

  const testData = {
    id: '12345',
    submittedAt: new Date().toISOString(),
    isDraft: false,
    borrowerName: 'John Doe', // Nama peminjam
    entitasId: 'test-entity',
    borrowerPhone: '08123456789',
    needType: 'BARANG_BACKUP', // Test dengan barang backup
    company: 'Test Company',
    outDate: '2025-10-30',
    useDate: '2025-10-31',
    returnDate: '2025-11-01',
    productDetailsText: 'Laptop, Mouse, Keyboard untuk meeting',
    pickupMethod: 'WAREHOUSE_DELIVERY',
    note: 'Urgent untuk presentasi besok',
    approvalAgreementFlag: true,
    lainnya: 'Other details',
    // Data demo dari DemoSection
    demo: {
      namaCustomer: 'PT. Demo Customer',
      namaPerusahaan: 'Demo Corp',
      alamat: 'Jl. Demo No. 123, Jakarta',
      telepon: '081234567890'
    },
    // Data backup dari BackupSection
    backup: {
      namaCustomer: 'PT. Backup Customer',
      namaPerusahaan: 'Backup Corp',
      alamat: 'Jl. Backup No. 456, Jakarta',
      telepon: '081987654321',
      alasan: 'Barang utama rusak dan butuh backup segera'
    }
  };

  console.log('Testing with spreadsheet ID:', SPREADSHEET_ID);

  if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
    console.error('ERROR: Please replace YOUR_SPREADSHEET_ID_HERE with your actual Google Sheets ID!');
    console.log('How to get your Spreadsheet ID:');
    console.log('1. Open your Google Sheet');
    console.log('2. Copy the ID from the URL: https://docs.google.com/spreadsheets/d/[ID_HERE]/edit');
    return;
  }

  try {
    // Run test against the 'Barang Backup' sheet for verification
    const result = submitLoanToSheet(testData, SPREADSHEET_ID, 'Barang Backup');
    console.log('Test result:', result.getContent());
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Small helper to test updateMktStatus directly from the Apps Script editor
function testUpdateMktStatus() {
  const SPREADSHEET_ID = '1Nn1LxPKEUpVAsqEolMkaovioXJquRfSxINwWeCjDn2E'; // replace if needed
  const payload = {
    spreadsheetId: SPREADSHEET_ID,
    sheetName: 'Barang Backup',
    loanId: '12345',
    mktStatus: `Status : Disetujui, Disetujui oleh : Test User, Disetujui pada : ${new Date().toISOString()}`
  };

  const res = handleUpdateMktStatus(payload);
  try {
    Logger.log('testUpdateMktStatus result: %s', res.getContent ? res.getContent() : JSON.stringify(res));
  } catch (e) {
    console.log('testUpdateMktStatus result (no getContent):', res);
  }
}

/**
 * Update the Warehouse Status column for an existing loan row identified by loanId.
 * Robustly searches the desired sheet first, then all sheets.
 */
function handleUpdateWarehouseStatus(payload) {
  try {
    if (!payload || typeof payload !== 'object') {
      const msg = 'payload is required. For web calls: POST { action: "updateWarehouseStatus", loanId, warehouseStatus, token? }'
      try { Logger.log('handleUpdateWarehouseStatus: %s', msg) } catch (e) {}
      return jsonResponse({ success: false, message: msg }, 400)
    }

    const spreadsheetId = payload.spreadsheetId || null;
    const sheetName = payload.sheetName || 'Master Request';
    const loanId = payload.loanId;
    const warehouseStatus = payload.warehouseStatus || '';

    if (!loanId) return jsonResponse({ success: false, message: 'loanId is required' }, 400);

    const ss = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
    const desiredSheet = ss.getSheetByName(sheetName);
    const allSheets = ss.getSheets();
    if (!allSheets || allSheets.length === 0) return jsonResponse({ success: false, message: 'Spreadsheet has no sheets' }, 404);

    const target = String(loanId || '').trim();

    const findAndUpdateOnSheet = (sheet) => {
      const data = sheet.getDataRange().getValues();
      if (!data || data.length === 0) return { ok: false, reason: 'empty' };

      // Locate header row: some sheets use header row = 3; search top 5 rows.
      let headerRowIndex = 0;
      const topRowsToCheck = Math.min(data.length, 5);
      for (let r = 0; r < topRowsToCheck; r++) {
        const row = data[r].map(c => String(c || '').toLowerCase());
        const hasWarehouse = row.some(cell => cell.includes('warehouse') && cell.includes('status'));
        const hasId = row.some(cell => (cell.includes('no') && cell.includes('pengajuan')) || cell === 'id' || (cell.includes('form') && (cell.includes('number') || cell.includes('no'))));
        if (hasWarehouse || hasId) {
          headerRowIndex = r;
          break;
        }
      }

      const headers = data[headerRowIndex].map(h => String(h || '').trim());

      const idCol = headers.findIndex(h => {
        const k = String(h || '').toLowerCase();
        if (k === 'id') return true;
        if (k.includes('no') && k.includes('pengajuan')) return true;
        if (k === 'no') return true;
        if (k.includes('form') && (k.includes('number') || k.includes('no'))) return true;
        if (k.includes('form_number') || k.includes('form number')) return true;
        return false;
      });

      let whCol = headers.findIndex(h => {
        const k = String(h || '').toLowerCase();
        return k === 'warehouse status' || k === 'warehouse_status' || k === 'warehousestatus';
      });

      if (whCol === -1) {
        whCol = headers.length;
        sheet.getRange(headerRowIndex + 1, whCol + 1).setValue('Warehouse Status');
        headers.push('Warehouse Status');
      }

      let foundRow = -1;
      if (idCol !== -1) {
        for (let r = headerRowIndex + 1; r < data.length; r++) {
          const cell = String(data[r][idCol] || '').trim();
          if (cell === target) {
            foundRow = r + 1;
            break;
          }
        }
      }

      if (foundRow === -1) {
        for (let r = headerRowIndex + 1; r < data.length; r++) {
          for (let c = 0; c < data[r].length; c++) {
            const cell = String(data[r][c] || '').trim();
            if (cell === target) {
              foundRow = r + 1;
              break;
            }
          }
          if (foundRow !== -1) break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, whCol + 1).setValue(warehouseStatus);
        return { ok: true, row: foundRow, col: whCol + 1 };
      }

      return { ok: false, reason: 'not_found' };
    };

    const sheetsToTry = [];
    if (desiredSheet) sheetsToTry.push(desiredSheet);
    allSheets.forEach(s => {
      if (!desiredSheet || s.getName() !== desiredSheet.getName()) sheetsToTry.push(s);
    });

    for (let i = 0; i < sheetsToTry.length; i++) {
      const s = sheetsToTry[i];
      const result = findAndUpdateOnSheet(s);
      if (result && result.ok) {
        try { Logger.log('handleUpdateWarehouseStatus: updated sheet=%s row=%s col=%s loanId=%s', s.getName(), result.row, result.col, target); } catch (e) {}
        return jsonResponse({ success: true, message: `Updated Warehouse Status for loanId ${loanId} on sheet '${s.getName()}' row ${result.row}` });
      }
    }

    if (desiredSheet) {
      const appendAt = desiredSheet.getLastRow() + 1;
      desiredSheet.getRange(appendAt, 1).setValue(loanId);
      desiredSheet.getRange(appendAt, 2).setValue(warehouseStatus);
      return jsonResponse({ success: true, message: `LoanId not found on any sheet; appended to '${sheetName}' at row ${appendAt}` });
    }

    return jsonResponse({ success: false, message: `LoanId not found on any sheet, and sheet '${sheetName}' does not exist` }, 404);
  } catch (err) {
    console.error('handleUpdateWarehouseStatus error', err);
    return jsonResponse({ success: false, message: 'Failed to update Warehouse Status', error: String(err) }, 500);
  }
}

/**
 * Update the Extend Status column for an existing loan row identified by loanId.
 * Robustly searches the desired sheet first, then all sheets.
 */
function handleUpdateExtendStatus(payload) {
  try {
    if (!payload || typeof payload !== 'object') {
      const msg = 'payload is required. For web calls: POST { action: "updateExtendStatus", loanId, extendStatus, token? }'
      try { Logger.log('handleUpdateExtendStatus: %s', msg) } catch (e) {}
      return jsonResponse({ success: false, message: msg }, 400)
    }

    const spreadsheetId = payload.spreadsheetId || null;
    const sheetName = payload.sheetName || 'Master Request';
    const loanId = payload.loanId;
    const extendStatus = payload.extendStatus || '';

    if (!loanId) return jsonResponse({ success: false, message: 'loanId is required' }, 400);

    const ss = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
    const desiredSheet = ss.getSheetByName(sheetName);
    const allSheets = ss.getSheets();
    if (!allSheets || allSheets.length === 0) return jsonResponse({ success: false, message: 'Spreadsheet has no sheets' }, 404);

    const target = String(loanId || '').trim();

    const findAndUpdateOnSheet = (sheet) => {
      const data = sheet.getDataRange().getValues();
      if (!data || data.length === 0) return { ok: false, reason: 'empty' };

      // Locate header row: some sheets use header row = 3; search top 5 rows.
      let headerRowIndex = 0;
      const topRowsToCheck = Math.min(data.length, 5);
      for (let r = 0; r < topRowsToCheck; r++) {
        const row = data[r].map(c => String(c || '').toLowerCase());
        const hasExtend = row.some(cell => cell.includes('extend') && cell.includes('status'));
        const hasId = row.some(cell => (cell.includes('no') && cell.includes('pengajuan')) || cell === 'id' || (cell.includes('form') && (cell.includes('number') || cell.includes('no'))));
        if (hasExtend || hasId) {
          headerRowIndex = r;
          break;
        }
      }

      const headers = data[headerRowIndex].map(h => String(h || '').trim());

      const idCol = headers.findIndex(h => {
        const k = String(h || '').toLowerCase();
        if (k === 'id') return true;
        if (k.includes('no') && k.includes('pengajuan')) return true;
        if (k === 'no') return true;
        if (k.includes('form') && (k.includes('number') || k.includes('no'))) return true;
        if (k.includes('form_number') || k.includes('form number')) return true;
        return false;
      });

      let exCol = headers.findIndex(h => {
        const k = String(h || '').toLowerCase();
        return k === 'extend status' || k === 'extend_status' || k === 'extendstatus';
      });

      if (exCol === -1) {
        exCol = headers.length;
        sheet.getRange(headerRowIndex + 1, exCol + 1).setValue('Extend Status');
        headers.push('Extend Status');
      }

      let foundRow = -1;
      if (idCol !== -1) {
        for (let r = headerRowIndex + 1; r < data.length; r++) {
          const cell = String(data[r][idCol] || '').trim();
          if (cell === target) {
            foundRow = r + 1;
            break;
          }
        }
      }

      if (foundRow === -1) {
        for (let r = headerRowIndex + 1; r < data.length; r++) {
          for (let c = 0; c < data[r].length; c++) {
            const cell = String(data[r][c] || '').trim();
            if (cell === target) {
              foundRow = r + 1;
              break;
            }
          }
          if (foundRow !== -1) break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, exCol + 1).setValue(extendStatus);
        return { ok: true, row: foundRow, col: exCol + 1 };
      }

      return { ok: false, reason: 'not_found' };
    };

    const sheetsToTry = [];
    if (desiredSheet) sheetsToTry.push(desiredSheet);
    allSheets.forEach(s => {
      if (!desiredSheet || s.getName() !== desiredSheet.getName()) sheetsToTry.push(s);
    });

    for (let i = 0; i < sheetsToTry.length; i++) {
      const s = sheetsToTry[i];
      const result = findAndUpdateOnSheet(s);
      if (result && result.ok) {
        try { Logger.log('handleUpdateExtendStatus: updated sheet=%s row=%s col=%s loanId=%s', s.getName(), result.row, result.col, target); } catch (e) {}
        return jsonResponse({ success: true, message: `Updated Extend Status for loanId ${loanId} on sheet '${s.getName()}' row ${result.row}` });
      }
    }

    if (desiredSheet) {
      const appendAt = desiredSheet.getLastRow() + 1;
      desiredSheet.getRange(appendAt, 1).setValue(loanId);
      desiredSheet.getRange(appendAt, 2).setValue(extendStatus);
      return jsonResponse({ success: true, message: `LoanId not found on any sheet; appended to '${sheetName}' at row ${appendAt}` });
    }

    return jsonResponse({ success: false, message: `LoanId not found on any sheet, and sheet '${sheetName}' does not exist` }, 404);
  } catch (err) {
    console.error('handleUpdateExtendStatus error', err);
    return jsonResponse({ success: false, message: 'Failed to update Extend Status', error: String(err) }, 500);
  }
}

/**
 * Update the Return Requested column for an existing loan row identified by loanId.
 * Robustly searches the desired sheet first, then all sheets.
 */
function handleUpdateReturnRequested(payload) {
  try {
    if (!payload || typeof payload !== 'object') {
      const msg = 'payload is required. For web calls: POST { action: "updateReturnRequested", loanId, returnRequested, token? }'
      try { Logger.log('handleUpdateReturnRequested: %s', msg) } catch (e) {}
      return jsonResponse({ success: false, message: msg }, 400)
    }

    const spreadsheetId = payload.spreadsheetId || null;
    const sheetName = payload.sheetName || 'Master Request';
    const loanId = payload.loanId;
    const returnRequested = payload.returnRequested || '';

    if (!loanId) return jsonResponse({ success: false, message: 'loanId is required' }, 400);

    const ss = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
    const desiredSheet = ss.getSheetByName(sheetName);
    const allSheets = ss.getSheets();
    if (!allSheets || allSheets.length === 0) return jsonResponse({ success: false, message: 'Spreadsheet has no sheets' }, 404);

    const target = String(loanId || '').trim();

    const findAndUpdateOnSheet = (sheet) => {
      const data = sheet.getDataRange().getValues();
      if (!data || data.length === 0) return { ok: false, reason: 'empty' };

      // Locate header row: some sheets use header row = 3; search top 5 rows.
      let headerRowIndex = 0;
      const topRowsToCheck = Math.min(data.length, 5);
      for (let r = 0; r < topRowsToCheck; r++) {
        const row = data[r].map(c => String(c || '').toLowerCase());
        const hasReturnReq = row.some(cell => cell.includes('return') && cell.includes('requested'));
        const hasId = row.some(cell => (cell.includes('no') && cell.includes('pengajuan')) || cell === 'id' || (cell.includes('form') && (cell.includes('number') || cell.includes('no'))));
        if (hasReturnReq || hasId) {
          headerRowIndex = r;
          break;
        }
      }

      const headers = data[headerRowIndex].map(h => String(h || '').trim());

      const idCol = headers.findIndex(h => {
        const k = String(h || '').toLowerCase();
        if (k === 'id') return true;
        if (k.includes('no') && k.includes('pengajuan')) return true;
        if (k === 'no') return true;
        if (k.includes('form') && (k.includes('number') || k.includes('no'))) return true;
        if (k.includes('form_number') || k.includes('form number')) return true;
        return false;
      });

      let col = headers.findIndex(h => {
        const k = String(h || '').toLowerCase();
        return k === 'return requested' || k === 'return_requested' || k === 'returnrequested';
      });

      if (col === -1) {
        col = headers.length;
        sheet.getRange(headerRowIndex + 1, col + 1).setValue('Return Requested');
        headers.push('Return Requested');
      }

      let foundRow = -1;
      if (idCol !== -1) {
        for (let r = headerRowIndex + 1; r < data.length; r++) {
          const cell = String(data[r][idCol] || '').trim();
          if (cell === target) {
            foundRow = r + 1;
            break;
          }
        }
      }

      if (foundRow === -1) {
        for (let r = headerRowIndex + 1; r < data.length; r++) {
          for (let c = 0; c < data[r].length; c++) {
            const cell = String(data[r][c] || '').trim();
            if (cell === target) {
              foundRow = r + 1;
              break;
            }
          }
          if (foundRow !== -1) break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, col + 1).setValue(returnRequested);
        return { ok: true, row: foundRow, col: col + 1 };
      }

      return { ok: false, reason: 'not_found' };
    };

    const sheetsToTry = [];
    if (desiredSheet) sheetsToTry.push(desiredSheet);
    allSheets.forEach(s => {
      if (!desiredSheet || s.getName() !== desiredSheet.getName()) sheetsToTry.push(s);
    });

    for (let i = 0; i < sheetsToTry.length; i++) {
      const s = sheetsToTry[i];
      const result = findAndUpdateOnSheet(s);
      if (result && result.ok) {
        try { Logger.log('handleUpdateReturnRequested: updated sheet=%s row=%s col=%s loanId=%s', s.getName(), result.row, result.col, target); } catch (e) {}
        return jsonResponse({ success: true, message: `Updated Return Requested for loanId ${loanId} on sheet '${s.getName()}' row ${result.row}` });
      }
    }

    if (desiredSheet) {
      const appendAt = desiredSheet.getLastRow() + 1;
      desiredSheet.getRange(appendAt, 1).setValue(loanId);
      desiredSheet.getRange(appendAt, 2).setValue(returnRequested);
      return jsonResponse({ success: true, message: `LoanId not found on any sheet; appended to '${sheetName}' at row ${appendAt}` });
    }

    return jsonResponse({ success: false, message: `LoanId not found on any sheet, and sheet '${sheetName}' does not exist` }, 404);
  } catch (err) {
    console.error('handleUpdateReturnRequested error', err);
    return jsonResponse({ success: false, message: 'Failed to update Return Requested', error: String(err) }, 500);
  }
}

/**
 * Update the Return Accepted column for an existing loan row identified by loanId.
 * Robustly searches the desired sheet first, then all sheets.
 */
function handleUpdateReturnAccepted(payload) {
  try {
    if (!payload || typeof payload !== 'object') {
      const msg = 'payload is required. For web calls: POST { action: "updateReturnAccepted", loanId, returnAccepted, token? }'
      try { Logger.log('handleUpdateReturnAccepted: %s', msg) } catch (e) {}
      return jsonResponse({ success: false, message: msg }, 400)
    }

    const spreadsheetId = payload.spreadsheetId || null;
    const sheetName = payload.sheetName || 'Master Request';
    const loanId = payload.loanId;
    const returnAccepted = payload.returnAccepted || '';

    if (!loanId) return jsonResponse({ success: false, message: 'loanId is required' }, 400);

    const ss = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
    const desiredSheet = ss.getSheetByName(sheetName);
    const allSheets = ss.getSheets();
    if (!allSheets || allSheets.length === 0) return jsonResponse({ success: false, message: 'Spreadsheet has no sheets' }, 404);

    const target = String(loanId || '').trim();

    const findAndUpdateOnSheet = (sheet) => {
      const data = sheet.getDataRange().getValues();
      if (!data || data.length === 0) return { ok: false, reason: 'empty' };

      // Locate header row: some sheets use header row = 3; search top 5 rows.
      let headerRowIndex = 0;
      const topRowsToCheck = Math.min(data.length, 5);
      for (let r = 0; r < topRowsToCheck; r++) {
        const row = data[r].map(c => String(c || '').toLowerCase());
        const hasReturnAcc = row.some(cell => cell.includes('return') && cell.includes('accepted'));
        const hasId = row.some(cell => (cell.includes('no') && cell.includes('pengajuan')) || cell === 'id' || (cell.includes('form') && (cell.includes('number') || cell.includes('no'))));
        if (hasReturnAcc || hasId) {
          headerRowIndex = r;
          break;
        }
      }

      const headers = data[headerRowIndex].map(h => String(h || '').trim());

      const idCol = headers.findIndex(h => {
        const k = String(h || '').toLowerCase();
        if (k === 'id') return true;
        if (k.includes('no') && k.includes('pengajuan')) return true;
        if (k === 'no') return true;
        if (k.includes('form') && (k.includes('number') || k.includes('no'))) return true;
        if (k.includes('form_number') || k.includes('form number')) return true;
        return false;
      });

      let col = headers.findIndex(h => {
        const k = String(h || '').toLowerCase();
        return k === 'return accepted' || k === 'return_accepted' || k === 'returnaccepted';
      });

      if (col === -1) {
        col = headers.length;
        sheet.getRange(headerRowIndex + 1, col + 1).setValue('Return Accepted');
        headers.push('Return Accepted');
      }

      let foundRow = -1;
      if (idCol !== -1) {
        for (let r = headerRowIndex + 1; r < data.length; r++) {
          const cell = String(data[r][idCol] || '').trim();
          if (cell === target) {
            foundRow = r + 1;
            break;
          }
        }
      }

      if (foundRow === -1) {
        for (let r = headerRowIndex + 1; r < data.length; r++) {
          for (let c = 0; c < data[r].length; c++) {
            const cell = String(data[r][c] || '').trim();
            if (cell === target) {
              foundRow = r + 1;
              break;
            }
          }
          if (foundRow !== -1) break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, col + 1).setValue(returnAccepted);
        return { ok: true, row: foundRow, col: col + 1 };
      }

      return { ok: false, reason: 'not_found' };
    };

    const sheetsToTry = [];
    if (desiredSheet) sheetsToTry.push(desiredSheet);
    allSheets.forEach(s => {
      if (!desiredSheet || s.getName() !== desiredSheet.getName()) sheetsToTry.push(s);
    });

    for (let i = 0; i < sheetsToTry.length; i++) {
      const s = sheetsToTry[i];
      const result = findAndUpdateOnSheet(s);
      if (result && result.ok) {
        try { Logger.log('handleUpdateReturnAccepted: updated sheet=%s row=%s col=%s loanId=%s', s.getName(), result.row, result.col, target); } catch (e) {}
        return jsonResponse({ success: true, message: `Updated Return Accepted for loanId ${loanId} on sheet '${s.getName()}' row ${result.row}` });
      }
    }

    if (desiredSheet) {
      const appendAt = desiredSheet.getLastRow() + 1;
      desiredSheet.getRange(appendAt, 1).setValue(loanId);
      desiredSheet.getRange(appendAt, 2).setValue(returnAccepted);
      return jsonResponse({ success: true, message: `LoanId not found on any sheet; appended to '${sheetName}' at row ${appendAt}` });
    }

    return jsonResponse({ success: false, message: `LoanId not found on any sheet, and sheet '${sheetName}' does not exist` }, 404);
  } catch (err) {
    console.error('handleUpdateReturnAccepted error', err);
    return jsonResponse({ success: false, message: 'Failed to update Return Accepted', error: String(err) }, 500);
  }
}

/**
 * Update the Completed column for an existing loan row identified by loanId.
 * Robustly searches the desired sheet first, then all sheets.
 */
function handleUpdateCompleted(payload) {
  try {
    if (!payload || typeof payload !== 'object') {
      const msg = 'payload is required. For web calls: POST { action: "updateCompleted", loanId, completed, token? }'
      try { Logger.log('handleUpdateCompleted: %s', msg) } catch (e) {}
      return jsonResponse({ success: false, message: msg }, 400)
    }

    const spreadsheetId = payload.spreadsheetId || null;
    const sheetName = payload.sheetName || 'Master Request';
    const loanId = payload.loanId;
    const completed = payload.completed || '';

    if (!loanId) return jsonResponse({ success: false, message: 'loanId is required' }, 400);

    const ss = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
    const desiredSheet = ss.getSheetByName(sheetName);
    const allSheets = ss.getSheets();
    if (!allSheets || allSheets.length === 0) return jsonResponse({ success: false, message: 'Spreadsheet has no sheets' }, 404);

    const target = String(loanId || '').trim();

    const findAndUpdateOnSheet = (sheet) => {
      const data = sheet.getDataRange().getValues();
      if (!data || data.length === 0) return { ok: false, reason: 'empty' };

      // Locate header row: some sheets use header row = 3; search top 5 rows.
      let headerRowIndex = 0;
      const topRowsToCheck = Math.min(data.length, 5);
      for (let r = 0; r < topRowsToCheck; r++) {
        const row = data[r].map(c => String(c || '').toLowerCase());
        const hasCompleted = row.some(cell => cell === 'completed' || (cell.includes('completed')));
        const hasId = row.some(cell => (cell.includes('no') && cell.includes('pengajuan')) || cell === 'id' || (cell.includes('form') && (cell.includes('number') || cell.includes('no'))));
        if (hasCompleted || hasId) {
          headerRowIndex = r;
          break;
        }
      }

      const headers = data[headerRowIndex].map(h => String(h || '').trim());

      const idCol = headers.findIndex(h => {
        const k = String(h || '').toLowerCase();
        if (k === 'id') return true;
        if (k.includes('no') && k.includes('pengajuan')) return true;
        if (k === 'no') return true;
        if (k.includes('form') && (k.includes('number') || k.includes('no'))) return true;
        if (k.includes('form_number') || k.includes('form number')) return true;
        return false;
      });

      let col = headers.findIndex(h => {
        const k = String(h || '').toLowerCase();
        return k === 'completed';
      });

      if (col === -1) {
        col = headers.length;
        sheet.getRange(headerRowIndex + 1, col + 1).setValue('Completed');
        headers.push('Completed');
      }

      let foundRow = -1;
      if (idCol !== -1) {
        for (let r = headerRowIndex + 1; r < data.length; r++) {
          const cell = String(data[r][idCol] || '').trim();
          if (cell === target) {
            foundRow = r + 1;
            break;
          }
        }
      }

      if (foundRow === -1) {
        for (let r = headerRowIndex + 1; r < data.length; r++) {
          for (let c = 0; c < data[r].length; c++) {
            const cell = String(data[r][c] || '').trim();
            if (cell === target) {
              foundRow = r + 1;
              break;
            }
          }
          if (foundRow !== -1) break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, col + 1).setValue(completed);
        return { ok: true, row: foundRow, col: col + 1 };
      }

      return { ok: false, reason: 'not_found' };
    };

    const sheetsToTry = [];
    if (desiredSheet) sheetsToTry.push(desiredSheet);
    allSheets.forEach(s => {
      if (!desiredSheet || s.getName() !== desiredSheet.getName()) sheetsToTry.push(s);
    });

    for (let i = 0; i < sheetsToTry.length; i++) {
      const s = sheetsToTry[i];
      const result = findAndUpdateOnSheet(s);
      if (result && result.ok) {
        try { Logger.log('handleUpdateCompleted: updated sheet=%s row=%s col=%s loanId=%s', s.getName(), result.row, result.col, target); } catch (e) {}
        return jsonResponse({ success: true, message: `Updated Completed for loanId ${loanId} on sheet '${s.getName()}' row ${result.row}` });
      }
    }

    if (desiredSheet) {
      const appendAt = desiredSheet.getLastRow() + 1;
      desiredSheet.getRange(appendAt, 1).setValue(loanId);
      desiredSheet.getRange(appendAt, 2).setValue(completed);
      return jsonResponse({ success: true, message: `LoanId not found on any sheet; appended to '${sheetName}' at row ${appendAt}` });
    }

    return jsonResponse({ success: false, message: `LoanId not found on any sheet, and sheet '${sheetName}' does not exist` }, 404);
  } catch (err) {
    console.error('handleUpdateCompleted error', err);
    return jsonResponse({ success: false, message: 'Failed to update Completed', error: String(err) }, 500);
  }
}