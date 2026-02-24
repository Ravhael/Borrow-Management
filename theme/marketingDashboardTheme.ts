import { createTheme } from '@mui/material/styles';

const marketingDashboardTheme = createTheme({
  palette: {
    primary: {
      main: '#1a365d',
      light: '#2d3748',
      dark: '#0f1419',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00d4aa',
      light: '#33e0bd',
      dark: '#009b7a',
      contrastText: '#000000',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 1px rgba(0, 0, 0, 0.14)',
    '0px 1px 5px rgba(0, 0, 0, 0.12), 0px 2px 2px rgba(0, 0, 0, 0.14)',
    '0px 1px 8px rgba(0, 0, 0, 0.12), 0px 3px 4px rgba(0, 0, 0, 0.14)',
    '0px 2px 4px rgba(0, 0, 0, 0.12), 0px 4px 5px rgba(0, 0, 0, 0.14)',
    '0px 3px 3px rgba(0, 0, 0, 0.12), 0px 3px 4px rgba(0, 0, 0, 0.14)',
    '0px 3px 5px rgba(0, 0, 0, 0.12), 0px 6px 6px rgba(0, 0, 0, 0.14)',
    '0px 3px 5px rgba(0, 0, 0, 0.12), 0px 6px 10px rgba(0, 0, 0, 0.14)',
    '0px 4px 5px rgba(0, 0, 0, 0.12), 0px 7px 10px rgba(0, 0, 0, 0.14)',
    '0px 5px 5px rgba(0, 0, 0, 0.12), 0px 8px 10px rgba(0, 0, 0, 0.14)',
    '0px 5px 6px rgba(0, 0, 0, 0.12), 0px 9px 12px rgba(0, 0, 0, 0.14)',
    '0px 6px 6px rgba(0, 0, 0, 0.12), 0px 10px 14px rgba(0, 0, 0, 0.14)',
    '0px 6px 7px rgba(0, 0, 0, 0.12), 0px 11px 15px rgba(0, 0, 0, 0.14)',
    '0px 7px 8px rgba(0, 0, 0, 0.12), 0px 12px 17px rgba(0, 0, 0, 0.14)',
    '0px 7px 8px rgba(0, 0, 0, 0.12), 0px 13px 19px rgba(0, 0, 0, 0.14)',
    '0px 7px 9px rgba(0, 0, 0, 0.12), 0px 14px 21px rgba(0, 0, 0, 0.14)',
    '0px 8px 9px rgba(0, 0, 0, 0.12), 0px 15px 22px rgba(0, 0, 0, 0.14)',
    '0px 8px 10px rgba(0, 0, 0, 0.12), 0px 16px 24px rgba(0, 0, 0, 0.14)',
    '0px 8px 11px rgba(0, 0, 0, 0.12), 0px 17px 26px rgba(0, 0, 0, 0.14)',
    '0px 9px 11px rgba(0, 0, 0, 0.12), 0px 18px 28px rgba(0, 0, 0, 0.14)',
    '0px 9px 12px rgba(0, 0, 0, 0.12), 0px 19px 29px rgba(0, 0, 0, 0.14)',
    '0px 10px 13px rgba(0, 0, 0, 0.12), 0px 20px 31px rgba(0, 0, 0, 0.14)',
    '0px 10px 13px rgba(0, 0, 0, 0.12), 0px 21px 33px rgba(0, 0, 0, 0.14)',
    '0px 10px 14px rgba(0, 0, 0, 0.12), 0px 22px 35px rgba(0, 0, 0, 0.14)',
    '0px 11px 15px rgba(0, 0, 0, 0.12), 0px 23px 36px rgba(0, 0, 0, 0.14)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
          '&:hover': {
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(26, 54, 93, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
});

export default marketingDashboardTheme;