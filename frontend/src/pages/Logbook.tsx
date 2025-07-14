import React from 'react';
import { Container } from '@mui/material';

import { LogbookTable } from '@/components/common';

const LogbookPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ height: "100%", mt: 2, mb: 9 }}>
      <LogbookTable
        title="My Jump History"
        showFilters={true}
        height="100%"
      />
    </Container>
  );
};

export default LogbookPage;
