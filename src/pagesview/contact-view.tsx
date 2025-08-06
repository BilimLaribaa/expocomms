import type { GridColDef } from '@mui/x-data-grid';

import dayjs from 'dayjs';
import { useState, useEffect } from 'react';

import { AlertColor } from '@mui/material/Alert';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Alert as MuiAlert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';

type Contact = {
  id: number | null;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  alternate_phone: string;
  email: string;
  gender: string;
  date_of_birth: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  contact_type: string;
  organization_name: string;
  job_title: string;
  department: string;
  website: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  relationship: string;
  notes: string;
  is_favorite: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function ContactView() {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [formData, setFormData] = useState<Contact>({
    id: null,
    full_name: '',
    first_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    middle_name: '',
    last_name: '',
    alternate_phone: '',
    gender: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    contact_type: '',
    organization_name: '',
    job_title: '',
    department: '',
    website: '',
    linkedin: '',
    facebook: '',
    instagram: '',
    relationship: '',
    is_favorite: false,
    notes: '',
    is_active: true,
    created_at: '',
    updated_at: '',
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetch('https://countriesnow.space/api/v0.1/countries/positions')
      .then((res) => res.json())
      .then((data) => setCountries(data.data))
      .catch((err) => console.error('Failed to fetch countries:', err));
  }, []);

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedCountry = e.target.value;
    setFormData({ ...formData, country: selectedCountry, state: '', city: '' });

    fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: selectedCountry }),
    })
      .then((res) => res.json())
      .then((data) => setStates(data.data.states))
      .catch((err) => console.error('Failed to fetch states:', err));
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedState = e.target.value;
    setFormData({ ...formData, state: selectedState, city: '' });

    fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: formData.country, state: selectedState }),
    })
      .then((res) => res.json())
      .then((data) => setCities(data.data))
      .catch((err) => console.error('Failed to fetch cities:', err));
  };

  const handleClickOpen = () => {
    setFormData({
      id: null,
      full_name: '',
      first_name: '',
      email: '',
      phone: '',
      whatsapp: '',
      middle_name: '',
      last_name: '',
      alternate_phone: '',
      gender: '',
      date_of_birth: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      contact_type: '',
      organization_name: '',
      job_title: '',
      department: '',
      website: '',
      linkedin: '',
      facebook: '',
      instagram: '',
      relationship: '',
      is_favorite: false,
      notes: '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = () => {
    fetch('http://localhost:3001/api/contacts')
      .then((res) => res.json())
      .then((data) => setContacts(data))
      .catch((err) => console.error('Failed to fetch contacts:', err));
  };

  const handleOpen = (contact = null) => {
    setFormData(
      contact || {
        id: null,
        full_name: '',
        first_name: '',
        email: '',
        phone: '',
        whatsapp: '',
        middle_name: '',
        last_name: '',
        alternate_phone: '',
        gender: '',
        date_of_birth: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        contact_type: '',
        organization_name: '',
        job_title: '',
        department: '',
        website: '',
        linkedin: '',
        facebook: '',
        instagram: '',
        relationship: '',
        is_favorite: false,
        notes: '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    fetch(`http://localhost:3001/api/contacts/${id}`, { method: 'DELETE' })
      .then(() => {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        setSnackbar({ open: true, message: 'Contact deleted!', severity: 'success' });
      })
      .catch((err) => {
        console.error('Failed to delete contact:', err);
        setSnackbar({ open: true, message: 'Failed to delete contact', severity: 'error' });
      });
  };

  const handleSubmit = async () => {
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id
        ? `http://localhost:3001/api/contacts/${formData.id}`
        : 'http://localhost:3001/api/contacts';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();

      if (!res.ok) throw new Error(resData.error || 'Failed to save contact');

      const msg = formData.id ? 'Contact updated!' : 'Contact added!';
      setSnackbar({ open: true, message: msg, severity: 'success' });
      handleClose();
      fetchContacts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong!';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', minWidth: 70, headerAlign: 'center', align: 'center' },
    {
      field: 'first_name',
      headerName: 'First Name',
      flex: 1,
      minWidth: 120,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'middle_name',
      headerName: 'Middle Name',
      flex: 1,
      minWidth: 120,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'last_name',
      headerName: 'Last Name',
      flex: 1,
      minWidth: 120,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'full_name',
      headerName: 'Full Name',
      flex: 1,
      minWidth: 140,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'phone',
      headerName: 'Mobile Number',
      flex: 1,
      minWidth: 130,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'alternate_phone',
      headerName: 'Alternate Mobile Number',
      flex: 1,
      minWidth: 160,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 180,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'gender',
      headerName: 'Gender',
      flex: 1,
      minWidth: 100,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'date_of_birth',
      headerName: 'Date of Birth',
      flex: 1,
      minWidth: 120,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 1,
      minWidth: 200,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'city',
      headerName: 'City',
      flex: 1,
      minWidth: 120,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'state',
      headerName: 'State',
      flex: 1,
      minWidth: 120,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'postal_code',
      headerName: 'Postal Code',
      flex: 1,
      minWidth: 120,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'country',
      headerName: 'Country',
      type: 'string',
      flex: 1,
      minWidth: 120,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'contact_type',
      headerName: 'Contact Type',
      flex: 1,
      minWidth: 140,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'organization_name',
      headerName: 'Organization Name',
      flex: 1,
      minWidth: 150,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'job_title',
      headerName: 'Job Title',
      flex: 1,
      minWidth: 140,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'department',
      headerName: 'Department',
      flex: 1,
      minWidth: 140,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'website',
      headerName: 'Website',
      flex: 1,
      minWidth: 150,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'linkedin',
      headerName: 'LinkedIn Profile',
      flex: 1,
      minWidth: 150,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'facebook',
      headerName: 'Facebook Profile',
      flex: 1,
      minWidth: 150,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'instagram',
      headerName: 'Instagram Profile',
      flex: 1,
      minWidth: 150,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'whatsapp',
      headerName: 'WhatsApp Number',
      flex: 1,
      minWidth: 150,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'relationship',
      headerName: 'Relationship',
      flex: 1,
      minWidth: 120,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'notes',
      headerName: 'Notes',
      flex: 1,
      minWidth: 150,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'is_favorite',
      headerName: 'Is Favorite',
      flex: 1,
      minWidth: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (params: { value: boolean }) => (params.value ? 'Yes' : 'No'),
    },
    {
      field: 'is_active',
      headerName: 'Is Active',
      flex: 1,
      minWidth: 100,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (params: { value: boolean }) => (params.value ? 'Yes' : 'No'),
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      flex: 1,
      minWidth: 160,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (params: { value: string | null }) =>
        dayjs(params.value).format('DD MMM YYYY, h:mm A'),
    },
    {
      field: 'updated_at',
      headerName: 'Updated At',
      flex: 1,
      minWidth: 160,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (params: { value: string | null }) =>
        dayjs(params.value).format('DD MMM YYYY, h:mm A'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 180,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Button
            onClick={() => handleOpen(params.row)}
            variant="outlined"
            size="small"
            color="primary"
          >
            Edit
          </Button>
          <Button
            onClick={() => handleDelete(params.row.id)}
            variant="outlined"
            size="small"
            color="error"
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Contact Menu
      </Typography>

      <Button variant="contained" color="primary" onClick={handleClickOpen} sx={{ mb: 2 }}>
        Create
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
      <Box
        sx={{
          height: 600,
          width: '100%',
          mt: 3,
          borderRadius: 2,
          bgcolor: 'white',
          boxShadow: 3,
          overflowX: 'auto',
        }}
      >
        <DataGrid
          rows={contacts}
          columns={columns}
          getRowId={(row) => row.id}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(model) => setColumnVisibilityModel(model)}
          checkboxSelection
          disableColumnMenu
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          sx={{
            border: 'none',

            fontFamily: 'Roboto, sans-serif',
            '& .MuiDataGrid-columnHeaders': {
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              backgroundColor: '#f4f6f8',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              textAlign: 'center',
              boxShadow: '0 2px 2px rgba(0, 0, 0, 0.1)',
              padding: '8px 0px 0px 0px',
              marginBottom: '8px',
              color: '#333',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 'bold',
              color: '#333',
              fontSize: '0.9rem',
              padding: '0 15px',
              textAlign: 'center',
              width: '100%',
            },

            '& .MuiDataGrid-row': {
              backgroundColor: '#fff',
              transition: 'background-color 0.3s ease',
              boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#a4a9edff',

              fontSize: '50px',
            },
            '& .MuiDataGrid-cell': {
              fontSize: '0.85rem',
              wordBreak: 'break-word',
              whiteSpace: 'normal',
              lineHeight: 1.5,
              textAlign: 'center',
              overflowWrap: 'break-word',

              paddingTop: '15px',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid #e0e0e0',
            },
            '& .MuiDataGrid-row:last-child .MuiDataGrid-cell': {
              border: 'none',
              borderColor: 'transparent',
            },
          }}
          showToolbar
        />
      </Box>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{formData.id ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid sx={{ width: '32%' }}>
              <TextField
                margin="dense"
                name="first_name"
                label="First Name"
                fullWidth
                value={formData.first_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '32%' }}>
              <TextField
                margin="dense"
                name="middle_name"
                label="Middle Name"
                fullWidth
                value={formData.middle_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '32%' }}>
              <TextField
                margin="dense"
                name="last_name"
                label="Last Name"
                fullWidth
                value={formData.last_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '100%' }}>
              <TextField
                margin="dense"
                name="full_name"
                label="Full Name"
                fullWidth
                value={formData.full_name}
                onChange={handleChange}
              />
            </Grid>

            <Grid sx={{ width: '32%' }}>
              <TextField
                margin="dense"
                name="phone"
                label="Mobile Number"
                type="number"
                fullWidth
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '32%' }}>
              <TextField
                margin="dense"
                name="alternate_phone"
                label="Alternate Mobile Number"
                type="number"
                fullWidth
                value={formData.alternate_phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '32%' }}>
              <TextField
                margin="dense"
                name="email"
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="gender"
                label="Gender"
                select
                fullWidth
                value={formData.gender}
                onChange={handleChange}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </TextField>
            </Grid>

            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="date_of_birth"
                type="date"
                fullWidth
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </Grid>

            <TextField
              margin="dense"
              name="address"
              label="Address"
              type="textarea"
              fullWidth
              multiline
              rows={2}
              value={formData.address}
              onChange={handleChange}
            />

            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="country"
                label="Country"
                fullWidth
                select
                value={formData.country}
                onChange={handleCountryChange}
              >
                {(countries as { name: string }[]).map((country, index) => (
                  <MenuItem key={index} value={country.name}>
                    {country.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="state"
                label="State"
                fullWidth
                select
                value={formData.state}
                onChange={handleStateChange}
                disabled={!formData.country}
              >
                {(states as { name: string }[]).map((state, index) => (
                  <MenuItem key={index} value={state.name}>
                    {state.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="city"
                label="City"
                fullWidth
                select
                value={formData.city}
                onChange={handleChange}
                disabled={!formData.state}
              >
                {cities.map((city, index) => (
                  <MenuItem key={index} value={city}>
                    {city}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="postal_code"
                label="Postal Code"
                type="number"
                fullWidth
                value={formData.postal_code}
                onChange={handleChange}
              />
            </Grid>

            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="contact_type"
                label="Contact Type"
                fullWidth
                value={formData.contact_type}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="organization_name"
                label="Organization Name"
                fullWidth
                value={formData.organization_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="job_title"
                label="Job Title"
                fullWidth
                value={formData.job_title}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="department"
                label="Department"
                fullWidth
                value={formData.department}
                onChange={handleChange}
              />
            </Grid>
            <TextField
              margin="dense"
              name="website"
              label="Website"
              fullWidth
              value={formData.website}
              onChange={handleChange}
            />
            <Grid sx={{ width: '32%' }}>
              <TextField
                margin="dense"
                name="linkedin"
                label="LinkedIn Profile"
                fullWidth
                value={formData.linkedin}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '32%' }}>
              <TextField
                margin="dense"
                name="facebook"
                label="Facebook Profile"
                fullWidth
                value={formData.facebook}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '32%' }}>
              <TextField
                margin="dense"
                name="instagram"
                label="Instagram Profile"
                fullWidth
                value={formData.instagram}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="whatsapp"
                label="WhatsApp Number"
                fullWidth
                value={formData.whatsapp}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="relationship"
                label="Relationship"
                fullWidth
                value={formData.relationship}
                onChange={handleChange}
              />
            </Grid>
            <TextField
              margin="dense"
              name="notes"
              label="Notes"
              fullWidth
              multiline
              rows={4}
              value={formData.notes}
              onChange={handleChange}
            />
            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="is_favorite"
                label="Is Favorite"
                fullWidth
                value={formData.is_favorite ? 'Yes' : 'No'}
                onChange={handleChange}
              />
            </Grid>
            <Grid sx={{ width: '49%' }}>
              <TextField
                margin="dense"
                name="is_active"
                label="Is Active"
                fullWidth
                value={formData.is_active ? 'Yes' : 'No'}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {formData.id ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
