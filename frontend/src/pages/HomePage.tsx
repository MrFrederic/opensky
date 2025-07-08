import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
} from '@mui/material';
import {
  People as PeopleIcon,
  Book as BookIcon,
  Build as BuildIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/stores/auth';
import { useUser } from '@/hooks/useUser';
import LoginModal from '@/components/auth/LoginModal';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { user } = useUser();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            Dropzone Management System
          </Typography>
          
          {isAuthenticated && user ? (
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ mb: 8, maxWidth: '3xl', mx: 'auto' }}
            >
              Welcome back, {user.first_name}! Ready for your next jump?
            </Typography>
          ) : (
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ mb: 8, maxWidth: '3xl', mx: 'auto' }}
            >
              Welcome to the comprehensive dropzone management system. 
              Manage tandem bookings, sportsman manifests, equipment tracking, 
              and load management all in one place.
            </Typography>
          )}
          
          <Grid container spacing={4} sx={{ mb: 8 }}>
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  p: 3, 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.light', 
                      mx: 'auto', 
                      mb: 2,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <PeopleIcon />
                  </Avatar>
                  <Typography variant="h6" component="h3" gutterBottom fontWeight="semibold">
                    Tandem Bookings
                  </Typography>
                  <Typography color="text.secondary">
                    Easy online booking system for tandem jumps with calendar integration.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  p: 3, 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.light', 
                      mx: 'auto', 
                      mb: 2,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <BookIcon />
                  </Avatar>
                  <Typography variant="h6" component="h3" gutterBottom fontWeight="semibold">
                    Digital Logbook
                  </Typography>
                  <Typography color="text.secondary">
                    Keep track of all your jumps with detailed digital logbook functionality.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  p: 3, 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.light', 
                      mx: 'auto', 
                      mb: 2,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <BuildIcon />
                  </Avatar>
                  <Typography variant="h6" component="h3" gutterBottom fontWeight="semibold">
                    Equipment Management
                  </Typography>
                  <Typography color="text.secondary">
                    Comprehensive equipment tracking and manifest management system.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {isAuthenticated ? (
              <>
                <Button variant="contained" color="primary" size="large">
                  Dashboard
                </Button>
                <Button variant="outlined" color="primary" size="large">
                  View Manifest
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={() => setLoginModalOpen(true)}
                >
                  Login to Get Started
                </Button>
                <Button variant="outlined" color="primary" size="large">
                  Learn More
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Container>
      
      {/* Login Modal */}
      <LoginModal 
        open={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
    </Box>
  );
};

export default HomePage;
