import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Button, Card, CircularProgress, TextField, Typography, InputAdornment, IconButton, Stepper, Step, StepLabel } from '@mui/material';
import { EmailOutlined, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

const steps = ['Identify Account', 'Verify Identity', 'Reset Password'];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleIdentify = async (event) => {
    event.preventDefault();
    if (!email.trim()) return toast.error('Enter a valid email address');
    try {
      setIsSubmitting(true);
      const response = await authAPI.forgotPassword(email);
      if (response.success) {
        setSecurityQuestion(response.data.securityQuestion);
        setActiveStep(1);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to initiate recovery');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!recoveryCode.trim() || !securityAnswer.trim()) {
      return toast.error('Both recovery code and security answer are required.');
    }
    try {
      setIsSubmitting(true);
      const response = await authAPI.verifyRecovery({ email, recoveryCode, securityAnswer });
      if (response.success) {
        setResetToken(response.data.resetToken);
        setActiveStep(2);
      }
    } catch (error) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    if (passwords.password !== passwords.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      setIsSubmitting(true);
      const response = await authAPI.resetPassword(resetToken, passwords.password, passwords.confirmPassword);
      if (response.success) {
        setActiveStep(3);
        toast.success('Password reset successful');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, width: '100%', maxWidth: 500, margin: 'auto' }}>
      <Typography variant="overline" sx={{ letterSpacing: '0.18em', color: 'text.secondary', display: 'block', textAlign: 'center', mb: 1 }}>
        Account Recovery
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Box component="form" onSubmit={handleIdentify} sx={{ display: 'grid', gap: 2.2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Enter your registered email address to start the recovery process.
          </Typography>
          <TextField
            fullWidth
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{ startAdornment: <EmailOutlined sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Continue'}
          </Button>
        </Box>
      )}

      {activeStep === 1 && (
        <Box component="form" onSubmit={handleVerify} sx={{ display: 'grid', gap: 2.2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Answer your security question and provide your recovery code.
          </Typography>
          
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {securityQuestion}
          </Typography>
          
          <TextField
            fullWidth
            label="Security Answer"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
          />
          
          <TextField
            fullWidth
            label="Recovery Code"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
          />
          
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Verify Identity'}
          </Button>
          <Button variant="text" onClick={() => setActiveStep(0)}>Back</Button>
        </Box>
      )}

      {activeStep === 2 && (
        <Box component="form" onSubmit={handleReset} sx={{ display: 'grid', gap: 2.2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Create a new secure password.
          </Typography>
          
          <TextField
            fullWidth
            label="New password"
            type={showPassword ? 'text' : 'password'}
            value={passwords.password}
            onChange={(e) => setPasswords((current) => ({ ...current, password: e.target.value }))}
            InputProps={{
              startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords((current) => ({ ...current, confirmPassword: e.target.value }))}
            InputProps={{ startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />

          <Typography variant="caption" color="text.secondary">
            Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.
          </Typography>

          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Reset Password'}
          </Button>
        </Box>
      )}

      {activeStep === 3 && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: 'success.main' }}>
            Password Reset Successful!
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Your password has been changed successfully. You can now log in with your new password.
          </Typography>
          <Button component={Link} to="/login" variant="contained" size="large">
            Go to Login
          </Button>
        </Box>
      )}

      {activeStep < 3 && (
        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
          Remembered your password? <Link to="/login">Back to login</Link>
        </Typography>
      )}
    </Card>
  );
}
