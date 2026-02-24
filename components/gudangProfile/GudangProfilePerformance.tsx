import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { GudangPerformance } from '../../types/gudangProfile';

interface GudangProfilePerformanceProps {
  performance: GudangPerformance;
}

const GudangProfilePerformance: React.FC<GudangProfilePerformanceProps> = ({ performance }) => {
  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <TrendingUpIcon color="primary" />
          <Typography variant="h5" component="h2" fontWeight={600}>
            Performance Metrics
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight={600}>
                {performance.itemsManaged.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Items Managed
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight={600}>
                {performance.transactionsHandled.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Transactions Handled
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight={600}>
                {formatPercentage(performance.accuracyRate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accuracy Rate
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight={600}>
                {performance.efficiencyScore}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Efficiency Score
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight={600}>
                {performance.awards}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Awards Won
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight={600}>
                {performance.certifications.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Certifications
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Certifications
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {performance.certifications.map((cert, index) => (
              <Chip key={index} label={cert} variant="outlined" color="primary" />
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GudangProfilePerformance;