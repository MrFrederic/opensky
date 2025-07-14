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
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom 
            fontWeight="semibold"
            sx={{ fontStyle: 'italic' }}
          >
            Page Not Found
          </Typography>
          
          <Typography color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
            "Well, this is rather awkward..."
          </Typography>
          
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            It appears this page has gone for a bit of a skydive without telling anyone. 
            Rather poor form, if you ask us. We've sent out a search party, but they're 
            currently distracted by tea and biscuits.
          </Typography>
          
          <Typography color="text.secondary" sx={{ mb: 4, fontWeight: 'medium' }}>
            Might we suggest:
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
              Return to Base (Safely)
            </Button>
            <Button
              onClick={() => window.history.back()}
              variant="outlined"
              color="primary"
              size="large"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Attempt Recovery
            </Button>
          </Stack>
          
          <Typography 
            color="text.disabled" 
            sx={{ 
              mt: 4,
              fontSize: '0.75rem',
              fontStyle: 'italic'
            }}
          >
            Note: If this were an actual skydiver, we'd be ever so slightly more concerned.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}