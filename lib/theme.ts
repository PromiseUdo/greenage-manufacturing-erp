// // src/lib/theme.ts

// 'use client';

// import { createTheme } from '@mui/material/styles';

// export const theme = createTheme({
//   palette: {
//     mode: 'light',
//     primary: {
//       main: '#1976d2',
//       light: '#42a5f5',
//       dark: '#1565c0',
//     },
//     secondary: {
//       main: '#9c27b0',
//       light: '#ba68c8',
//       dark: '#7b1fa2',
//     },
//     success: {
//       main: '#2e7d32',
//     },
//     warning: {
//       main: '#ed6c02',
//     },
//     error: {
//       main: '#d32f2f',
//     },
//     background: {
//       default: '#f5f5f5',
//       paper: '#ffffff',
//     },
//   },
//   typography: {
//     fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
//     h4: {
//       fontWeight: 600,
//     },
//     h5: {
//       fontWeight: 600,
//     },
//     h6: {
//       fontWeight: 600,
//     },
//   },
//   components: {
//     MuiButton: {
//       styleOverrides: {
//         root: {
//           textTransform: 'none',
//           borderRadius: 8,
//         },
//       },
//     },
//     MuiCard: {
//       styleOverrides: {
//         root: {
//           borderRadius: 12,
//           boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//         },
//       },
//     },
//     MuiTextField: {
//       defaultProps: {
//         variant: 'outlined',
//         size: 'medium',
//       },
//     },
//   },
// });

// src/lib/theme.ts

'use client';

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F172A', // ← make this your brand color (optional)
      light: '#334155',
      dark: '#020617',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },

  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },

  components: {
    /* ---------------- Buttons ---------------- */
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },

    /* ---------------- Cards ---------------- */
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },

    /* ---------------- TextField Defaults ---------------- */
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },

    /* ---------------- Outlined Input (borders) ---------------- */
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& fieldset': {
            borderColor: '#CBD5E1',
          },
          '&:hover fieldset': {
            borderColor: '#64748B',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#0F172A',
            borderWidth: 1,
          },
        },
      },
    },

    /* ---------------- Input Labels ---------------- */
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#475569',
          fontSize: '14px',
          '&.Mui-focused': {
            color: '#0F172A',
          },
          '&.MuiInputLabel-shrink': {
            color: '#0F172A',
          },
        },
      },
    },

    /* ---------------- Switch ---------------- */
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: '#0F172A',
          },
        },
        track: {
          '.Mui-checked + &': {
            backgroundColor: '#0F172A',
          },
        },
      },
    },
  },
});
