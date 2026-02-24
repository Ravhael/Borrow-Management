import React from 'react'
import { Box, Stepper, Step, StepLabel, Typography, Paper, Chip } from '@mui/material'
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material'

interface ProgressIndicatorProps {
  activeStep: number
  completedSteps: number[]
}

const steps = [
  'Informasi Peminjam',
  'Detail Kebutuhan',
  'Detail Produk',
  'Persetujuan'
]

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ activeStep, completedSteps }) => {
  const isStepCompleted = (step: number) => completedSteps.includes(step)
  const isStepActive = (step: number) => step === activeStep

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 4,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: 3,
        border: '1px solid #e2e8f0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a365d' }}>
          Progress Form
        </Typography>
        <Chip
          label={`${completedSteps.length}/${steps.length} Completed`}
          color={completedSteps.length === steps.length ? 'success' : 'primary'}
          size="small"
          sx={{ fontWeight: 500 }}
        />
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
        {steps.map((label, index) => (
          <Step key={label} completed={isStepCompleted(index)}>
            <StepLabel
              StepIconComponent={({ active, completed }) => {
                if (completed) {
                  return <CheckCircle sx={{ color: '#00d4aa', fontSize: 28 }} />
                }
                if (active) {
                  return <Box sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: '#1a365d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 600
                  }}>
                    {index + 1}
                  </Box>
                }
                return <RadioButtonUnchecked sx={{ color: '#cbd5e0', fontSize: 28 }} />
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isStepActive(index) ? 600 : 500,
                  color: isStepActive(index) ? '#1a365d' : '#64748b',
                  mt: 1
                }}
              >
                {label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography
          variant="body2"
          sx={{
            color: '#64748b',
            textAlign: 'center',
            maxWidth: '400px'
          }}
        >
          Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
        </Typography>
      </Box>
    </Paper>
  )
}

export default ProgressIndicator