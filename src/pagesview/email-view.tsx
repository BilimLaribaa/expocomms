import { useEffect, useState } from 'react';

import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';

interface EmailLog {
  id: number;
  emails: string[];
  subject: string;
  message: string;
  sent_at: string;
}

export default function EmailViewPage() {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [emails, setEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch email logs on mount
  useEffect(() => {
    fetch('/api/email-history')
      .then((res) => res.json())
      .then((data) => {
        setEmailLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading email logs:', err);
        setLoading(false);
      });
  }, []);

  // Submit handler
  const handleSendEmail = async () => {
    setSending(true);
    try {
      const response = await fetch('http://localhost:3001/api/send-bulk-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: emails.split(',').map((e) => e.trim()),
          subject,
          message,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSnackbar({ open: true, message: result.message || 'Emails sent!', severity: 'success' });
        setEmails('');
        setSubject('');
        setMessage('');
        // Refresh logs
        const updatedLogs = await fetch('http://localhost:3001/api/email-history').then((res) =>
          res.json()
        );
        setEmailLogs(updatedLogs);
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Failed to send email',
          severity: 'error',
        });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Server error', severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" gutterBottom>
        Send Bulk Email
      </Typography>

      <Box display="flex" flexDirection="column" gap={2} mb={4}>
        <TextField
          label="Recipient Emails (comma separated)"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          fullWidth
          multiline
          rows={4}
          required
        />
        <Button
          variant="contained"
          onClick={handleSendEmail}
          disabled={sending}
          sx={{ width: '200px' }}
        >
          {sending ? 'Sending...' : 'Send Email'}
        </Button>
      </Box>

      <Typography variant="h5" gutterBottom>
        Sent Emails History
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Recipients</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Sent At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {emailLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>{log.emails.join(', ')}</TableCell>
                  <TableCell>{log.subject}</TableCell>
                  <TableCell>{log.message}</TableCell>
                  <TableCell>{new Date(log.sent_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity as 'success' | 'error'}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
