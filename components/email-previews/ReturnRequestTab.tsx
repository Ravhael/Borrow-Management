import React from 'react'
import {
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Paper,
  Typography,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'

interface HtmlPreviewProps {
  title: string
  html: string
}

interface ReturnRequestTabProps {
  hasLoan: boolean
  hasReturnRequest: boolean
  borrowerHtml: string
  companyHtml: string
  entitasHtml: string
  warehouseHtml: string
}

function HtmlPreview({ title, html }: HtmlPreviewProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </Box>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Raw HTML</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            component="pre"
            sx={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', fontSize: '0.875rem', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}
          >
            {html}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  )
}

export default function ReturnRequestTab(props: ReturnRequestTabProps) {
  const { hasLoan, hasReturnRequest, borrowerHtml, companyHtml, entitasHtml, warehouseHtml } = props

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
      {!hasLoan && (
        <Alert severity="warning" sx={{ borderRadius: 1 }}>
          Tidak ada data peminjaman yang bisa dipreview. Gunakan aplikasi untuk membuat data terlebih dahulu.
        </Alert>
      )}

      {hasLoan && !hasReturnRequest && (
        <Alert severity="info" sx={{ borderRadius: 1 }}>
          Loan ini belum memiliki permintaan pengembalian. Preview berikut menggunakan data default agar desain email tetap bisa dicek.
        </Alert>
      )}

      <HtmlPreview title="Borrower Email (Return Request)" html={borrowerHtml} />
      <HtmlPreview title="Company Email (Return Request)" html={companyHtml} />
      <HtmlPreview title="Entitas Email (Return Request)" html={entitasHtml} />
      <HtmlPreview title="Warehouse Email (Return Request)" html={warehouseHtml} />
    </Box>
  )
}
