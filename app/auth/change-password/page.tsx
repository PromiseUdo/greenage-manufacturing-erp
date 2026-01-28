// // src/app/auth/change-password/page.tsx

// 'use client';

// import { Suspense, useState } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { signOut, useSession } from 'next-auth/react';
// import {
//   Box,
//   Card,
//   Typography,
//   TextField,
//   Button,
//   Alert,
//   CircularProgress,
//   InputAdornment,
//   IconButton,
//   Paper,
// } from '@mui/material';
// import {
//   Visibility,
//   VisibilityOff,
//   CheckCircle,
//   Lock,
// } from '@mui/icons-material';
// import { styled } from '@mui/material/styles';

// const StyledCard = styled(Card)(({ theme }) => ({
//   maxWidth: '480px',
//   width: '100%',
//   padding: theme.spacing(5),
//   borderRadius: theme.spacing(2),
//   boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
// }));

// function ChangePasswordForm() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { data: session } = useSession();
//   const isRequired = searchParams.get('required') === 'true';

//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState(false);

//   const validatePassword = () => {
//     if (!currentPassword) {
//       setError('Current password is required');
//       return false;
//     }
//     if (!newPassword) {
//       setError('New password is required');
//       return false;
//     }
//     if (newPassword.length < 6) {
//       setError('New password must be at least 6 characters long');
//       return false;
//     }
//     if (newPassword === currentPassword) {
//       setError('New password must be different from current password');
//       return false;
//     }
//     if (newPassword !== confirmPassword) {
//       setError('Passwords do not match');
//       return false;
//     }
//     return true;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');

//     if (!validatePassword()) {
//       return;
//     }

//     setLoading(true);

//     try {
//       const res = await fetch('/api/auth/change-password', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           currentPassword,
//           newPassword,
//         }),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         setSuccess(true);
//         // Redirect to dashboard after 2 seconds
//         setTimeout(() => {
//           router.push('/dashboard');
//           router.refresh();
//         }, 2000);
//       } else {
//         setError(data.error || 'Failed to change password');
//       }
//     } catch (err) {
//       setError('Network error. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     if (isRequired) {
//       // If password change is required, log them out
//       signOut({ callbackUrl: '/auth/signin' });
//     } else {
//       router.back();
//     }
//   };

//   if (success) {
//     return (
//       <Box
//         sx={{
//           minHeight: '100vh',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           backgroundColor: '#f8fafc',
//           padding: 2,
//         }}
//       >
//         <StyledCard>
//           <Box sx={{ textAlign: 'center' }}>
//             <CheckCircle
//               sx={{
//                 fontSize: 64,
//                 color: '#10b981',
//                 mb: 2,
//               }}
//             />
//             <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
//               Password Changed Successfully!
//             </Typography>
//             <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//               Your password has been updated. Redirecting you to dashboard...
//             </Typography>
//             <CircularProgress size={32} sx={{ color: '#10b981' }} />
//           </Box>
//         </StyledCard>
//       </Box>
//     );
//   }

//   return (
//     <Box
//       sx={{
//         minHeight: '100vh',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         backgroundColor: '#f8fafc',
//         padding: 2,
//         position: 'relative',
//         overflow: 'hidden',
//       }}
//     >
//       {/* Background decoration */}
//       <Box
//         sx={{
//           position: 'absolute',
//           top: -100,
//           right: -100,
//           width: 300,
//           height: 300,
//           borderRadius: '50%',
//           background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
//           opacity: 0.1,
//           filter: 'blur(60px)',
//         }}
//       />
//       <Box
//         sx={{
//           position: 'absolute',
//           bottom: -100,
//           left: -100,
//           width: 300,
//           height: 300,
//           borderRadius: '50%',
//           background: 'linear-gradient(135deg, #0a1929 0%, #1e3a5f 100%)',
//           opacity: 0.1,
//           filter: 'blur(60px)',
//         }}
//       />

