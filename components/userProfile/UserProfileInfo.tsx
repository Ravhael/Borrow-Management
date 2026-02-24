import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Button,
  Avatar,
  TextField,
  Chip,
  Grid,
  Typography,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { UserProfileInfoProps } from '../../types/userProfile';

const UserProfileInfo: React.FC<UserProfileInfoProps> = ({
  currentUser,
  formData,
  isEditing,
  isLoading,
  onInputChange,
  onSave,
  onCancel,
  onEditToggle,
}) => {
  return (
    <Grid size={{ xs: 12 }}>
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={{ xs: 1, sm: 2 }}
            mb={2}
          >
            <PersonIcon color="primary" sx={{ fontSize: { xs: 24, sm: 32 } }} />
            <Typography
              variant="h6"
              component="h2"
              fontWeight={600}
              color="text.primary"
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}
            >
              Personal Information
            </Typography>
          </Box>

          <Box display="flex" gap={{ xs: 2, sm: 3, md: 4 }} alignItems="flex-start" flexDirection={{ xs: 'column', sm: 'row' }}>
            <Avatar
              sx={{
                width: { xs: 64, sm: 90, md: 120 },
                height: { xs: 64, sm: 90, md: 120 },
                bgcolor: 'primary.main',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                fontWeight: 600,
                mb: { xs: 1, sm: 0 },
              }}
            >
              {formData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Avatar>

            <Box flex={1}>
              <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => onInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => onInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={formData.username}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={(formData as any).phone ?? ''}
                    onChange={(e) => onInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Role"
                    value={formData.role}
                    disabled
                    variant="outlined"
                  />
                </Grid>
                {currentUser?.directorate && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Directorate"
                      value={(currentUser as any).directorate ?? ''}
                      disabled
                      variant="outlined"
                    />
                  </Grid>
                )}
                {(currentUser?.entitas || formData.entitasId) && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Entitas"
                      value={(currentUser as any).entitas ?? formData.entitasId ?? ''}
                      disabled
                      variant="outlined"
                    />
                  </Grid>
                )}
                {formData.companyId && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Company"
                      value={formData.companyId}
                      disabled
                      variant="outlined"
                    />
                  </Grid>
                )}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Account Status"
                    value={formData.isActive ? 'Active' : 'Inactive'}
                    disabled
                    variant="outlined"
                    InputProps={{
                      endAdornment: (
                        <Chip
                          label={formData.isActive ? 'Active' : 'Inactive'}
                          color={formData.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* Tombol Edit/Cancel (saat tidak editing) dan Save/Cancel (saat editing) di bawah */}
          <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={onSave}
                  disabled={isLoading}
                  sx={{ borderRadius: 2 }}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={onCancel}
                  disabled={isLoading}
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
                Edit
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default UserProfileInfo;