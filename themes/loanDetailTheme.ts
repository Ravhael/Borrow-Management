import { createTheme } from '@mui/material/styles'

const loanDetailTheme = createTheme({
  palette: {
    primary: {
      main: '#1565c0', // Professional blue
      light: '#42a5f5',
      dark: '#0d47a1',
    },
    secondary: {
      main: '#424242', // Professional gray
      light: '#6d6d6d',
      dark: '#1b1b1b',
    },
    success: {
      main: '#2e7d32', // Professional green
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#ed6c02', // Professional orange
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f', // Professional red
      light: '#f44336',
      dark: '#b71c1c',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 700,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
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
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.07)',
    '0px 6px 12px rgba(0,0,0,0.08)',
    '0px 8px 16px rgba(0,0,0,0.10)',
    '0px 10px 20px rgba(0,0,0,0.11)',
    '0px 12px 24px rgba(0,0,0,0.12)',
    '0px 14px 28px rgba(0,0,0,0.13)',
    '0px 16px 32px rgba(0,0,0,0.14)',
    '0px 18px 36px rgba(0,0,0,0.15)',
    '0px 20px 40px rgba(0,0,0,0.16)',
    '0px 22px 44px rgba(0,0,0,0.17)',
    '0px 24px 48px rgba(0,0,0,0.18)',
    '0px 26px 52px rgba(0,0,0,0.19)',
    '0px 28px 56px rgba(0,0,0,0.20)',
    '0px 30px 60px rgba(0,0,0,0.21)',
    '0px 32px 64px rgba(0,0,0,0.22)',
    '0px 34px 68px rgba(0,0,0,0.23)',
    '0px 36px 72px rgba(0,0,0,0.24)',
    '0px 38px 76px rgba(0,0,0,0.25)',
    '0px 40px 80px rgba(0,0,0,0.26)',
    '0px 42px 84px rgba(0,0,0,0.27)',
    '0px 44px 88px rgba(0,0,0,0.28)',
    '0px 46px 92px rgba(0,0,0,0.29)',
    '0px 48px 96px rgba(0,0,0,0.30)',
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0px 8px 32px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
          fontSize: '0.95rem',
          padding: '12px 24px',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0px 4px 16px rgba(21, 101, 192, 0.3)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
          color: 'white',
          '&:hover': {
            background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.10)',
        },
        elevation2: {
          boxShadow: '0px 4px 16px rgba(0,0,0,0.12)',
        },
        elevation3: {
          boxShadow: '0px 6px 24px rgba(0,0,0,0.15)',
        },
        elevation4: {
          boxShadow: '0px 8px 32px rgba(0,0,0,0.18)',
        },
      },
    },
  },
})

export default loanDetailTheme