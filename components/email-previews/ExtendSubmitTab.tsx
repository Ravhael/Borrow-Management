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

interface ExtendSubmitTabProps {
  raw: any
  extendSubmitMarketingHtml: string
  extendSubmitAdminHtml: string
  extendSubmitBorrowerHtml: string
  extendSubmitEntitasHtml: string
}

function HtmlPreview({ title, html }: { title: string; html: string }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        {title === 'Marketing Email (Extend Submit)'
          ? 'Menampilkan versi UPDATE yang diterima Marketing (Admin/Owner) untuk permintaan perpanjangan.'
          : title === 'Admin Email (Extend Submit)'
            ? 'Salinan Admin Marketing yang dipakai ketika extend submit dikirim.'
            : title === 'Borrower Email (Extend Submit)'
              ? 'Notifikasi yang dikirim ke peminjam saat permintaan perpanjangan dibuat.'
              : 'Salinan yang diterima Entitas terkait sebagai informasi extend submit.'}
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

export default function ExtendSubmitTab({
  raw,
  extendSubmitMarketingHtml,
  extendSubmitAdminHtml,
  extendSubmitBorrowerHtml,
  extendSubmitEntitasHtml,
}: ExtendSubmitTabProps) {
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Alert severity={raw ? 'info' : 'warning'} sx={{ borderRadius: 1 }}>
          {raw
            ? 'Preview extend submit menggunakan template UPDATE yang dikirim saat permintaan perpanjangan dibuat.'
            : 'Tidak ada data peminjaman yang bisa dipreview. Gunakan aplikasi untuk membuat data terlebih dahulu.'}
        </Alert>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <HtmlPreview title="Marketing Email (Extend Submit)" html={extendSubmitMarketingHtml} />
        <HtmlPreview title="Admin Email (Extend Submit)" html={extendSubmitAdminHtml} />
        <HtmlPreview title="Borrower Email (Extend Submit)" html={extendSubmitBorrowerHtml} />
        <HtmlPreview title="Entitas Email (Extend Submit)" html={extendSubmitEntitasHtml} />
      </Box>
    </>
  )
}
