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

interface WhSubmitRejectTabProps {
  hasLoan: boolean
  companyHtml: string
  entitasHtml: string
  borrowerHtml: string
}

function HtmlPreview({ title, html }: { title: string; html: string }) {
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
            sx={{
              whiteSpace: 'pre-wrap',
              maxHeight: 300,
              overflow: 'auto',
              fontSize: '0.875rem',
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
            }}
          >
            {html}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  )
}

export default function WhSubmitRejectTab({
  hasLoan,
  companyHtml,
  entitasHtml,
  borrowerHtml,
}: WhSubmitRejectTabProps) {
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Alert severity={hasLoan ? 'info' : 'warning'} sx={{ borderRadius: 1 }}>
          {hasLoan
            ? 'Preview email penolakan submit dari Warehouse untuk setiap audiens.'
            : 'Tidak ada pengajuan gudang yang bisa dipreview. Gunakan aplikasi untuk membuat data terlebih dahulu.'}
        </Alert>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <HtmlPreview title="Company Email (WH Submit Reject)" html={companyHtml} />
        <HtmlPreview title="Entitas Email (WH Submit Reject)" html={entitasHtml} />
        <HtmlPreview title="Borrower Email (WH Submit Reject)" html={borrowerHtml} />
      </Box>
    </>
  )
}
