import React from 'react'
import Link from 'next/link'
import { Fab, Zoom } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'

const FloatingActionButton: React.FC = () => {
  return (
    <Zoom in={true} timeout={2200}>
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 64,
          height: 64,
          boxShadow: '0px 8px 32px rgba(21, 101, 192, 0.4)',
        }}
        component={Link}
        href="/form"
      >
        <AddIcon sx={{ fontSize: '1.75rem' }} />
      </Fab>
    </Zoom>
  )
}

export default FloatingActionButton