// 'use client';

// import * as React from 'react';
// import Box from '@mui/material/Box';
// import Button from '@mui/material/Button';
// import Checkbox from '@mui/material/Checkbox';
// import CssBaseline from '@mui/material/CssBaseline';
// import FormControlLabel from '@mui/material/FormControlLabel';
// import Divider from '@mui/material/Divider';
// import FormLabel from '@mui/material/FormLabel';
// import FormControl from '@mui/material/FormControl';
// import Link from '@mui/material/Link';
// import TextField from '@mui/material/TextField';
// import Typography from '@mui/material/Typography';
// import Alert from '@mui/material/Alert';
// import CircularProgress from '@mui/material/CircularProgress';
// import Stack from '@mui/material/Stack';
// import MuiCard from '@mui/material/Card';
// import { styled } from '@mui/material/styles';
// import ForgotPassword from '../components/forgot-password';
// import { signIn } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
// import { IconButton, InputAdornment } from '@mui/material';
// import { Visibility, VisibilityOff } from '@mui/icons-material';

// const Card = styled(MuiCard)(({ theme }) => ({
//   display: 'flex',
//   flexDirection: 'column',
//   alignSelf: 'center',
//   width: '100%',
//   padding: theme.spacing(4),
//   gap: theme.spacing(2),
//   margin: 'auto',
//   [theme.breakpoints.up('sm')]: {
//     maxWidth: '450px',
//   },
//   boxShadow:
//     'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
//   ...theme.applyStyles('dark', {
//     boxShadow:
//       'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
//   }),
// }));

// const SignInContainer = styled(Stack)(({ theme }) => ({
//   height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
//   minHeight: '100%',
//   padding: theme.spacing(2),
//   [theme.breakpoints.up('sm')]: {
//     padding: theme.spacing(4),
//   },
//   '&::before': {
//     content: '""',
//     display: 'block',
//     position: 'absolute',
//     zIndex: -1,
//     inset: 0,
//     backgroundImage:
//       'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
//     backgroundRepeat: 'no-repeat',
//     ...theme.applyStyles('dark', {
//       backgroundImage:
//         'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
//     }),
//   },
// }));

// export default function SignIn(props: { disableCustomTheme?: boolean }) {
//   const [emailError, setEmailError] = React.useState(false);
//   const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
//   const [passwordError, setPasswordError] = React.useState(false);
//   const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
//   const [serverError, setServerError] = React.useState<string | null>(null);
//   const [isLoading, setIsLoading] = React.useState(false);
//   const [isResending, setIsResending] = React.useState(false);
//   const [resendSuccess, setResendSuccess] = React.useState(false);
//   const [open, setOpen] = React.useState(false);
//   const [showPassword, setShowPassword] = React.useState(false);

//   const router = useRouter();

//   const handleClickOpen = () => setOpen(true);
//   const handleClose = () => setOpen(false);

//   const validateInputs = (email: string, password: string) => {
//     let isValid = true;

//     if (!email || !/\S+@\S+\.\S+/.test(email)) {
//       setEmailError(true);
//       setEmailErrorMessage('Please enter a valid email address.');
//       isValid = false;
//     } else {
//       setEmailError(false);
//       setEmailErrorMessage('');
//     }

//     if (!password || password.length < 6) {
//       setPasswordError(true);
//       setPasswordErrorMessage('Password must be at least 6 characters long.');
//       isValid = false;
//     } else {
//       setPasswordError(false);
//       setPasswordErrorMessage('');
//     }

//     return isValid;
//   };

//   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setServerError(null);
//     setResendSuccess(false);
//     setIsLoading(true);

//     const data = new FormData(event.currentTarget);
//     const email = data.get('email') as string;
//     const password = data.get('password') as string;

//     if (!validateInputs(email, password)) {
//       setIsLoading(false);
//       return;
//     }

