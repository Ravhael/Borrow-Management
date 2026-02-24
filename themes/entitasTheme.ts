import { createTheme } from '@mui/material/styles'

export const entitasTheme = createTheme({
  palette: {
    primary: {
      main: '#1a365d', // Professional dark blue
      light: '#2d3748',
      dark: '#0f1419',
    },
    secondary: {
      main: '#00d4aa', // Corporate teal
      light: '#38e4c8',
      dark: '#00b894',
    },
    success: {
      main: '#00d4aa',
      light: '#38e4c8',
      dark: '#00b894',
    },
    warning: {
      main: '#ff9500',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#ff4757',
      light: '#ff6b7a',
      dark: '#d63031',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h2: {
      fontWeight: 800,
      fontSize: '3.5rem',
    },
    h4: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 700,
      fontSize: '1.25rem',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
    },
    body2: {
      fontWeight: 500,
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a8a8a8',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
          fontSize: '0.95rem',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          background: 'linear-gradient(135deg, #1a365d 0%, #0f1419 100%)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(26, 54, 93, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0f1419 0%, #1a365d 100%)',
            boxShadow: '0 6px 20px rgba(26, 54, 93, 0.4)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.8rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
            '&.Mui-focused': {
              backgroundColor: 'white',
              boxShadow: '0 0 0 3px rgba(26, 54, 93, 0.1)',
            },
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          '& .MuiTableCell-head': {
            fontWeight: 700,
            color: '#374151',
            borderBottom: '2px solid #e5e7eb',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '16px 12px',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            '&:hover': {
              backgroundColor: 'rgba(26, 54, 93, 0.04)',
              transform: 'scale(1.002)',
              transition: 'all 0.2s ease-in-out',
            },
            '&:nth-of-type(even)': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            },
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            transition: 'all 0.2s ease-in-out',
          },
          '& .MuiTableCell-body': {
            padding: '16px 12px',
            fontSize: '0.9rem',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        },
      },
    },
  },
})