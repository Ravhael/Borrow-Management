import React, { ReactNode } from 'react';
import { Box, Paper, Typography, Zoom } from '@mui/material';

const DEFAULT_NUMBER_FORMATTER = new Intl.NumberFormat('id-ID');

export interface StatHighlightCardProps {
  label: string;
  caption: string;
  value?: number;
  icon?: ReactNode;
  accentColor?: string;
  delay?: number;
  formatter?: (value: number) => string;
}

const StatHighlightCard: React.FC<StatHighlightCardProps> = ({
  label,
  caption,
  value = 0,
  icon,
  accentColor = '#ffffff',
  delay = 0,
  formatter,
}) => {
  const displayValue = formatter ? formatter(value) : DEFAULT_NUMBER_FORMATTER.format(value);

  return (
    <Zoom in timeout={600} style={{ transitionDelay: `${delay}ms` }}>
      <Paper
        sx={{
          p: { xs: 0.8, sm: 1.2 },
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 1,
          textAlign: 'center',
        }}
      >
        <Box sx={{ color: accentColor, mb: 0.6, fontSize: { xs: 16, md: 18 } }}>
          {icon}
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: 'white',
            mb: 0.3,
            fontSize: { xs: '1rem', md: '1.2rem' },
            lineHeight: 1.15,
          }}
        >
          {displayValue}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: 'white',
            mb: 0.3,
            fontSize: { xs: '0.7rem', md: '0.78rem' },
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: { xs: '0.6rem', md: '0.68rem' },
          }}
        >
          {caption}
        </Typography>
      </Paper>
    </Zoom>
  );
};

export default StatHighlightCard;