//     try {
//       const res = await signIn('credentials', {
//         redirect: false,
//         email,
//         password,
//       });

//       if (res?.ok) {
//         router.push('/dashboard');
//       } else {
//         // Handle specific "not verified" case
//         if (res?.error === 'Email not verified') {
//           setServerError('Please verify your email before signing in.');
//         } else {
//           setServerError(res?.error || 'Invalid email or password');
//         }
//       }
//     } catch (error) {
//       setServerError('An unexpected error occurred');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleResendVerification = async () => {
//     const emailInput = document.getElementById('email') as HTMLInputElement;
//     const email = emailInput?.value?.trim();

//     if (!email || !/\S+@\S+\.\S+/.test(email)) {
//       setServerError('Please enter a valid email first');
//       return;
//     }

//     setIsResending(true);
//     setResendSuccess(false);
//     setServerError(null);

//     try {
//       const res = await fetch('/api/resend-verification', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email }),
//       });

//       if (res.ok) {
//         setResendSuccess(true);
//         setServerError(null);
//       } else {
//         const data = await res.json();
//         setServerError(data.error || 'Failed to resend verification email');
//       }
//     } catch {
//       setServerError('Network error. Please try again later.');
//     } finally {
//       setIsResending(false);
//     }
//   };

//   return (
//     <>
//       <CssBaseline enableColorScheme />
//       <SignInContainer direction="column" justifyContent="space-between">
//         <Card variant="outlined">
//           <img
//             src="/greenage_logo_black.png"
//             alt="GreenAge logo"
//             style={{ width: '120px', height: 'auto' }}
//           />
//           <Typography
//             component="h1"
//             variant="h4"
//             sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
//           >
//             Sign in
//           </Typography>

//           <Box
//             component="form"
//             onSubmit={handleSubmit}
//             noValidate
//             sx={{
//               display: 'flex',
//               flexDirection: 'column',
//               width: '100%',
//               gap: 2,
//             }}
//           >
//             {serverError && (
//               <Alert severity="error" sx={{ mt: 1 }}>
//                 {serverError}
//               </Alert>
//             )}

//             {resendSuccess && (
//               <Alert severity="success" sx={{ mt: 1 }}>
//                 Verification email resent! Check your inbox (and spam folder).
//               </Alert>
//             )}

//             <FormControl>
//               <FormLabel htmlFor="email">Email</FormLabel>
//               <TextField
//                 error={emailError}
//                 helperText={emailErrorMessage}
//                 id="email"
//                 type="email"
//                 name="email"
//                 placeholder="your@email.com"
//                 autoComplete="email"
//                 autoFocus
//                 required
//                 fullWidth
//                 variant="outlined"
//                 color={emailError ? 'error' : 'primary'}
//               />
//             </FormControl>

//             <FormControl>
//               <FormLabel htmlFor="password">Password</FormLabel>
//               {/* <TextField
//                 error={passwordError}
//                 helperText={passwordErrorMessage}
//                 name="password"
//                 placeholder="••••••"
//                 type="password"
//                 id="password"
//                 autoComplete="current-password"
//                 required
//                 fullWidth
//                 variant="outlined"
//                 color={passwordError ? 'error' : 'primary'}
//               /> */}

//               <TextField
//                 id="password"
//                 type={showPassword ? 'text' : 'password'}
//                 error={passwordError}
//                 helperText={passwordErrorMessage}
//                 color={passwordError ? 'error' : 'primary'}
//                 variant="outlined"
//                 name="password"
//                 fullWidth
//                 required
//                 autoComplete="current-password"
//                 slotProps={{
//                   input: {
//                     endAdornment: (
//                       <InputAdornment position="end">
//                         <IconButton
//                           onClick={() => setShowPassword((prev) => !prev)}
//                           edge="end"
//                         >
//                           {showPassword ? <VisibilityOff /> : <Visibility />}
//                         </IconButton>
//                       </InputAdornment>
//                     ),
//                   },
//                 }}
//                 placeholder="••••••"
//               />
//             </FormControl>

