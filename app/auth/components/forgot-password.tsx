// import * as React from 'react';
// import Button from '@mui/material/Button';
// import Dialog from '@mui/material/Dialog';
// import DialogActions from '@mui/material/DialogActions';
// import DialogContent from '@mui/material/DialogContent';
// import DialogContentText from '@mui/material/DialogContentText';
// import DialogTitle from '@mui/material/DialogTitle';
// import { TextField } from '@mui/material';

// interface ForgotPasswordProps {
//   open: boolean;
//   handleClose: () => void;
// }

// export default function ForgotPassword({
//   open,
//   handleClose,
// }: ForgotPasswordProps) {
//   return (
//     <Dialog
//       open={open}
//       onClose={handleClose}
//       slotProps={{
//         paper: {
//           component: 'form',
//           onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
//             event.preventDefault();
//             handleClose();
//           },
//           sx: { backgroundImage: 'none' },
//         },
//       }}
//     >
//       <DialogTitle>Reset password</DialogTitle>

//       <DialogContent
//         sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
//       >
//         <DialogContentText
//           sx={{
//             fontSize: '14px',
//           }}
//         >
//           Enter your account&apos;s email address, and we&apos;ll send you a
//           link to reset your password.
//         </DialogContentText>

//         <TextField
//           autoFocus
//           required
//           margin="dense"
//           id="email"
//           name="email"
//           label="Email address"
//           placeholder="Email address"
//           type="email"
//           fullWidth
//           variant="standard"
//         />
//       </DialogContent>
//       <DialogActions sx={{ pb: 3, px: 3 }}>
//         <Button onClick={handleClose}>Cancel</Button>
//         <Button variant="contained" type="submit">
//           Continue
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }

// src/components/forgot-password.tsx

import * as React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

export default function ForgotPassword({
  open,
  handleClose,
}: ForgotPasswordProps) {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Validate email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setEmail('');
        // Auto close after 3 seconds on success
        setTimeout(() => {
          handleClose();
          setSuccess(false);
        }, 3000);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    if (!loading) {
      setEmail('');
      setError('');
      setSuccess(false);
      handleClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
          Reset Password
        </DialogTitle>

        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <DialogContentText sx={{ fontSize: '14px', color: '#64748b' }}>
            Enter your account's email address, and we'll send you a link to
            reset your password.
          </DialogContentText>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              Password reset email sent! Check your inbox (and spam folder).
            </Alert>
          )}

          <TextField
            autoFocus
            required
            fullWidth
            id="reset-email"
            name="email"
            label="Email Address"
            placeholder="your@email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || success}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <Alert severity="info" sx={{ borderRadius: 2, fontSize: '13px' }}>
            The password reset link will expire in 1 hour for security reasons.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ pb: 3, px: 3, gap: 1 }}>
          <Button
            onClick={handleDialogClose}
            disabled={loading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={loading || success}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              borderRadius: 2,
            }}
          >
            {loading
              ? 'Sending...'
              : success
                ? 'Email Sent!'
                : 'Send Reset Link'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
