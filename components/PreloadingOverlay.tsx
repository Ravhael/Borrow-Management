import React from 'react';
import { Box, Fade, CircularProgress } from '@mui/material';

interface PreloadingOverlayProps {
  open: boolean;
  text?: string;
}

const PreloadingOverlay: React.FC<PreloadingOverlayProps> = ({ open, text }) => (
  <Fade in={open} unmountOnExit>
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        bgcolor: 'rgba(255,255,255,0.7)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress color="primary" size={48} thickness={4} />
      {text && (
        <Box mt={2} color="primary.main" fontWeight={600} fontSize={18}>{text}</Box>
      )}
    </Box>
  </Fade>
);

export default PreloadingOverlay;
