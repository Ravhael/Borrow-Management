import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  Campaign as CampaignIcon,
  TrendingUp as TrendingUpIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { RecentActivitiesProps } from '../../types/marketingDashboard';

const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead_generated':
        return <PeopleIcon color="primary" />;
      case 'campaign_created':
        return <CampaignIcon color="secondary" />;
      case 'conversion':
        return <TrendingUpIcon color="success" />;
      case 'email_sent':
        return <EmailIcon color="info" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <NotificationsIcon />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Recent Activities</Typography>
        </Stack>

        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Activity</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No recent activities found.
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => (
                  <TableRow key={activity.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        {getActivityIcon(activity.type)}
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {activity.type.replace('_', ' ')}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {activity.description}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {formatCurrency(activity.amount)}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {formatDate(activity.date)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                        color={getStatusColor(activity.status) as any}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default RecentActivities;