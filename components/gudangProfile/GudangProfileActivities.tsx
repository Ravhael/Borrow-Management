import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { Timeline as TimelineIcon } from '@mui/icons-material';
import { GudangActivityItem } from '../../types/gudangProfile';

interface GudangProfileActivitiesProps {
  activities: GudangActivityItem[];
}

const GudangProfileActivities: React.FC<GudangProfileActivitiesProps> = ({ activities }) => {
  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'Stock Entry': return '📥';
      case 'Stock Out': return '📤';
      case 'Inventory Check': return '🔍';
      case 'Low Stock Alert': return '⚠️';
      default: return '📋';
    }
  };

  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <TimelineIcon color="primary" />
          <Typography variant="h5" component="h2" fontWeight={600}>
            Recent Activities
          </Typography>
        </Box>

        <List>
          {activities.map((activity) => (
            <ListItem key={activity.id} divider sx={{ px: 0 }}>
              <ListItemIcon>
                <Typography variant="h5">{getActivityTypeIcon(activity.type)}</Typography>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body1" fontWeight={500}>
                      {activity.type}
                    </Typography>
                    <Chip
                      label={activity.status}
                      color={getActivityStatusColor(activity.status)}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {activity.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.timestamp}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default GudangProfileActivities;