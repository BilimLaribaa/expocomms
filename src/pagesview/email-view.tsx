// src/pagesview/email-view.tsx
import 'react-quill/dist/quill.snow.css';

import ReactQuill from 'react-quill';
import dayjs, { Dayjs } from 'dayjs';
import ReactApexChart from 'react-apexcharts';     
import React, { useEffect, useState, useRef } from 'react';

import SendIcon from '@mui/icons-material/Send';  
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { DateTimePickerSlotProps } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
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
  Modal,
  IconButton,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  InputAdornment,
  Chip,
  Card,
  CardContent,
  Grid,
  Checkbox,
  FormControlLabel,
  Tabs,
  Tab,
  Badge,
  Tooltip,
} from '@mui/material';

interface EmailLog {
  id: number;
  emails: string[];
  subject: string;
  message: string;
  sent_at: string;
}

interface ScheduledEmail {
  id: number;
  emails: string[];
  subject: string;
  message: string;
  scheduled_at: string;
  status: string;
  created_at: string;
}

interface EmailDeliveryLog {
  id: number;
  email_log_id: number;
  recipient_email: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sent_at: string;
  delivered_at: string;
  failed_at: string;
  error_message: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
  subject: string;
  message: string;
}

interface DeliveryStats {
  status: string;
  count: number;
}

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  organization_name: string;
  job_title: string;
  is_favorite: boolean;
}

const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