//             <FormControlLabel
//               control={<Checkbox value="remember" color="primary" />}
//               label="Remember me"
//             />

//             <ForgotPassword open={open} handleClose={handleClose} />

//             <Button
//               type="submit"
//               fullWidth
//               variant="contained"
//               disabled={isLoading}
//             >
//               {isLoading ? 'Signing in...' : 'Sign in'}
//             </Button>

//             {serverError?.includes('verify your email') && (
//               <Button
//                 variant="outlined"
//                 color="primary"
//                 fullWidth
//                 onClick={handleResendVerification}
//                 disabled={isResending}
//                 startIcon={isResending ? <CircularProgress size={20} /> : null}
//               >
//                 {isResending ? 'Sending...' : 'Resend Verification Email'}
//               </Button>
//             )}

//             <Link
//               component="button"
//               type="button"
//               onClick={handleClickOpen}
//               variant="body2"
//               sx={{ alignSelf: 'center' }}
//             >
//               Forgot your password?
//             </Link>
//           </Box>

//           <Divider>or</Divider>

//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//             <Typography sx={{ textAlign: 'center' }}>
//               Don&apos;t have an account?{' '}
//               <Link href="/auth/signup" variant="body2">
//                 Sign up
//               </Link>
//             </Typography>
//           </Box>
//         </Card>
//       </SignInContainer>
//     </>
//   );
// }

// 'use client';

// import * as React from 'react';
// import {
//   Box,
//   Button,
//   Checkbox,
//   CssBaseline,
//   FormControlLabel,
//   Divider,
//   FormLabel,
//   FormControl,
//   Link,
//   TextField,
//   Typography,
//   Alert,
//   CircularProgress,
//   Stack,
//   IconButton,
//   InputAdornment,
// } from '@mui/material';
// import { styled } from '@mui/material/styles';
// import { Visibility, VisibilityOff } from '@mui/icons-material';
// import { signIn } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
// import ForgotPassword from '../components/forgot-password';
// import Grid from '@mui/material/GridLegacy';
// //
// //
// // --- Styled Components ---

// const MainContainer = styled(Grid)(({ theme }) => ({
//   height: '100vh',
//   width: '100vw',
//   overflow: 'hidden',
//   backgroundColor: theme.palette.background.default,
// }));

// const FormSection = styled(Grid)(({ theme }) => ({
//   display: 'flex',
//   flexDirection: 'column',
//   justifyContent: 'center',
//   alignItems: 'center',
//   padding: theme.spacing(4),
//   zIndex: 2,
//   backgroundColor: theme.palette.background.paper,
//   [theme.breakpoints.up('md')]: {
//     padding: theme.spacing(8),
//   },
// }));

// const VisualSection = styled(Grid)(({ theme }) => ({
//   position: 'relative',
//   overflow: 'hidden',
//   display: 'none',
//   [theme.breakpoints.up('md')]: {
//     display: 'block',
//   },
//   // Dark gradient overlay for text readability
//   '&::after': {
//     content: '""',
//     position: 'absolute',
//     inset: 0,
//     background:
//       'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)',
//     zIndex: 1,
//   },
// }));

// const BackgroundVideo = styled('video')({
//   position: 'absolute',
//   top: '50%',
//   left: '50%',
//   minWidth: '100%',
//   minHeight: '100%',
//   width: 'auto',
//   height: 'auto',
//   transform: 'translateX(-50%) translateY(-50%)',
//   objectFit: 'cover',
// });

// // --- Component Logic ---

// export default function SignIn() {
//   const [emailError, setEmailError] = React.useState(false);
//   const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
//   const [passwordError, setPasswordError] = React.useState(false);
//   const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
//   const [serverError, setServerError] = React.useState<string | null>(null);
//   const [isLoading, setIsLoading] = React.useState(false);
//   const [showPassword, setShowPassword] = React.useState(false);
//   const [open, setOpen] = React.useState(false);

