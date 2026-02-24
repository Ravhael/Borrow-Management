import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Container,
  Chip,
  Stack,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import BusinessIcon from '@mui/icons-material/Business';
import Link from 'next/link';
import { HomepageNavigationProps } from '../../types/homepage';

const HomepageNavigation: React.FC<HomepageNavigationProps> = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuItems = [
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        zIndex: theme.zIndex.appBar,
        transition: 'all 0.3s ease',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Logo Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(26, 54, 93, 0.15)',
              }}
            >
              <BusinessIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                cursor: 'pointer',
                fontSize: '1.5rem',
                letterSpacing: '-0.02em',
              }}
            >
              FormFlow
            </Typography>
          </Box>

          {isMobile ? (
            <>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={handleMenu}
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: 'rgba(26, 54, 93, 0.08)',
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    border: `1px solid ${theme.palette.divider}`,
                  },
                }}
              >
                {menuItems.map((item) => (
                  <MenuItem
                    key={item.label}
                    onClick={handleClose}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(26, 54, 93, 0.04)',
                      },
                    }}
                  >
                    <Link href={item.href} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                      <Typography sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>
                        {item.label}
                      </Typography>
                    </Link>
                  </MenuItem>
                ))}
                <MenuItem
                  onClick={handleClose}
                  sx={{
                    borderTop: `1px solid ${theme.palette.divider}`,
                    mt: 1,
                    pt: 2,
                  }}
                >
                  <Link href="/login" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark,
                        },
                      }}
                    >
                      Sign In
                    </Button>
                  </Link>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Trust Badge */}
              <Chip
                label="Enterprise Ready"
                size="small"
                sx={{
                  backgroundColor: 'rgba(0, 212, 170, 0.1)',
                  color: theme.palette.secondary.main,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: `1px solid ${theme.palette.secondary.main}20`,
                }}
              />

              {/* Navigation Links */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {menuItems.map((item) => (
                  <Link key={item.label} href={item.href} passHref style={{ textDecoration: 'none' }}>
                    <Button
                      color="inherit"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(26, 54, 93, 0.08)',
                          color: theme.palette.primary.main,
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </Box>

              {/* CTA Button */}
              <Link href="/login" passHref style={{ textDecoration: 'none' }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(26, 54, 93, 0.15)',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 20px rgba(26, 54, 93, 0.2)',
                    },
                    transition: 'all 0.3s ease',
                    textTransform: 'none',
                  }}
                >
                  Sign In
                </Button>
              </Link>
            </Stack>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default HomepageNavigation;