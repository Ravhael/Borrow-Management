import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from '@mui/material';

import {
  Warehouse as WarehouseIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { GudangProfileData } from '../../types/gudangProfile';

interface GudangProfileInfoProps {
  profile: GudangProfileData;
  isEditing: boolean;
  onProfileUpdate: (field: string, value: string) => void;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const GudangProfileInfo: React.FC<GudangProfileInfoProps> = ({
  profile,
  isEditing,
  onProfileUpdate,
  onEditToggle,
  onSave,
  onCancel,
}) => {
  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-start" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={{ xs: 2, sm: 3 }} gap={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <WarehouseIcon color="primary" sx={{ fontSize: { xs: 24, sm: 32 } }} />
            <Typography variant="h5" component="h2" fontWeight={600} fontSize={{ xs: '1.1rem', sm: '1.25rem' }}>
              Professional Information
            </Typography>
          </Box>
        </Box>

        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={{ xs: 2, sm: 4 }} alignItems={{ xs: 'center', sm: 'flex-start' }}>
          <Avatar
            sx={{ width: { xs: 64, sm: 100, md: 120 }, height: { xs: 64, sm: 100, md: 120 }, bgcolor: 'primary.main', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, fontWeight: 600 }}
          >
            {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Avatar>

          <Box flex={1} width="100%">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: { xs: 2, sm: 3 } }}>
              <Box>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profile.name}
                  onChange={(e) => onProfileUpdate('name', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={profile.email}
                  onChange={(e) => onProfileUpdate('email', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Phone Number"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => onProfileUpdate('phone', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Position"
                  value={profile.position}
                  onChange={(e) => onProfileUpdate('position', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Department"
                  value={profile.department}
                  disabled
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Employee ID"
                  value={profile.employeeId}
                  disabled
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Manager"
                  value={profile.manager}
                  disabled
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Location"
                  value={profile.location}
                  disabled
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Join Date"
                  value={new Date(profile.joinDate).toLocaleDateString('id-ID')}
                  disabled
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Edit Profile button moved to bottom */}
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} justifyContent="flex-end" mt={4}>
          {!isEditing && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={onEditToggle}
              sx={{ borderRadius: 2, width: { xs: '100%', sm: 'auto' }, fontSize: { xs: '0.85rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}
            >
              Edit Profile
            </Button>
          )}
          {isEditing && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={onSave}
                sx={{ borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancel}
                sx={{ borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default GudangProfileInfo;