//   const router = useRouter();

//   const validateInputs = (email: string, password: string) => {
//     let isValid = true;
//     if (!email || !/\S+@\S+\.\S+/.test(email)) {
//       setEmailError(true);
//       setEmailErrorMessage('Please enter a valid email.');
//       isValid = false;
//     } else {
//       setEmailError(false);
//     }

//     if (!password || password.length < 6) {
//       setPasswordError(true);
//       setPasswordErrorMessage('Password must be at least 6 characters.');
//       isValid = false;
//     } else {
//       setPasswordError(false);
//     }

//     return isValid;
//   };

//   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setServerError(null);
//     setIsLoading(true);

//     const data = new FormData(event.currentTarget);
//     const email = data.get('email') as string;
//     const password = data.get('password') as string;

//     if (!validateInputs(email, password)) {
//       setIsLoading(false);
//       return;
//     }

//     const res = await signIn('credentials', {
//       redirect: false,
//       email,
//       password,
//     });
//     if (res?.ok) router.push('/dashboard');
//     else setServerError(res?.error || 'Invalid email or password');
//     setIsLoading(false);
//   };

//   return (
//     <MainContainer container>
//       <CssBaseline />

//       {/* LEFT COLUMN: LOGIN (Now uses size prop instead of xs/md) */}
//       <FormSection size={{ xs: 12, md: 5, lg: 4 }}>
//         <Box sx={{ maxWidth: 400, width: '100%' }}>
//           <Box sx={{ mb: 4 }}>
//             <img
//               src="/greenage_logo_black.png"
//               alt="GreenAge logo"
//               style={{ width: '150px', marginBottom: '32px' }}
//             />
//             <Typography
//               variant="h4"
//               sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}
//             >
//               Portal Login
//             </Typography>
//             <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
//               Manage your sustainable energy ecosystem.
//             </Typography>
//           </Box>

//           <Box component="form" onSubmit={handleSubmit} noValidate>
//             {serverError && (
//               <Alert severity="error" sx={{ mb: 2 }}>
//                 {serverError}
//               </Alert>
//             )}

//             <Stack spacing={2.5}>
//               <FormControl>
//                 <FormLabel
//                   sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}
//                 >
//                   Work Email
//                 </FormLabel>
//                 <TextField
//                   error={emailError}
//                   helperText={emailErrorMessage}
//                   id="email"
//                   name="email"
//                   placeholder="name@greenage.com"
//                   fullWidth
//                 />
//               </FormControl>

//               <FormControl>
//                 <FormLabel
//                   sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}
//                 >
//                   Password
//                 </FormLabel>
//                 <TextField
//                   name="password"
//                   type={showPassword ? 'text' : 'password'}
//                   error={passwordError}
//                   helperText={passwordErrorMessage}
//                   fullWidth
//                   slotProps={{
//                     input: {
//                       endAdornment: (
//                         <InputAdornment position="end">
//                           <IconButton
//                             onClick={() => setShowPassword(!showPassword)}
//                           >
//                             {showPassword ? <VisibilityOff /> : <Visibility />}
//                           </IconButton>
//                         </InputAdornment>
//                       ),
//                     },
//                   }}
//                 />
//               </FormControl>

//               <Box
//                 sx={{
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   alignItems: 'center',
//                 }}
//               >
//                 <FormControlLabel
//                   control={<Checkbox color="primary" size="small" />}
//                   label={
//                     <Typography variant="body2">
//                       Remember this device
//                     </Typography>
//                   }
//                 />
//                 <Link
//                   component="button"
//                   type="button"
//                   onClick={() => setOpen(true)}
//                   variant="body2"
//                   sx={{ fontWeight: 700, textDecoration: 'none' }}
//                 >
//                   Forgot?
//                 </Link>
//               </Box>

