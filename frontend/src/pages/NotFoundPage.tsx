import { Link } from 'react-router-dom';
import { Box, Container, Typography, Button, Stack } from '@mui/material';

export default function NotFoundPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '6rem', sm: '8rem', md: '10rem' },
              fontWeight: 'bold',
              color: 'text.disabled',
              lineHeight: 1,
              mb: 2,
            }}
          >
            404
          </Typography>
          <Typography variant="h4" component="h2" gutterBottom fontWeight="semibold">
            Page Not Found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Sorry, the page you are looking for doesn't exist or has been moved.
          </Typography>
          
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} justifyContent="center">
            <Button
              component={Link}
              to="/"
              variant="contained"
              color="primary"
              size="large"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Go to Homepage
            </Button>
            <Button
              onClick={() => window.history.back()}
              variant="outlined"
              color="primary"
              size="large"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Go Back
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