//       <StyledCard sx={{ position: 'relative', zIndex: 1 }}>
//         <Box sx={{ mb: 4, textAlign: 'center' }}>
//           <Box
//             sx={{
//               width: 64,
//               height: 64,
//               borderRadius: '50%',
//               bgcolor: '#f0fdf4',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               margin: '0 auto 16px',
//             }}
//           >
//             <Lock sx={{ fontSize: 32, color: '#10b981' }} />
//           </Box>
//           <Typography
//             variant="h4"
//             fontWeight={700}
//             sx={{ color: '#0a1929', mb: 1 }}
//           >
//             {isRequired ? 'Change Your Password' : 'Update Password'}
//           </Typography>
//           <Typography variant="body2" color="text.secondary">
//             {isRequired
//               ? 'For security, please change your temporary password'
//               : 'Enter your current password and new password'}
//           </Typography>
//         </Box>

//         {isRequired && (
//           <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
//             <strong>Action Required:</strong> You must change your password
//             before accessing the system.
//           </Alert>
//         )}

//         {error && (
//           <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
//             {error}
//           </Alert>
//         )}

//         <Box
//           component="form"
//           onSubmit={handleSubmit}
//           sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
//         >
//           <TextField
//             fullWidth
//             label="Current Password"
//             type={showCurrentPassword ? 'text' : 'password'}
//             value={currentPassword}
//             onChange={(e) => setCurrentPassword(e.target.value)}
//             disabled={loading}
//             required
//             variant="outlined"
//             placeholder="Enter current password"
//             InputProps={{
//               endAdornment: (
//                 <InputAdornment position="end">
//                   <IconButton
//                     onClick={() => setShowCurrentPassword(!showCurrentPassword)}
//                     edge="end"
//                   >
//                     {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
//                   </IconButton>
//                 </InputAdornment>
//               ),
//             }}
//             sx={{
//               '& .MuiOutlinedInput-root': {
//                 borderRadius: 2,
//               },
//             }}
//           />

//           <TextField
//             fullWidth
//             label="New Password"
//             type={showNewPassword ? 'text' : 'password'}
//             value={newPassword}
//             onChange={(e) => setNewPassword(e.target.value)}
//             disabled={loading}
//             required
//             variant="outlined"
//             placeholder="Enter new password"
//             InputProps={{
//               endAdornment: (
//                 <InputAdornment position="end">
//                   <IconButton
//                     onClick={() => setShowNewPassword(!showNewPassword)}
//                     edge="end"
//                   >
//                     {showNewPassword ? <VisibilityOff /> : <Visibility />}
//                   </IconButton>
//                 </InputAdornment>
//               ),
//             }}
//             sx={{
//               '& .MuiOutlinedInput-root': {
//                 borderRadius: 2,
//               },
//             }}
//           />

//           <TextField
//             fullWidth
//             label="Confirm New Password"
//             type={showConfirmPassword ? 'text' : 'password'}
//             value={confirmPassword}
//             onChange={(e) => setConfirmPassword(e.target.value)}
//             disabled={loading}
//             required
//             variant="outlined"
//             placeholder="Confirm new password"
//             InputProps={{
//               endAdornment: (
//                 <InputAdornment position="end">
//                   <IconButton
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                     edge="end"
//                   >
//                     {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
//                   </IconButton>
//                 </InputAdornment>
//               ),
//             }}
//             sx={{
//               '& .MuiOutlinedInput-root': {
//                 borderRadius: 2,
//               },
//             }}
//           />

//           <Paper
//             elevation={0}
//             sx={{
//               p: 2,
//               bgcolor: '#f8fafc',
//               border: '1px solid #e2e8f0',
//               borderRadius: 2,
//             }}
//           >
//             <Typography
//               variant="caption"
//               color="text.secondary"
//               sx={{ display: 'block', mb: 0.5 }}
//             >
//               Password requirements:
//             </Typography>
//             <Typography
//               variant="caption"
//               color="text.secondary"
//               sx={{ display: 'block' }}
//             >
//               • At least 6 characters long
//             </Typography>
//             <Typography
//               variant="caption"
//               color="text.secondary"
//               sx={{ display: 'block' }}
//             >
//               • Different from current password
//             </Typography>
//             <Typography
//               variant="caption"
//               color="text.secondary"
//               sx={{ display: 'block' }}
//             >
//               • Both passwords must match
//             </Typography>
//           </Paper>

//           <Button
//             type="submit"
//             fullWidth
//             variant="contained"
//             disabled={loading}
//             startIcon={loading ? <CircularProgress size={20} /> : null}
//             sx={{
//               mt: 1,
//               py: 1.5,
//               borderRadius: 2,
//               textTransform: 'none',
//               fontSize: '1rem',
//               fontWeight: 600,
//             }}
//           >
//             {loading ? 'Changing Password...' : 'Change Password'}
//           </Button>

