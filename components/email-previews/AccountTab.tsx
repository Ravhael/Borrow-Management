import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'

interface AccountTabProps {
  passwordResetHtml: string
  accountCreationHtml: string
  accountApprovalHtml: string
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

export default function AccountTab(props: AccountTabProps) {
  const {
    passwordResetHtml,
    accountCreationHtml,
    accountApprovalHtml,
  } = props

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <HtmlPreview title="Password Reset Email" html={passwordResetHtml} />
      <HtmlPreview title="Account Creation Email" html={accountCreationHtml} />
      <HtmlPreview title="Account Approval Email" html={accountApprovalHtml} />
    </Box>
  )
}
