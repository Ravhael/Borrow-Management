import React from 'react'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Paper,
  Typography,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'

interface ApprovedTabProps {
  entitasApprovedHtml: string
  marketingApprovedHtml: string
  borrowerApprovedHtml: string
  warehouseApprovedHtml: string
}

function HtmlSection({ title, html }: { title: string; html: string }) {
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

export default function ApprovedTab(props: ApprovedTabProps) {
  const { entitasApprovedHtml, marketingApprovedHtml, borrowerApprovedHtml, warehouseApprovedHtml } = props

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
      <HtmlSection title="Entitas Email (Approved)" html={entitasApprovedHtml} />
      <HtmlSection title="Marketing Email (Approved)" html={marketingApprovedHtml} />
      <HtmlSection title="Borrower Email" html={borrowerApprovedHtml} />
      <HtmlSection title="Warehouse Email (Approved)" html={warehouseApprovedHtml} />
    </Box>
  )
}
