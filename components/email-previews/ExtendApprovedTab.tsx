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

interface DecisionSummary {
  severity: 'success' | 'info' | 'warning' | 'error'
  message: string
}

interface ExtendApprovedTabProps {
  summary: DecisionSummary
  extendApprovedBorrowerHtml: string
  extendApprovedCompanyHtml: string
  extendApprovedEntitasHtml: string
}

function HtmlPreview({ title, description, html }: { title: string; description: string; html: string }) {
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

export default function ExtendApprovedTab({
  summary,
  extendApprovedBorrowerHtml,
  extendApprovedCompanyHtml,
  extendApprovedEntitasHtml,
}: ExtendApprovedTabProps) {
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Alert severity={summary.severity} sx={{ borderRadius: 1 }}>
          {summary.message}
        </Alert>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <HtmlPreview
          title="Borrower Email (Extend Approved)"
          description="Dikirim ke peminjam setelah Marketing menyetujui permintaan perpanjangan."
          html={extendApprovedBorrowerHtml}
        />
        <HtmlPreview
          title="Company/Admin Email (Extend Approved)"
          description="Salinan internal untuk Admin/Company guna mencatat keputusan perpanjangan."
          html={extendApprovedCompanyHtml}
        />
        <HtmlPreview
          title="Entitas Email (Extend Approved)"
          description="Notifikasi untuk Entitas agar mengetahui jadwal terbaru setelah perpanjangan disetujui."
          html={extendApprovedEntitasHtml}
        />
      </Box>
    </>
  )
}