//               <Button
//                 type="submit"
//                 fullWidth
//                 variant="contained"
//                 disabled={isLoading}
//                 sx={{
//                   py: 1.8,
//                   borderRadius: '12px',
//                   fontWeight: 700,
//                   boxShadow: 'none',
//                 }}
//               >
//                 {isLoading ? (
//                   <CircularProgress size={24} color="inherit" />
//                 ) : (
//                   'Secure Sign In'
//                 )}
//               </Button>
//             </Stack>
//           </Box>

//           <Divider sx={{ my: 4 }}>
//             <Typography
//               variant="caption"
//               sx={{ color: 'text.disabled', fontWeight: 700 }}
//             >
//               PARTNER ACCESS
//             </Typography>
//           </Divider>

//           <Typography sx={{ textAlign: 'center', fontSize: '0.875rem' }}>
//             New Partner?{' '}
//             <Link href="/auth/signup" sx={{ fontWeight: 700 }}>
//               Request Access
//             </Link>
//           </Typography>
//         </Box>
//       </FormSection>

//       {/* RIGHT COLUMN: MOTION MEDIA */}
//       <VisualSection size={{ md: 7, lg: 8 }}>
//         <BackgroundVideo autoPlay loop muted playsInline>
//           {/* Professional Solar Drone Footage */}
//           <source
//             src="https://videos.pexels.com/video-files/8538280/8538280-uhd_2560_1440_25fps.mp4"
//             type="video/mp4"
//           />
//         </BackgroundVideo>

//         <Box
//           sx={{
//             position: 'absolute',
//             bottom: 80,
//             left: 80,
//             zIndex: 2,
//             color: 'white',
//             maxWidth: 500,
//           }}
//         >
//           <Typography
//             variant="h2"
//             sx={{ fontWeight: 800, mb: 2, lineHeight: 1.1 }}
//           >
//             Clean Energy. <br />
//             Unlimited Potential.
//           </Typography>
//           <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400 }}>
//             Harnessing the sun to power the next generation of industrial
//             battery technology.
//           </Typography>
//         </Box>
//       </VisualSection>

//       <ForgotPassword open={open} handleClose={() => setOpen(false)} />
//     </MainContainer>
//   );
// }

'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import ForgotPassword from '../components/forgot-password';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

type Particle = {
  delay: number;
  duration: number;
  left: string;
  top: string;
};

const SplitContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
  },
}));

const LeftPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
  backgroundColor: '#ffffff',
  position: 'relative',
  zIndex: 2,
  [theme.breakpoints.up('md')]: {
    maxWidth: '50%',
  },
  [theme.breakpoints.down('md')]: {
    minHeight: '100vh',
  },
}));

const RightPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#0a1929',
  [theme.breakpoints.up('md')]: {
    maxWidth: '50%',
  },
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const VideoBackground = styled('video')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  opacity: 0.8,
});

// const VideoOverlay = styled(Box)(({ theme }) => ({
//   position: 'absolute',
//   top: 0,
//   left: 0,
//   width: '100%',
//   height: '100%',
//   background:
//     'linear-gradient(135deg, rgba(10, 25, 41, 0.7) 0%, rgba(16, 185, 129, 0.3) 100%)',
//   display: 'flex',
//   flexDirection: 'column',
//   justifyContent: 'center',
//   alignItems: 'center',
//   padding: theme.spacing(6),
//   color: '#ffffff',
// }));

const VideoOverlay = styled(Box)(() => ({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  background:
    'linear-gradient(135deg, rgba(10,25,41,0.75) 0%, rgba(16,185,129,0.35) 100%)',
  zIndex: 2,
}));

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: '480px',
  padding: theme.spacing(5),
  gap: theme.spacing(2.5),
  border: 'none',
  boxShadow: 'none',
}));

const LogoContainer = styled(Box)({
  marginBottom: '24px',
});

