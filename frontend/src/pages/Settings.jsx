import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
} from '@mui/material';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { authAPI } from '../services/api';
import { updateUser } from '../redux/slices/authSlice';
import { setDarkMode } from '../redux/slices/uiSlice';
import apiClient from '../services/apiClient';
import axios from 'axios';

export default function Settings() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.ui);
  
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    profilePicture: '',
    companyName: 'Enterprise SaaS Inventory',
    companyEmail: 'info@company.com',
    companyPhone: '1234567890',
    companyAddress: '123 SaaS Street',
    currency: 'INR',
    taxRate: 18,
    taxName: 'GST',
    emailNotifications: true,
  });

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  const [securitySetup, setSecuritySetup] = useState({
    currentPassword: '',
    securityQuestion: 'What was the name of your first school?',
    securityAnswer: '',
  });
  const [recoveryCode, setRecoveryCode] = useState(null);

  // Load backend and profile settings
  const loadSettingsAndProfile = async () => {
    try {
      const res = await apiClient.get('/settings');
      if (res.success) {
        setProfile((prev) => ({
          ...prev,
          fullName: user?.fullName || '',
          phone: user?.phone || '',
          profilePicture: user?.profilePicture || '',
          companyName: res.data.companyName || 'Enterprise SaaS Inventory',
          companyEmail: res.data.companyEmail || '',
          companyPhone: res.data.companyPhone || '',
          companyAddress: res.data.companyAddress || '',
          currency: res.data.currency || 'INR',
          taxRate: res.data.taxRate || 18,
          taxName: res.data.taxName || 'GST',
        }));
      }
    } catch (err) {
      console.error('Failed to load global settings', err);
    }
  };

  useEffect(() => {
    loadSettingsAndProfile();
  }, [user]);

  const handleProfileSave = async () => {
    try {
      // 1. Update user profile information
      const userRes = await authAPI.updateProfile({
        fullName: profile.fullName,
        phone: profile.phone,
        profilePicture: profile.profilePicture,
      });

      // 2. Update SaaS company settings in DB
      const settingsRes = await apiClient.put('/settings', {
        companyName: profile.companyName,
        companyEmail: profile.companyEmail,
        companyPhone: profile.companyPhone,
        companyAddress: profile.companyAddress,
        currency: profile.currency,
        taxRate: Number(profile.taxRate),
        taxName: profile.taxName,
      });

      if (userRes.success && settingsRes.success) {
        dispatch(updateUser(userRes.data.user));
        toast.success('Settings and profile updated successfully');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update settings');
    }
  };

  const handlePasswordChange = async () => {
    try {
      const response = await authAPI.changePassword(passwords);
      if (response.success) {
        setPasswords({ currentPassword: '', newPassword: '' });
        toast.success('Password changed successfully');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    }
  };

  const handleSecuritySetup = async () => {
    if (!securitySetup.currentPassword || !securitySetup.securityAnswer) {
      toast.error('Password and Security Answer are required.');
      return;
    }
    try {
      const response = await authAPI.setupSecurity(securitySetup);
      if (response.success) {
        setRecoveryCode(response.data.recoveryCode);
        setSecuritySetup({ ...securitySetup, currentPassword: '', securityAnswer: '' });
        toast.success('Security recovery configured successfully.');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to configure security recovery');
    }
  };

  // Download database backup file
  const handleDownloadBackup = async () => {
    try {
      toast.info('Generating database backup...');
      const token = localStorage.getItem('accessToken');
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await axios.get(`${apiUrl}/settings/backup`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `database_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Backup downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate database backup');
      console.error(error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>Settings</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Profile & Company Settings</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Full Name" value={profile.fullName} onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone" value={profile.phone} onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Profile Picture URL" value={profile.profilePicture} onChange={(e) => setProfile((prev) => ({ ...prev, profilePicture: e.target.value }))} />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 700 }}>GLOBAL BUSINESS SETTINGS</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Company Name" value={profile.companyName} onChange={(e) => setProfile((prev) => ({ ...prev, companyName: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Company Email" value={profile.companyEmail} onChange={(e) => setProfile((prev) => ({ ...prev, companyEmail: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Company Phone" value={profile.companyPhone} onChange={(e) => setProfile((prev) => ({ ...prev, companyPhone: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Company Address" value={profile.companyAddress} onChange={(e) => setProfile((prev) => ({ ...prev, companyAddress: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Currency (e.g. INR)" value={profile.currency} onChange={(e) => setProfile((prev) => ({ ...prev, currency: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Tax Name (e.g. GST)" value={profile.taxName} onChange={(e) => setProfile((prev) => ({ ...prev, taxName: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="number" label="Tax Rate (%)" value={profile.taxRate} onChange={(e) => setProfile((prev) => ({ ...prev, taxRate: e.target.value }))} />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch checked={profile.emailNotifications} onChange={(e) => setProfile((prev) => ({ ...prev, emailNotifications: e.target.checked }))} />}
                    label="Email Notifications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleProfileSave} sx={{ px: 4 }}>Save Configuration</Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Security & Preferences</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Current Password" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords((prev) => ({ ...prev, currentPassword: e.target.value }))} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="New Password" type="password" value={passwords.newPassword} onChange={(e) => setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))} />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handlePasswordChange}>Change Password</Button>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" sx={{ mb: 2 }}>Account Recovery Setup</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Configure a security question and generate a recovery code. These will be required if you ever forget your password.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Current Password" 
                    type="password" 
                    value={securitySetup.currentPassword} 
                    onChange={(e) => setSecuritySetup((prev) => ({ ...prev, currentPassword: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    select 
                    SelectProps={{ native: true }}
                    label="Security Question" 
                    value={securitySetup.securityQuestion} 
                    onChange={(e) => setSecuritySetup((prev) => ({ ...prev, securityQuestion: e.target.value }))}
                  >
                    <option value="What was the name of your first school?">What was the name of your first school?</option>
                    <option value="What was the name of your first teacher?">What was the name of your first teacher?</option>
                    <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                    <option value="What was the first place you traveled to?">What was the first place you traveled to?</option>
                    <option value="What was the name of your childhood best friend?">What was the name of your childhood best friend?</option>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Security Answer" 
                    value={securitySetup.securityAnswer} 
                    onChange={(e) => setSecuritySetup((prev) => ({ ...prev, securityAnswer: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" color="primary" onClick={handleSecuritySetup}>Generate Recovery Code</Button>
                </Grid>
                {recoveryCode && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: 'warning.contrastText', fontWeight: 'bold' }}>
                        SAVE THIS RECOVERY CODE NOW:
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', mt: 1, wordBreak: 'break-all' }}>
                        {recoveryCode}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                        This code will NEVER be displayed again. You will need it to recover your account.
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>Display Settings</Typography>
              <FormControlLabel
                control={<Switch checked={darkMode} onChange={(e) => dispatch(setDarkMode(e.target.checked))} />}
                label="Dark Mode"
              />
              <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip label={`Company: ${profile.companyName || 'N/A'}`} size="small" />
                <Chip label={`Currency: ${profile.currency}`} size="small" />
                <Chip label={`Tax: ${profile.taxRate}% ${profile.taxName}`} size="small" />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>Database Administration</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Securely backup all MongoDB collections (Products, Sales, Users, Suppliers, Invoices, logs) as a formatted JSON document.
              </Typography>
              <Button variant="contained" color="secondary" onClick={handleDownloadBackup} sx={{ textTransform: 'none' }}>
                Download System Backup (.json)
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}