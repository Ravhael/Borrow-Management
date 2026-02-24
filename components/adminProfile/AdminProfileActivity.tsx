import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Paper,
  Typography,
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { AdminActivityItem } from '../../types/adminProfile';

interface AdminProfileActivityProps {
  activityItems: AdminActivityItem[];
}

const AdminProfileActivity: React.FC<AdminProfileActivityProps> = ({ activityItems }) => {
  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <HistoryIcon color="primary" />
          <Typography variant="h6" component="h2" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
            Recent Activity
          </Typography>
        </Box>

        <Box display="flex" flexDirection="column" gap={2}>
          {activityItems.map((activity, index) => (
            <Paper key={index} elevation={1} sx={{ p: 2, borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6">{activity.icon}</Typography>
                <Box flex={1}>
                  <Typography variant="body1" fontWeight={500} sx={{ fontSize: '0.9rem' }}>
                    {activity.action}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {activity.time}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AdminProfileActivity;