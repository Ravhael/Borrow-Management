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
  description: string
  html: string
}

interface ReminderBeforeTabProps {
  hasLoan: boolean
  borrowerHtml: string
  companyHtml: string
  entitasHtml: string
}

function HtmlPreview({ title, description, html }: HtmlPreviewProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        {description}
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

export default function ReminderBeforeTab(props: ReminderBeforeTabProps) {
  const { hasLoan, borrowerHtml, companyHtml, entitasHtml } = props

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
      {!hasLoan && (
        <Alert severity="warning" sx={{ borderRadius: 1 }}>
          Tidak ada data peminjaman yang bisa dipreview. Gunakan aplikasi untuk membuat data terlebih dahulu.
        </Alert>
      )}

      <HtmlPreview
        title="Borrower Email (Reminder H-)"
        description="Pengingat otomatis sebelum jatuh tempo akan dikirim ke borrower pada H-7, H-3, H-1, dan hari H."
        html={borrowerHtml}
      />
      <HtmlPreview
        title="Company Email (Reminder H-)"
        description="Copy untuk admin/company agar memastikan barang dikembalikan sesuai jadwal."
        html={companyHtml}
      />
      <HtmlPreview
        title="Entitas Email (Reminder H-)"
        description="Salinan untuk entitas terkait agar koordinasi pengembalian berjalan lancar."
        html={entitasHtml}
      />
    </Box>
  )
}