//           {!isRequired && (
//             <Button
//               fullWidth
//               variant="text"
//               onClick={handleCancel}
//               disabled={loading}
//               sx={{
//                 textTransform: 'none',
//                 fontWeight: 600,
//                 color: '#64748b',
//               }}
//             >
//               Cancel
//             </Button>
//           )}

//           {isRequired && (
//             <Button
//               fullWidth
//               variant="outlined"
//               onClick={handleCancel}
//               disabled={loading}
//               sx={{
//                 textTransform: 'none',
//                 fontWeight: 600,
//                 color: '#ef4444',
//                 borderColor: '#ef4444',
//                 '&:hover': {
//                   borderColor: '#dc2626',
//                   bgcolor: '#fef2f2',
//                 },
//               }}
//             >
//               Sign Out Instead
//             </Button>
//           )}
//         </Box>
//       </StyledCard>
//     </Box>
//   );
// }

// export default function ChangePasswordPage() {
//   return (
//     <Suspense
//       fallback={
//         <Box
//           sx={{
//             minHeight: '100vh',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}
//         >
//           <CircularProgress />
//         </Box>
//       }
//     >
//       <ChangePasswordForm />
//     </Suspense>
//   );
// }

// src/app/auth/change-password/page.tsx
// UPDATED - Refreshes session after password change

'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Lock,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: '480px',
  width: '100%',
  padding: theme.spacing(5),
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
}));

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession(); // ✅ Get update function
  const isRequired = searchParams.get('required') === 'true';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validatePassword = () => {
    if (!currentPassword) {
      setError('Current password is required');
      return false;
    }
    if (!newPassword) {
      setError('New password is required');
      return false;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return false;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);

        setTimeout(async () => {
          await signOut({
            redirect: true,
            callbackUrl: '/auth/signin',
          });
        }, 1500);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isRequired) {
      // If password change is required, log them out
      signOut({ callbackUrl: '/auth/signin' });
    } else {
      router.back();
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: 2,
        }}
      >
        <StyledCard>
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle
              sx={{
                fontSize: 64,
                color: '#10b981',
                mb: 2,
              }}
            />
            <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
              Password Changed Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your password has been updated. Redirecting you to login...
            </Typography>
            <CircularProgress size={32} sx={{ color: '#10b981' }} />
          </Box>
        </StyledCard>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          opacity: 0.1,
          filter: 'blur(60px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0a1929 0%, #1e3a5f 100%)',
          opacity: 0.1,
          filter: 'blur(60px)',
        }}
      />

      <StyledCard sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Lock sx={{ fontSize: 32, color: '#10b981' }} />
          </Box>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ color: '#0a1929', mb: 1 }}
          >
            {isRequired ? 'Change Your Password' : 'Update Password'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isRequired
              ? 'For security, please change your temporary password'
              : 'Enter your current password and new password'}
          </Typography>
        </Box>

        {isRequired && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            <strong>Action Required:</strong> You must change your password
            before accessing the system.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          <TextField
            fullWidth
            label="Current Password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
            required
            variant="outlined"
            placeholder="Enter current password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            fullWidth
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            required
            variant="outlined"
            placeholder="Enter new password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            fullWidth
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
            variant="outlined"
            placeholder="Confirm new password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 2,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.5 }}
            >
              Password requirements:
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block' }}
            >
              • At least 6 characters long
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block' }}
            >
              • Different from current password
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block' }}
            >
              • Both passwords must match
            </Typography>
          </Paper>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              mt: 1,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </Button>

          {!isRequired && (
            <Button
              fullWidth
              variant="text"
              onClick={handleCancel}
              disabled={loading}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: '#64748b',
              }}
            >
              Cancel
            </Button>
          )}

          {isRequired && (
            <Button
              fullWidth
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: '#ef4444',
                borderColor: '#ef4444',
                '&:hover': {
                  borderColor: '#dc2626',
                  bgcolor: '#fef2f2',
                },
              }}
            >
              Sign Out Instead
            </Button>
          )}
        </Box>
      </StyledCard>
    </Box>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <ChangePasswordForm />
    </Suspense>
  );
}
