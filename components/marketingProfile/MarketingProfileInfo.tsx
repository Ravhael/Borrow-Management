import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Button,
  Avatar,
  TextField,
  Grid,
  Typography,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { MarketingProfileInfoProps } from '../../types/marketingProfile';

const MarketingProfileInfo: React.FC<MarketingProfileInfoProps> = ({
  profile,
  isEditing,
  onProfileUpdate,
  onSave,
  onCancel,
  onEditToggle,
}) => {
  return (
    <Grid size={{ xs: 12 }}>
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }} mb={{ xs: 2, sm: 3 }}>
            <BusinessIcon color="primary" sx={{ fontSize: { xs: 24, sm: 32 } }} />
            <Typography variant="h6" component="h2" fontWeight={600} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}>
              Professional Information
            </Typography>
          </Box>

          <Box display="flex" gap={{ xs: 2, sm: 3, md: 4 }} alignItems="flex-start" flexDirection={{ xs: 'column', sm: 'row' }}>
            <Avatar
              sx={{ width: { xs: 64, sm: 90, md: 120 }, height: { xs: 64, sm: 90, md: 120 }, bgcolor: 'primary.main', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, fontWeight: 600, mb: { xs: 1, sm: 0 } }}
            >
              {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Avatar>

            <Box flex={1}>
              <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={profile.name}
                    onChange={(e) => onProfileUpdate('name', e.target.value)}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={profile.email}
                    onChange={(e) => onProfileUpdate('email', e.target.value)}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => onProfileUpdate('phone', e.target.value)}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Position"
                    value={profile.position}
                    onChange={(e) => onProfileUpdate('position', e.target.value)}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={profile.department}
                    disabled
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                      fullWidth
                      label="Username"
                      value={profile.employeeId}
                      disabled
                      variant="outlined"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Entitas"
                    value={profile.manager}
                    disabled
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={profile.location}
                    disabled
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Join Date"
                    value={(() => {
                      try {
                        if (!profile.joinDate) return '';
                        const d = new Date(profile.joinDate);
                        if (Number.isNaN(d.getTime())) return '';
                        return d.toLocaleDateString('id-ID');
                      } catch {
                        return '';
                      }
                    })()}
                    disabled
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>

          <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={onSave}
                  sx={{ borderRadius: 2 }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={onCancel}
                  sx={{ borderRadius: 2 }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={onEditToggle}
                sx={{ borderRadius: 2 }}
              >
                Edit Profile
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default MarketingProfileInfo;