export default function EmailViewPage() {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<EmailDeliveryLog[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduledLoading, setScheduledLoading] = useState(true);
  const [deliveryLoading, setDeliveryLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);

  // composer fields (shared with modal)
  const [emails, setEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);

  const [sending, setSending] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // UI state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [deliveryTrackingOpen, setDeliveryTrackingOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Dayjs | null>(dayjs());
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadHistory();
    loadScheduledEmails();
    loadDeliveryStats();
    loadContacts();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/email-history');
      const data = await res.json();
      setEmailLogs(data || []);
    } catch (err) {
      console.error('Error loading email logs:', err);
      setSnackbar({ open: true, message: 'Failed to load email history', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function loadContacts() {
    setContactsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/contacts');
      const data = await res.json();
      setContacts(data || []);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setSnackbar({ open: true, message: 'Failed to load contacts', severity: 'error' });
    } finally {
      setContactsLoading(false);
    }
  }

  async function loadScheduledEmails() {
    setScheduledLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/scheduled-emails');
      const data = await res.json();
      setScheduledEmails(data || []);
    } catch (err) {
      console.error('Error loading scheduled emails:', err);
      setSnackbar({ open: true, message: 'Failed to load scheduled emails', severity: 'error' });
    } finally {
      setScheduledLoading(false);
    }
  }

  async function loadDeliveryStats() {
    setStatsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/email-delivery-stats');
      const data = await res.json();
      setDeliveryStats(data || []);
    } catch (err) {
      console.error('Error loading delivery stats:', err);
      setSnackbar({ open: true, message: 'Failed to load delivery statistics', severity: 'error' });
    } finally {
      setStatsLoading(false);
    }
  }

  async function loadDeliveryLogs(emailLogId: number) {
    setDeliveryLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/email-delivery-status/${emailLogId}`);
      const data = await res.json();
      setDeliveryLogs(data || []);
    } catch (err) {
      console.error('Error loading delivery logs:', err);
      setSnackbar({ open: true, message: 'Failed to load delivery logs', severity: 'error' });
    } finally {
      setDeliveryLoading(false);
    }
  }

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact =>
    contact.full_name.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.organization_name.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );

  // Handle contact selection
  const handleContactToggle = (contact: Contact) => {
    setSelectedContacts(prev => {
      const isSelected = prev.find(c => c.id === contact.id);
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id);
      } else {
        return [...prev, contact];
      }
    });
  };

  // Update emails field when contacts are selected/deselected
  useEffect(() => {
    const emailList = selectedContacts.map(contact => contact.email).filter(email => email);
    setEmails(emailList.join(', '));
  }, [selectedContacts]);

  // core send function. scheduledISO optional (ISO string).
  const handleSendEmail = async (scheduledISO?: string | null, createCron = true) => {
    if (!subject.trim()) {
      setSnackbar({ open: true, message: 'Subject is required.', severity: 'error' });
      return;
    }

    setSending(true);
    try {
      const sendEmail = async () => {
  const csrfToken = await getCsrfToken(); // ✅ Await the token
      const formData = new FormData();
      // If you allow passing arrays of emails from the UI, you can also send as CSV.
      formData.append('emails', emails);
      formData.append('subject', subject);
      formData.append('message', message);

      if (scheduledISO) {
        formData.append('scheduledTime', scheduledISO);
      }

      // createCron flag: ask backend to record job even if sending now
      formData.append('createCron', createCron ? '1' : '0');

      // append attachments as multiple 'attachments' fields
      attachments.forEach((file) => formData.append('attachments', file));

      const res = await fetch('http://localhost:3001/api/send-bulk-email', {
         method: "POST",
    body: formData,
    credentials: 'include', // ✅ Send cookies
    headers: {
      "X-CSRF-Token": csrfToken // ✅ Required
    },
  });
  

      const result = await res.json();

      if (res.ok) {
        setSnackbar({
          open: true,
          message: result.message || 'Emails processed',
          severity: 'success',
        });
        // clear only on success
        setEmails('');
        setSubject('');
        setMessage('');
        setAttachments([]);
        setSelectedContacts([]);
                 setComposerOpen(false);
         setScheduleOpen(false);
         await loadHistory();
         await loadScheduledEmails();
         await loadDeliveryStats();
      } else {
        setSnackbar({ open: true, message: result.error || 'Failed to send', severity: 'error' });
      }
    };
          await sendEmail(); // ✅ You must call the function here

    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Server error', severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  // file input handling & validation
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(
      (f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE_MB * 1024 * 1024
    );

    if (attachments.length + valid.length > MAX_ATTACHMENTS) {
      setSnackbar({
        open: true,
        message: `Max ${MAX_ATTACHMENTS} attachments allowed.`,
        severity: 'error',
      });
      return;
    }
    setAttachments((prev) => [...prev, ...valid]);
    // reset native file input so same-file can be selected again later
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const saveDraft = () => {
    const draft = { emails, subject, message };
    localStorage.setItem('draft_email', JSON.stringify(draft));
    setSnackbar({ open: true, message: 'Draft saved.', severity: 'success' });
  };

  const loadDraft = () => {
    const raw = localStorage.getItem('draft_email');
    if (!raw) {
      setSnackbar({ open: true, message: 'No draft found.', severity: 'info' });
      return;
    }
    const parsed = JSON.parse(raw);
    setEmails(parsed.emails || '');
    setSubject(parsed.subject || '');
    setMessage(parsed.message || '');
    setSnackbar({ open: true, message: 'Draft loaded.', severity: 'success' });
  };

  // CSRF token fetch (e.g., React frontend)
const getCsrfToken = async () => {
  const res = await fetch('http://localhost:3001/api/csrf-token', {
    credentials: 'include' // ✅ Sends the cookie
  });
  const data = await res.json();
  return data.csrfToken;
};


  const cancelScheduledEmail = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/scheduled-emails/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setSnackbar({ open: true, message: 'Scheduled email cancelled successfully', severity: 'success' });
        await loadScheduledEmails();
      } else {
        const result = await res.json();
        setSnackbar({ open: true, message: result.error || 'Failed to cancel email', severity: 'error' });
      }
    } catch (err) {
      console.error('Error cancelling scheduled email:', err);
      setSnackbar({ open: true, message: 'Failed to cancel scheduled email', severity: 'error' });
    }
  };

  // Helper functions for status colors and labels
  // For Chips (MUI palette keys)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'sent': return 'primary';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'bounced': return 'error';
      default: return 'default';
    }
  };

  // For ApexCharts (hex colors)
  const getStatusHexColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'sent': return '#2196F3';
      case 'pending': return '#9E9E9E';
      case 'failed': return '#F44336';
      case 'bounced': return '#FF9800';
      default: return '#BDBDBD';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'sent': return 'Sent';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      case 'bounced': return 'Bounced';
      default: return status;
    }
  };

  // Pie chart options for delivery statistics
  const pieChartOptions = {
    chart: {
      type: 'pie' as const,
    },
    labels: deliveryStats.map(stat => getStatusLabel(stat.status)),
    colors: deliveryStats.map(stat => getStatusHexColor(stat.status)),
    legend: {
      position: 'bottom' as const,
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const pieChartSeries = deliveryStats.map(stat => stat.count);

  const handleOpenDeliveryTracking = () => {
    setDeliveryTrackingOpen(true);
    loadDeliveryStats();
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      

      {/* Contact Sidebar */}
      <Box sx={{ 
        width: '300px', 
        bgcolor: 'background.paper',
        borderRight: 1, 
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}>
        {/* Header */}
        <Box sx={{ 
          p: 3, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            mb: 2,
            color: 'text.primary',
            fontSize: '1.1rem'
          }}>
            Contacts
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search contacts..."
            value={contactSearchTerm}
            onChange={(e) => setContactSearchTerm(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'grey.50',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
                '&.Mui-focused': {
                  bgcolor: 'white',
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {/* Contact List */}
        <Box sx={{ 
          flex: 1,
          overflowY: 'auto',
          bgcolor: 'grey.50'
        }}>
          {contactsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
              <CircularProgress size={32} />
            </Box>
          ) : filteredContacts.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" p={4}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {contactSearchTerm ? 'No contacts found' : 'No contacts available'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredContacts.map((contact) => {
                const isSelected = selectedContacts.find(c => c.id === contact.id);
                return (
                  <ListItem
                    key={contact.id}
                    onClick={() => handleContactToggle(contact)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      mx: 1,
                      my: 0.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      bgcolor: isSelected ? 'primary.main' : 'transparent',
                      color: isSelected ? 'white' : 'text.primary',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: isSelected ? 'primary.dark' : 'grey.200',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      },
                      '& .MuiListItemText-primary': {
                        fontWeight: isSelected ? 600 : 500,
                        fontSize: '0.9rem',
                      },
                      '& .MuiListItemText-secondary': {
                        color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                        fontSize: '0.8rem',
                      }
                    }}
                  >
                    <Checkbox
                      checked={!!isSelected}
                      size="small"
                      sx={{ 
                        mr: 1,
                        color: isSelected ? 'white' : 'primary.main',
                        '&.Mui-checked': {
                          color: isSelected ? 'white' : 'primary.main',
                        }
                      }}
                    />
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32,
                          bgcolor: contact.is_favorite ? 'warning.main' : (isSelected ? 'white' : 'primary.main'),
                          color: contact.is_favorite ? 'white' : (isSelected ? 'primary.main' : 'white'),
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        {contact.first_name?.charAt(0).toUpperCase() || ''}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={contact.full_name}
                      secondary={
                        <Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.75rem',
                              lineHeight: 1.2,
                              mb: 0.5
                            }}
                          >
                            {contact.email}
                          </Typography>
                          {contact.organization_name && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.7rem',
                                opacity: 0.8
                              }}
                            >
                              {contact.organization_name}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
        
        {/* Footer with selected count */}
        {selectedContacts.length > 0 && (
          <Box sx={{ 
            p: 2, 
            borderTop: 1, 
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 -1px 3px rgba(0,0,0,0.1)'
          }}>
            <Typography variant="body2" sx={{ 
              textAlign: 'center',
              fontWeight: 500,
              color: 'primary.main'
            }}>
              {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
            </Typography>
          </Box>
        )}
      </Box>

      {/* Email Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Email
            </Typography>
            <Box display="flex" gap={2}>
              <Button 
                variant="outlined" 
                startIcon={<AnalyticsIcon />}
                onClick={handleOpenDeliveryTracking}
              >
                Delivery Tracking
              </Button>
              <Button 
                variant="contained" 
                startIcon={<SendIcon />}
                onClick={() => setComposerOpen(true)}
              >
                Compose Email
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Email Content */}
        <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
          {/* Selected Contacts Display */}
          {selectedContacts.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Selected Recipients ({selectedContacts.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedContacts.map((contact) => (
                    <Chip
                      key={contact.id}
                      label={contact.full_name}
                      onDelete={() => handleContactToggle(contact)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Email History with Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label={`Sent Emails (${emailLogs.length})`} />
              <Tab label={`Scheduled (${scheduledEmails.length})`} />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Sent Emails History
              </Typography>

              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
                  <CircularProgress />
                </Box>
              ) : (
                                 <TableContainer component={Paper}>
                   <Table size="small">
                     <TableHead>
                       <TableRow>
                         <TableCell>ID</TableCell>
                         <TableCell>Recipients</TableCell>
                         <TableCell>Subject</TableCell>
                         <TableCell>Message</TableCell>
                         <TableCell>Sent At</TableCell>
                         <TableCell>Actions</TableCell>
                       </TableRow>
                     </TableHead>
                     <TableBody>
                       {emailLogs.map((log) => (
                         <TableRow key={log.id}>
                           <TableCell>{log.id}</TableCell>
                           <TableCell>{log.emails.join(', ')}</TableCell>
                           <TableCell>{log.subject}</TableCell>
                           <TableCell>
                             <div dangerouslySetInnerHTML={{ __html: log.message }} />
                           </TableCell>
                           <TableCell>{new Date(log.sent_at).toLocaleString()}</TableCell>
                           <TableCell>
                             <Button
                               size="small"
                               variant="outlined"
                               onClick={() => {
                                 setDeliveryTrackingOpen(true);
                                 loadDeliveryLogs(log.id);
                               }}
                             >
                               View Status
                             </Button>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </TableContainer>
              )}
            </>
          )}

          {activeTab === 1 && (
            <>
              <Typography variant="h6" gutterBottom>
                Scheduled Emails
              </Typography>

              {scheduledLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Recipients</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Message</TableCell>
                        <TableCell>Scheduled For</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scheduledEmails.map((email) => (
                        <TableRow key={email.id}>
                          <TableCell>{email.id}</TableCell>
                          <TableCell>{email.emails.join(', ')}</TableCell>
                          <TableCell>{email.subject}</TableCell>
                          <TableCell>
                            <div dangerouslySetInnerHTML={{ __html: email.message }} />
                          </TableCell>
                          <TableCell>{new Date(email.scheduled_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => cancelScheduledEmail(email.id)}
                            >
                              Cancel
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
                     )}


         </Box>
       </Box>

      {/* Composer Modal */}
      <Modal open={composerOpen} onClose={() => setComposerOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            maxWidth: 980,
            bgcolor: 'background.paper',
            p: 3,
            boxShadow: 24,
            overflowY: 'auto',
            maxHeight: '90%',
            borderRadius: 2,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Compose Email</Typography>
            <IconButton onClick={() => setComposerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Box display="flex" flexDirection="column" gap={2} mb={2}>
            <TextField
              label="Recipient Emails (comma separated)"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              fullWidth
              helperText={`${selectedContacts.length} contact(s) selected`}
            />
            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
            />

            {/* Rich editor */}
            <ReactQuill
              value={message}
              onChange={setMessage}
              theme="snow"
              style={{ minHeight: 180, height:"90px" }}
            />

            {/* attachments: hidden input + button */}
            <input
              ref={fileInputRef}
              type="file"
              hidden
              multiple
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              onChange={handleAttachmentChange}
            />
            <Box display="flex" gap={2} alignItems="center" sx={{marginTop:"30px"}}>
              <Button 
                variant="outlined" 
                startIcon={<AttachFileIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Attachments
              </Button>

              <Box>
                {attachments.map((f, i) => (
                  <Stack direction="row" alignItems="center" spacing={1} key={i} sx={{ mb: 0.5 }}>
                    <Typography variant="body2">📎 {f.name}</Typography>
                    <Button size="small" onClick={() => removeAttachment(i)}>
                      Remove
                    </Button>
                  </Stack>
                ))}
              </Box>
            </Box>

            {/* actions */}
            <Box display="flex" gap={2} mt={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={() => handleSendEmail(undefined, true)} // send now but still create cron record
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send Now'}
              </Button>

              <Button 
                variant="outlined" 
                startIcon={<ScheduleIcon />}
                onClick={() => setScheduleOpen(true)}
              >
                Schedule
              </Button>

              <Button onClick={saveDraft}>Save Draft</Button>
              <Button onClick={loadDraft}>Load Draft</Button>
              <Button onClick={() => setPreviewOpen(true)}>Preview</Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Schedule modal (date-time picker) */}
      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 420,
            bgcolor: 'background.paper',
            p: 3,
            boxShadow: 24,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Schedule Email
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
  value={scheduledTime}
  onChange={(v) => setScheduledTime(v)}
  slotProps={{
    textField: {
      fullWidth: true,
    },
  }}
/>
          </LocalizationProvider>

          <Box display="flex" gap={2} mt={2}>
            <Button
              variant="contained"
              onClick={() => {
                if (!scheduledTime) {
                  setSnackbar({ open: true, message: 'Pick a date/time first', severity: 'error' });
                  return;
                }
                handleSendEmail(scheduledTime.toISOString(), true); // schedule via backend
              }}
            >
              Schedule Email
            </Button>

            <Button onClick={() => setScheduleOpen(false)}>Cancel</Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity as 'success' | 'error'}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Delivery Tracking Modal */}
      <Modal open={deliveryTrackingOpen} onClose={() => setDeliveryTrackingOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: 1200,
            bgcolor: 'background.paper',
            p: 3,
            boxShadow: 24,
            overflowY: 'auto',
            maxHeight: '90%',
            borderRadius: 2,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Email Delivery Status & Analytics
            </Typography>
            <IconButton onClick={() => setDeliveryTrackingOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {/* Delivery Statistics Pie Chart */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Delivery Statistics
              </Typography>
              {statsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : deliveryStats.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No delivery data available
                </Typography>
              ) : (
                <Box sx={{ height: 300 }}>
                  <ReactApexChart
                    options={pieChartOptions}
                    series={pieChartSeries}
                    type="pie"
                    height={300}
                  />
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Delivery Logs Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Delivery Logs
              </Typography>
              {deliveryLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : deliveryLogs.length === 0 ? (
                                 <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                   Click &quot;View Status&quot; on any sent email to see delivery logs
                 </Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Recipient</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Sent At</TableCell>
                        <TableCell>Delivered At</TableCell>
                        <TableCell>Failed At</TableCell>
                        <TableCell>Error Message</TableCell>
                        <TableCell>Retry Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deliveryLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{log.recipient_email}</TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(log.status)}
                              color={getStatusColor(log.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {log.sent_at ? new Date(log.sent_at).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            {log.delivered_at ? new Date(log.delivered_at).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            {log.failed_at ? new Date(log.failed_at).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            {log.error_message ? (
                              <Tooltip title={log.error_message}>
                                <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {log.error_message}
                                </Typography>
                              </Tooltip>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{log.retry_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      </Modal>

      {/* Preview modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '80%',
            height: '80%',
            bgcolor: 'background.paper',
            p: 4,
            overflowY: 'auto',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Preview</Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Typography variant="subtitle1">To: {emails}</Typography>
          <Typography variant="subtitle1">Subject: {subject}</Typography>
          <div dangerouslySetInnerHTML={{ __html: message }} />
        </Box>
      </Modal>
    </Box>
  );
}