const AnimatedBackground = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(135deg, #0a1929 0%, #1e3a5f 50%, #10b981 100%)',
  backgroundSize: '200% 200%',
  animation: 'gradientShift 15s ease infinite',
  '@keyframes gradientShift': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
});

// const FloatingParticle = styled(Box, {
//   shouldForwardProp: (prop) => prop !== '$delay' && prop !== '$duration',
// })<{ $delay?: number; $duration?: number }>(
//   ({ $delay = 0, $duration = 20 }) => ({
//     position: 'absolute',
//     width: '4px',
//     height: '4px',
//     backgroundColor: 'rgba(16, 185, 129, 0.6)',
//     borderRadius: '50%',
//     animation: `float ${$duration}s ease-in-out infinite`,
//     animationDelay: `${$delay}s`,

//     '@keyframes float': {
//       '0%, 100%': {
//         transform: 'translate(0, 0) scale(1)',
//         opacity: 0,
//       },
//       '50%': {
//         opacity: 1,
//         transform: 'translate(100px, -100px) scale(1.5)',
//       },
//     },
//   })
// );

const FloatingParticle = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$delay' && prop !== '$duration',
})<{ $delay?: number; $duration?: number }>(() => ({
  position: 'absolute',
  width: '5px',
  height: '5px',
  backgroundColor: 'rgba(16, 185, 129, 0.75)',
  borderRadius: '50%',
  filter: 'blur(0.3px)',
  animation: `float 18s ease-in-out infinite`,
}));

const ImageLayer = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$active',
})<{ $active?: boolean }>(({ $active }) => ({
  position: 'absolute',
  inset: 0,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: $active ? 1 : 0,
  transform: $active ? 'scale(1.1)' : 'scale(1)',
  transition: 'opacity 1.5s ease, transform 6s ease',
}));

