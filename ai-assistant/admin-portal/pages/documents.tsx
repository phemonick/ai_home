import React, { useState } from 'react';
import Layout from '../components/Layout';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Chip,
  Divider,
  Grid, 
  IconButton,
  Paper, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  CloudUpload as UploadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

// Mock document types
const DOCUMENT_TYPES = [
  { value: 'api_docs', label: 'API Documentation' },
  { value: 'help_guide', label: 'Help Guide' },
  { value: 'faq', label: 'FAQ' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'reference', label: 'Reference Material' },
];

// Mock documents data
const MOCK_DOCUMENTS = [
  { id: '1', name: 'API Reference.pdf', type: 'api_docs', size: '2.4 MB', chunks: 42, uploadDate: '2023-05-10', status: 'active' },
  { id: '2', name: 'User Guide.md', type: 'help_guide', size: '1.1 MB', chunks: 28, uploadDate: '2023-05-08', status: 'active' },
  { id: '3', name: 'Frequently Asked Questions.txt', type: 'faq', size: '0.3 MB', chunks: 15, uploadDate: '2023-05-05', status: 'active' },
  { id: '4', name: 'Getting Started.pdf', type: 'tutorial', size: '1.8 MB', chunks: 33, uploadDate: '2023-05-01', status: 'active' },
  { id: '5', name: 'Technical Specifications.pdf', type: 'reference', size: '3.2 MB', chunks: 56, uploadDate: '2023-04-28', status: 'active' },
];

const DocumentsPage = () => {
  const [documents, setDocuments] = useState(MOCK_DOCUMENTS);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // File upload handling
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md'],
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'application/x-yaml': ['.yaml', '.yml']
    },
    maxFiles: 1
  });
  
  const handleUploadDialogOpen = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setDocumentType('');
  };

  const handleDeleteDialogOpen = (documentId: string) => {
    setSelectedDocument(documentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedDocument(null);
  };

  const handleDocumentTypeChange = (event: SelectChangeEvent) => {
    setDocumentType(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleUploadDocument = () => {
    // In a real app, this would upload the file to the API
    if (acceptedFiles.length > 0 && documentType) {
      const newDocument = {
        id: `${documents.length + 1}`,
        name: acceptedFiles[0].name,
        type: documentType,
        size: `${(acceptedFiles[0].size / (1024 * 1024)).toFixed(1)} MB`,
        chunks: Math.floor(Math.random() * 50) + 10, // Random number for demo
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'active'
      };
      
      setDocuments([...documents, newDocument]);
      handleUploadDialogClose();
    }
  };

  const handleDeleteDocument = () => {
    if (selectedDocument) {
      setDocuments(documents.filter(doc => doc.id !== selectedDocument));
      handleDeleteDialogClose();
    }
  };

  // Filter documents based on search query
  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    DOCUMENT_TYPES.find(type => type.value === doc.type)?.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Document Management">
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" gutterBottom>
              Document Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Upload and manage documents for the AI Assistant to reference
            </Typography>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              startIcon={<UploadIcon />}
              onClick={handleUploadDialogOpen}
            >
              Upload Document
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Paper sx={{ mb: 4, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search documents..."
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button startIcon={<RefreshIcon />}>
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Chunks</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>{doc.name}</TableCell>
                <TableCell>
                  {DOCUMENT_TYPES.find(type => type.value === doc.type)?.label || doc.type}
                </TableCell>
                <TableCell>{doc.size}</TableCell>
                <TableCell>{doc.chunks}</TableCell>
                <TableCell>{doc.uploadDate}</TableCell>
                <TableCell>
                  <Chip 
                    label={doc.status} 
                    color={doc.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" aria-label="edit">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    aria-label="delete"
                    onClick={() => handleDeleteDialogOpen(doc.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredDocuments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No documents found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleUploadDialogClose}>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Upload a document to be processed and indexed for the AI Assistant.
            Supported formats: PDF, Markdown, TXT, JSON, YAML.
          </DialogContentText>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="document-type-label">Document Type</InputLabel>
            <Select
              labelId="document-type-label"
              value={documentType}
              label="Document Type"
              onChange={handleDocumentTypeChange}
            >
              {DOCUMENT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ 
            border: '2px dashed #ccc', 
            borderRadius: 2, 
            p: 3, 
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': { borderColor: 'primary.main' }
          }} {...getRootProps()}>
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" gutterBottom>
              Drag & drop a file here, or click to select
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Max file size: 10MB
            </Typography>
          </Box>
          
          {acceptedFiles.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Selected file:</Typography>
              <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
                <Typography variant="body2">
                  {acceptedFiles[0].name} ({(acceptedFiles[0].size / 1024).toFixed(1)} KB)
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDialogClose}>Cancel</Button>
          <Button 
            onClick={handleUploadDocument} 
            variant="contained"
            disabled={!documentType || acceptedFiles.length === 0}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this document? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteDocument} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default DocumentsPage;