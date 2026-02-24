import React from 'react'
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Paper,
  Typography,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'

interface HtmlPreviewProps {
  title: string
  html: string
}

interface CompletedTabProps {
  hasLoan: boolean
  hasCompletedStatus: boolean
  borrowerHtml: string
  companyHtml: string
  entitasHtml: string
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

export default function CompletedTab(props: CompletedTabProps) {
  const { hasLoan, hasCompletedStatus, borrowerHtml, companyHtml, entitasHtml } = props

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
      {!hasLoan && (
        <Alert severity="warning" sx={{ borderRadius: 1 }}>
          Tidak ada data peminjaman yang bisa dipreview. Gunakan aplikasi untuk membuat data terlebih dahulu.
        </Alert>
      )}

      {hasLoan && !hasCompletedStatus && (
        <Alert severity="info" sx={{ borderRadius: 1 }}>
          Loan ini belum diproses selesai. Preview berikut menggunakan data default agar desain email tetap bisa dicek.
        </Alert>
      )}

      <HtmlPreview title="Borrower Email (Completed)" html={borrowerHtml} />
      <HtmlPreview title="Company Email (Completed)" html={companyHtml} />
      <HtmlPreview title="Entitas Email (Completed)" html={entitasHtml} />
    </Box>
  )
}