export default function SignIn(props: { disableCustomTheme?: boolean }) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [particles, setParticles] = React.useState<Particle[]>([]);
  const router = useRouter();

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const backgroundImages = [
    '/auth-bg1.png',
    // '/auth-bg2.png',
    '/auth-bg3.png',
    '/auth-bg4.png',
  ];

  const [activeImage, setActiveImage] = React.useState(0);

  React.useEffect(() => {
    const generated = Array.from({ length: 12 }).map((_, i) => ({
      delay: i * 2,
      duration: 15 + Math.random() * 10,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }));

    setParticles(generated);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % backgroundImages.length);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const validateInputs = (email: string, password: string) => {
    let isValid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setResendSuccess(false);
    setIsLoading(true);

    const data = new FormData(event.currentTarget);
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    if (!validateInputs(email, password)) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.ok) {
        router.push('/dashboard');
      } else {
        if (res?.error === 'Email not verified') {
          setServerError('Please verify your email before signing in.');
        } else {
          setServerError(res?.error || 'Invalid email or password');
        }
      }
    } catch (error) {
      setServerError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const email = emailInput?.value?.trim();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setServerError('Please enter a valid email first');
      return;
    }

    setIsResending(true);
    setResendSuccess(false);
    setServerError(null);

    try {
      const res = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendSuccess(true);
        setServerError(null);
      } else {
        const data = await res.json();
        setServerError(data.error || 'Failed to resend verification email');
      }
    } catch {
      setServerError('Network error. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <CssBaseline enableColorScheme />
      <SplitContainer>
        {/* Left Panel - Login Form */}
        <LeftPanel>
          <Card>
            <LogoContainer>
              <img
                src="/greenage_logo_black.png"
                alt="GreenAge logo"
                style={{ width: '160px', height: 'auto' }}
              />
            </LogoContainer>

            <Box sx={{ mb: 2 }}>
              <Typography
                component="h1"
                variant="h3"
                sx={{
                  fontWeight: 700,
                  fontSize: 'clamp(2rem, 5vw, 2.5rem)',
                  color: '#0a1929',
                  mb: 1,
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: '#64748b', fontSize: '1rem' }}
              >
                Sign in to access your account
              </Typography>
            </Box>

            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: 2.5,
              }}
            >
              {serverError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {serverError}
                </Alert>
              )}

              {resendSuccess && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  Verification email resent! Check your inbox (and spam folder).
                </Alert>
              )}

              <FormControl>
                <FormLabel
                  htmlFor="email"
                  sx={{ color: '#0a1929', mb: 1, fontSize: '14px' }}
                >
                  Email Address
                </FormLabel>
                <TextField
                  error={emailError}
                  helperText={emailErrorMessage}
                  id="email"
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  autoFocus
                  required
                  fullWidth
                  variant="outlined"
                  color={emailError ? 'error' : 'primary'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#f8fafc',
                    },
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  htmlFor="password"
                  sx={{ color: '#0a1929', mb: 1, fontSize: '14px' }}
                >
                  Password
                </FormLabel>
                <TextField
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  error={passwordError}
                  helperText={passwordErrorMessage}
                  color={passwordError ? 'error' : 'primary'}
                  variant="outlined"
                  name="password"
                  fullWidth
                  required
                  autoComplete="current-password"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((prev) => !prev)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  placeholder="••••••••"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#f8fafc',
                    },
                  }}
                />
              </FormControl>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <FormControlLabel
                  control={<Checkbox value="remember" color="primary" />}
                  label="Remember me"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: '14px',
                    },
                  }}
                />
                <Link
                  component="button"
                  type="button"
                  onClick={handleClickOpen}
                  variant="body2"
                  sx={{
                    // color: '#10b981',
                    fontSize: '14px',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <ForgotPassword open={open} handleClose={handleClose} />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  mt: 1,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  // backgroundColor: '#10b981',
                  // '&:hover': {
                  //   backgroundColor: '#059669',
                  // },
                }}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              {serverError?.includes('verify your email') && (
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={handleResendVerification}
                  disabled={isResending}
                  startIcon={
                    isResending ? <CircularProgress size={20} /> : null
                  }
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              )}
            </Box>

            <Divider sx={{ my: 2 }}>or</Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: '#64748b', fontSize: '14px' }}>
                Don&apos;t have an account?{' '}
                <Link
                  href="/auth/signup"
                  sx={{
                    // fontWeight: 600,
                    // color: '#10b981',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Card>
        </LeftPanel>

        {/* Right Panel - Visual Content */}
        <RightPanel>
          <AnimatedBackground />

          {backgroundImages.map((img, index) => (
            <ImageLayer
              key={img}
              $active={index === activeImage}
              sx={{
                backgroundImage: `url(${img})`,
              }}
            />
          ))}

          {/* Animated particles for energy effect */}
          {particles.map((p, i) => (
            <FloatingParticle
              key={i}
              $delay={p.delay}
              $duration={p.duration}
              sx={{
                left: p.left,
                top: p.top,
              }}
            />
          ))}

          {/* <VideoOverlay>
            <Box sx={{ textAlign: 'center', maxWidth: '600px', zIndex: 1 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  mb: 3,
                  textShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  background:
                    'linear-gradient(135deg, #ffffff 0%, #10b981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Powering the Future
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 400,
                  fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                  mb: 4,
                  opacity: 0.95,
                  lineHeight: 1.6,
                }}
              >
                Advanced solar battery solutions for a sustainable tomorrow
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  gap: 4,
                  justifyContent: 'center',
                  mt: 6,
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, color: '#10b981' }}
                  >
                    99.9%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Efficiency Rate
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, color: '#10b981' }}
                  >
                    25+
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Year Lifespan
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, color: '#10b981' }}
                  >
                    100%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Renewable
                  </Typography>
                </Box>
              </Box>
            </Box>
          </VideoOverlay> */}

          <VideoOverlay />
        </RightPanel>
      </SplitContainer>
    </>
  );
}
