import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container, Paper, Typography, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useUI } from '../hooks/useRedux';
import {
  Inventory2 as InventoryIcon,
  BarChart as BarChartIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';

const FEATURES = [
  {
    icon: <InventoryIcon sx={{ fontSize: 18 }} />,
    title: 'Complete Stock Control',
    desc: 'Track every product, batch, and movement across locations.',
  },
  {
    icon: <BarChartIcon sx={{ fontSize: 18 }} />,
    title: 'Intelligent Analytics',
    desc: 'Sales trends, supplier performance, and revenue insights.',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 18 }} />,
    title: 'Role-Based Access',
    desc: 'Admin, Manager, Sales, and Viewer permissions.',
  },
  {
    icon: <SpeedIcon sx={{ fontSize: 18 }} />,
    title: 'Real-Time Updates',
    desc: 'Live stock alerts and low-inventory notifications.',
  },
];

/**
 * AuthLayout Component
 * Premium split-screen layout for login/register pages
 */
export default function AuthLayout() {
  const { darkMode } = useUI();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const isLogin = location.pathname === '/login' || location.pathname === '/';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 1.5, sm: 3 },
        py: { xs: 3, md: 4 },
        position: 'relative',
        overflow: 'hidden',
        background: darkMode
          ? 'linear-gradient(135deg, #0a0f1e 0%, #0d1117 50%, #080d16 100%)'
          : 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #eef2ff 100%)',
      }}
    >
      {/* Animated background blobs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: darkMode
            ? 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          animation: 'blob-move 12s ease-in-out infinite alternate',
          '@keyframes blob-move': {
            '0%': { transform: 'translate(0,0) scale(1)' },
            '100%': { transform: 'translate(5%, 10%) scale(1.1)' },
          },
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          right: '-5%',
          width: '40vw',
          height: '40vw',
          borderRadius: '50%',
          background: darkMode
            ? 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)',
          animation: 'blob-move2 14s ease-in-out infinite alternate',
          '@keyframes blob-move2': {
            '0%': { transform: 'translate(0,0) scale(1)' },
            '100%': { transform: 'translate(-5%, -8%) scale(1.08)' },
          },
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            overflow: 'hidden',
            borderRadius: { xs: 4, md: 5 },
            border: '1px solid',
            borderColor: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.12)',
            backgroundColor: darkMode ? 'rgba(13,17,23,0.90)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(32px)',
            boxShadow: darkMode
              ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)'
              : '0 32px 80px rgba(99,102,241,0.12), 0 0 0 1px rgba(255,255,255,0.8)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              minHeight: { xs: 'auto', md: 680 },
            }}
          >
            {/* ── LEFT PANEL ── */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: { md: 5, lg: 6 },
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 75%, #0f172a 100%)',
              }}
            >
              {/* Grid dot texture */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                  pointerEvents: 'none',
                }}
              />

              {/* Top glow */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '-60px',
                  right: '-60px',
                  width: 280,
                  height: 280,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '-40px',
                  left: '-40px',
                  width: 220,
                  height: 220,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(20,184,166,0.3) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Brand */}
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6366f1, #14b8a6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(99,102,241,0.5)',
                    }}
                  >
                    <InventoryIcon sx={{ color: '#fff', fontSize: 22 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}
                  >
                    Atlas Inventory
                  </Typography>
                </Stack>

                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.15,
                    mb: 2,
                    fontSize: { md: '2rem', lg: '2.4rem' },
                  }}
                >
                  Inventory software built for{' '}
                  <Box
                    component="span"
                    sx={{
                      background: 'linear-gradient(90deg, #a5b4fc, #34d399)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    serious operations.
                  </Box>
                </Typography>

                <Typography
                  sx={{
                    color: 'rgba(255,255,255,0.55)',
                    lineHeight: 1.75,
                    fontSize: '0.9rem',
                    maxWidth: 380,
                    mb: 4,
                  }}
                >
                  Manage stock, purchasing, sales, analytics, and users from one enterprise-grade platform.
                </Typography>

                {/* Feature list */}
                <Stack spacing={2}>
                  {FEATURES.map((f) => (
                    <Box
                      key={f.title}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'flex-start',
                        p: 1.75,
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        backdropFilter: 'blur(4px)',
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          background: 'rgba(255,255,255,0.07)',
                          borderColor: 'rgba(99,102,241,0.3)',
                          transform: 'translateX(5px)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '8px',
                          background: 'rgba(99,102,241,0.2)',
                          border: '1px solid rgba(99,102,241,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: '#a5b4fc',
                        }}
                      >
                        {f.icon}
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: '#e2e8f0', mb: 0.25 }}
                        >
                          {f.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}
                        >
                          {f.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>

              {/* Bottom badge */}
              <Box sx={{ position: 'relative', zIndex: 1, mt: 4 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 0.75,
                    borderRadius: '20px',
                    background: 'rgba(52,211,153,0.12)',
                    border: '1px solid rgba(52,211,153,0.25)',
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: '#34d399',
                      boxShadow: '0 0 8px rgba(52,211,153,0.8)',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%,100%': { opacity: 1 },
                        '50%': { opacity: 0.4 },
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600 }}>
                    System Live — All services operational
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* ── RIGHT PANEL — form ── */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                p: { xs: 3, sm: 4, md: 5, lg: 6 },
              }}
            >
              {/* Mobile-only brand header */}
              {isMobile && (
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '9px',
                      background: 'linear-gradient(135deg, #6366f1, #14b8a6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <InventoryIcon sx={{ color: '#fff', fontSize: 20 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Atlas Inventory
                  </Typography>
                </Stack>
              )}

              <Outlet />
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 3, opacity: 0.6 }}
        >
          © {new Date().getFullYear()} Atlas Inventory System. Enterprise Edition.
        </Typography>
      </Container>
    </Box>
  );
}
