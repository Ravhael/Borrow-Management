import React from 'react'
import { Box, Button, Typography } from '@mui/material'
import { ArrowBack, Save, Send } from '@mui/icons-material'

interface ActionButtonsProps {
  activeStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  onSave: () => void
  onSubmit: () => void
  isSubmitting: boolean
  canProceed: boolean
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  activeStep,
  totalSteps,
  onPrevious,
  onNext,
  onSave,
  onSubmit,
  isSubmitting,
  canProceed
}) => {
  const isFirstStep = activeStep === 0
  const isLastStep = activeStep === totalSteps - 1

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 4,
        p: 3,
        backgroundColor: '#f8fafc',
        borderRadius: 2,
        border: '1px solid #e2e8f0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {!isFirstStep && (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onPrevious}
            sx={{
              borderColor: '#cbd5e0',
              color: '#64748b',
              '&:hover': {
                borderColor: '#a0aec0',
                backgroundColor: '#f7fafc',
              }
            }}
          >
            Previous
          </Button>
        )}

        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Step {activeStep + 1} of {totalSteps}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Save />}
          onClick={onSave}
          sx={{
            borderColor: '#00d4aa',
            color: '#00d4aa',
            '&:hover': {
              borderColor: '#00b894',
              backgroundColor: 'rgba(0, 212, 170, 0.04)',
            }
          }}
        >
          Save Draft
        </Button>

        {!isLastStep ? (
          <Button
            variant="contained"
            onClick={onNext}
            disabled={!canProceed}
            sx={{
              backgroundColor: '#1a365d',
              '&:hover': {
                backgroundColor: '#2d3748',
              },
              '&:disabled': {
                backgroundColor: '#cbd5e0',
              }
            }}
          >
            Next Step
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={onSubmit}
            disabled={isSubmitting || !canProceed}
            sx={{
              backgroundColor: '#00d4aa',
              '&:hover': {
                backgroundColor: '#00b894',
              },
              '&:disabled': {
                backgroundColor: '#cbd5e0',
              }
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default ActionButtons