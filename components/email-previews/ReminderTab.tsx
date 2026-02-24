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

interface ReminderTabProps {
  hasLoan: boolean
  reminderHtml: string
}

export default function ReminderTab({ hasLoan, reminderHtml }: ReminderTabProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
      {!hasLoan && (
        <Alert severity="warning" sx={{ borderRadius: 1 }}>
          Tidak ada data peminjaman yang bisa dipreview. Gunakan aplikasi untuk membuat data terlebih dahulu.
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Entitas &amp; Company Email
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Notifikasi ini mengingatkan bahwa peminjaman sudah mendekati tanggal pengembalian. Sistem akan mengirim otomatis pada H-7, H-3, H-1, dan hari H, dan admin dapat memicu ulang secara manual melalui halaman <code>/admin/reminders</code>.
        </Typography>
        <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          <div dangerouslySetInnerHTML={{ __html: reminderHtml }} />
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
              {reminderHtml}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  )
}
