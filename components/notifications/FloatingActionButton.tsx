import React from 'react'
import { Fab, Zoom } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'

interface FloatingActionButtonProps {
  hasRules: boolean
  onCreateRule: () => void
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ hasRules, onCreateRule }) => {
  if (!hasRules) return null

  return (
    <Zoom in={true} timeout={1500}>
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' },
          width: 60,
          height: 60,
          background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0f1419 0%, #1a365d 100%)',
          },
          boxShadow: '0 8px 24px rgba(26, 54, 93, 0.3)'
        }}
        onClick={onCreateRule}
      >
        <AddIcon />
      </Fab>
    </Zoom>
  )
}

export default FloatingActionButton