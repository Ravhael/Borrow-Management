import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { AdminSecuritySettings } from '../../types/adminProfile';

interface AdminProfileSecurityProps {
  securitySettings: AdminSecuritySettings;
  onSecurityUpdate: (field: string, value: any) => void;
  onPasswordChange: () => void;
}

const AdminProfileSecurity: React.FC<AdminProfileSecurityProps> = ({
  securitySettings,
  onSecurityUpdate,
  onPasswordChange,
}) => {
  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <SecurityIcon color="primary" />
          <Typography variant="h6" component="h2" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
            Security Settings
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
                Two-Factor Authentication
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontSize: '0.8rem' }}>
                Add an extra layer of security to your account
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onChange={(e) => onSecurityUpdate('twoFactorEnabled', e.target.checked)}
                    color="primary"
                  />
                }
                label={securitySettings.twoFactorEnabled ? "Enabled" : "Disabled"}
              />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
                Login Alerts
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontSize: '0.8rem' }}>
                Get notified of new login attempts
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.loginAlerts}
                    onChange={(e) => onSecurityUpdate('loginAlerts', e.target.checked)}
                    color="primary"
                  />
                }
                label={securitySettings.loginAlerts ? "Enabled" : "Disabled"}
              />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
                Session Timeout
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontSize: '0.8rem' }}>
                Automatically log out after period of inactivity
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Timeout (minutes)</InputLabel>
                <Select
                  value={securitySettings.sessionTimeout}
                  label="Timeout (minutes)"
                  onChange={(e) => onSecurityUpdate('sessionTimeout', e.target.value)}
                >
                  <MenuItem value="15">15 minutes</MenuItem>
                  <MenuItem value="30">30 minutes</MenuItem>
                  <MenuItem value="60">1 hour</MenuItem>
                  <MenuItem value="120">2 hours</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
                Password
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontSize: '0.8rem' }}>
                Last changed: January 1, 2024
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={onPasswordChange}
                sx={{ borderRadius: 2 }}
              >
                Change Password
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AdminProfileSecurity;