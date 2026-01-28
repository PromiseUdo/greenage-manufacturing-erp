'use client';

import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import ForgotPassword from '../components/forgot-password';

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

            {/* <Divider sx={{ my: 2 }}>or</Divider> */}

            {/* <Box sx={{ textAlign: 'center' }}>
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
            </Box> */}
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
