import { createTheme } from '@mui/material/styles';

// Material Design 3 inspired theme (approximation using MUI v5 APIs)
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#059669', // emerald-600
    },
    secondary: {
      main: '#0d9488', // teal-600
    },
    background: {
      default: '#f1f5f9', // slate-100
      paper: '#ffffff',
    },
    error: { main: '#dc2626' },
    warning: { main: '#f59e0b' },
    info: { main: '#2563eb' },
    success: { main: '#059669' },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '1.75rem', fontWeight: 600 },
    h2: { fontSize: '1.25rem', fontWeight: 600 },
    h3: { fontSize: '1.125rem', fontWeight: 600 },
    subtitle1: { fontSize: '0.95rem', fontWeight: 500 },
    body1: { fontSize: '0.95rem' },
    body2: { fontSize: '0.8rem' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: { root: { boxShadow: 'none', borderBottom: '1px solid #e2e8f0' } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: { root: { border: '1px solid #e2e8f0' } },
    },
    MuiButton: {
      styleOverrides: { root: { borderRadius: 999 } },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiTableCell: {
      styleOverrides: { head: { fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.05em' } },
    },
  },
});

