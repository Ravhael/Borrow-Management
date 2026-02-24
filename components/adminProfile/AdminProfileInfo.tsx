import React from 'react';
import Image from 'next/image';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { AdminProfileData } from '../../types/adminProfile';

interface AdminProfileInfoProps {
  profile: AdminProfileData;
  isEditing: boolean;
  onProfileUpdate: (field: string, value: string) => void;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const AdminProfileInfo: React.FC<AdminProfileInfoProps> = ({
  profile,
  isEditing,
  onProfileUpdate,
  onEditToggle,
  onSave,
  onCancel,
}) => {
  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" component="h2" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
            Profile Information
          </Typography>
          <Button
            variant={isEditing ? "outlined" : "contained"}
            startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
            onClick={onEditToggle}
            sx={{ borderRadius: 2 }}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </Box>

        <Box display="flex" gap={4} alignItems="flex-start">
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Avatar
              sx={{ width: 120, height: 120, bgcolor: 'primary.main', fontSize: '2.5rem', fontWeight: 600, position: 'relative' }}
            >
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt="Profile"
                  fill
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              ) : (
                profile.name.split(' ').map(n => n[0]).join('').toUpperCase()
              )}
            </Avatar>
            {isEditing && (
              <Tooltip title="Change Photo">
                <IconButton color="primary" sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main' } }}>
                  <PhotoCameraIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box flex={1}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profile.name}
                  onChange={(e) => onProfileUpdate('name', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  sx={{ mb: 2 }}
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
                  sx={{ mb: 2 }}
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
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Role"
                  value={profile.role}
                  disabled
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Department"
                  value={profile.department}
                  disabled
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Join Date"
                  value={new Date(profile.joinDate).toLocaleDateString('id-ID')}
                  disabled
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Last Login"
                  value={new Date(profile.lastLogin).toLocaleString('id-ID')}
                  disabled
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        </Box>

        {isEditing && (
          <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
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
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminProfileInfo;