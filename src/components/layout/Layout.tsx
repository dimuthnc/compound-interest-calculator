import type { PropsWithChildren } from "react";
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';

export function Layout({ children }: PropsWithChildren) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="primary" enableColorOnDark>
        <Toolbar sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Effective Interest Rate Calculator
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Model deposits and withdrawals; calculate IRR & simple annual returns.
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
        <Box display="flex" flexDirection="column" gap={4}>
          {children}
        </Box>
      </Container>
    </Box>
  );
}

export default Layout;
