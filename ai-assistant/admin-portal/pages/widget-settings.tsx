import React, { useState } from 'react';
import Layout from '../components/Layout';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import { ChromePicker } from 'react-color';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`widget-tabpanel-${index}`}
      aria-labelledby={`widget-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const WidgetSettingsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [widgetConfig, setWidgetConfig] = useState({
    theme: {
      primaryColor: '#4f46e5',
      secondaryColor: '#818cf8',
      logo: '',
      borderRadius: 8,
      fontFamily: 'Inter, sans-serif',
    },
    features: {
      escalation: true,
      stepByStep: true,
      apiMonitoring: true,
      fileAttachments: false,
      voiceInput: false,
    },
    tone: 'friendly',
    position: 'bottom-right',
    initialMessage: 'Hello! How can I help you today?',
  });

  const [showPrimaryColorPicker, setShowPrimaryColorPicker] = useState(false);
  const [showSecondaryColorPicker, setShowSecondaryColorPicker] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleToneChange = (event: SelectChangeEvent) => {
    setWidgetConfig({
      ...widgetConfig,
      tone: event.target.value,
    });
  };

  const handlePositionChange = (event: SelectChangeEvent) => {
    setWidgetConfig({
      ...widgetConfig,
      position: event.target.value,
    });
  };

  const handleFeatureToggle = (feature: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setWidgetConfig({
      ...widgetConfig,
      features: {
        ...widgetConfig.features,
        [feature]: event.target.checked,
      },
    });
  };

  const handleInitialMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWidgetConfig({
      ...widgetConfig,
      initialMessage: event.target.value,
    });
  };

  const handlePrimaryColorChange = (color: any) => {
    setWidgetConfig({
      ...widgetConfig,
      theme: {
        ...widgetConfig.theme,
        primaryColor: color.hex,
      },
    });
  };

  const handleSecondaryColorChange = (color: any) => {
    setWidgetConfig({
      ...widgetConfig,
      theme: {
        ...widgetConfig.theme,
        secondaryColor: color.hex,
      },
    });
  };

  const handleLogoUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWidgetConfig({
      ...widgetConfig,
      theme: {
        ...widgetConfig.theme,
        logo: event.target.value,
      },
    });
  };

  const handleBorderRadiusChange = (event: Event, newValue: number | number[]) => {
    setWidgetConfig({
      ...widgetConfig,
      theme: {
        ...widgetConfig.theme,
        borderRadius: newValue as number,
      },
    });
  };

  const handleFontFamilyChange = (event: SelectChangeEvent) => {
    setWidgetConfig({
      ...widgetConfig,
      theme: {
        ...widgetConfig.theme,
        fontFamily: event.target.value,
      },
    });
  };

  const handleSaveSettings = () => {
    // In a real app, this would save the settings to the API
    console.log('Saving widget settings:', widgetConfig);
    alert('Widget settings saved successfully!');
  };

  const handlePreviewWidget = () => {
    // In a real app, this would open a preview of the widget
    console.log('Previewing widget with settings:', widgetConfig);
    alert('Widget preview functionality would be implemented here.');
  };

  return (
    <Layout title="Widget Settings">
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" gutterBottom>
              Widget Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Customize the appearance and behavior of your AI Assistant widget
            </Typography>
          </Grid>
          <Grid item>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={handlePreviewWidget}>
                Preview Widget
              </Button>
              <Button variant="contained" onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="widget settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Appearance" />
          <Tab label="Behavior" />
          <Tab label="Features" />
        </Tabs>

        {/* Appearance Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Colors
              </Typography>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Primary Color
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: widgetConfig.theme.primaryColor,
                        mr: 2,
                        cursor: 'pointer',
                        border: '1px solid #ccc',
                      }}
                      onClick={() => setShowPrimaryColorPicker(!showPrimaryColorPicker)}
                    />
                    <TextField
                      size="small"
                      value={widgetConfig.theme.primaryColor}
                      InputProps={{ readOnly: true }}
                    />
                  </Box>
                  {showPrimaryColorPicker && (
                    <Box sx={{ mt: 1, mb: 2 }}>
                      <ChromePicker
                        color={widgetConfig.theme.primaryColor}
                        onChange={handlePrimaryColorChange}
                        disableAlpha
                      />
                    </Box>
                  )}
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Secondary Color
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        bgcolor: widgetConfig.theme.secondaryColor,
                        mr: 2,
                        cursor: 'pointer',
                        border: '1px solid #ccc',
                      }}
                      onClick={() => setShowSecondaryColorPicker(!showSecondaryColorPicker)}
                    />
                    <TextField
                      size="small"
                      value={widgetConfig.theme.secondaryColor}
                      InputProps={{ readOnly: true }}
                    />
                  </Box>
                  {showSecondaryColorPicker && (
                    <Box sx={{ mt: 1, mb: 2 }}>
                      <ChromePicker
                        color={widgetConfig.theme.secondaryColor}
                        onChange={handleSecondaryColorChange}
                        disableAlpha
                      />
                    </Box>
                  )}
                </Box>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Typography
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="font-family-label">Font Family</InputLabel>
                <Select
                  labelId="font-family-label"
                  value={widgetConfig.theme.fontFamily}
                  label="Font Family"
                  onChange={handleFontFamilyChange}
                >
                  <MenuItem value="Inter, sans-serif">Inter</MenuItem>
                  <MenuItem value="Roboto, sans-serif">Roboto</MenuItem>
                  <MenuItem value="'Open Sans', sans-serif">Open Sans</MenuItem>
                  <MenuItem value="'Montserrat', sans-serif">Montserrat</MenuItem>
                  <MenuItem value="system-ui, sans-serif">System Default</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Logo
              </Typography>
              <TextField
                fullWidth
                label="Logo URL"
                placeholder="https://example.com/logo.svg"
                value={widgetConfig.theme.logo}
                onChange={handleLogoUrlChange}
                sx={{ mb: 3 }}
              />
              {widgetConfig.theme.logo && (
                <Box sx={{ mt: 2, mb: 3, textAlign: 'center' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Logo Preview
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 100,
                      width: '100%',
                      bgcolor: '#f5f5f5',
                    }}
                  >
                    <img
                      src={widgetConfig.theme.logo}
                      alt="Widget Logo"
                      style={{ maxHeight: 80, maxWidth: '100%' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x50?text=Invalid+URL';
                      }}
                    />
                  </Paper>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Shape
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Border Radius: {widgetConfig.theme.borderRadius}px
              </Typography>
              <Slider
                value={widgetConfig.theme.borderRadius}
                onChange={handleBorderRadiusChange}
                min={0}
                max={24}
                step={1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 8, label: '8' },
                  { value: 16, label: '16' },
                  { value: 24, label: '24' },
                ]}
                sx={{ mb: 4 }}
              />

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Widget Position
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id="position-label">Position</InputLabel>
                  <Select
                    labelId="position-label"
                    value={widgetConfig.position}
                    label="Position"
                    onChange={handlePositionChange}
                  >
                    <MenuItem value="bottom-right">Bottom Right</MenuItem>
                    <MenuItem value="bottom-left">Bottom Left</MenuItem>
                    <MenuItem value="top-right">Top Right</MenuItem>
                    <MenuItem value="top-left">Top Left</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Behavior Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Conversation
              </Typography>
              <TextField
                fullWidth
                label="Initial Message"
                multiline
                rows={3}
                value={widgetConfig.initialMessage}
                onChange={handleInitialMessageChange}
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="tone-label">Conversation Tone</InputLabel>
                <Select
                  labelId="tone-label"
                  value={widgetConfig.tone}
                  label="Conversation Tone"
                  onChange={handleToneChange}
                >
                  <MenuItem value="friendly">Friendly</MenuItem>
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="technical">Technical</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Widget Preview
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This is a simplified preview of how your widget will appear with the current settings.
                  </Typography>

                  <Box
                    sx={{
                      mt: 3,
                      border: '1px solid #e0e0e0',
                      borderRadius: `${widgetConfig.theme.borderRadius}px`,
                      overflow: 'hidden',
                      width: '100%',
                      maxWidth: 350,
                      mx: 'auto',
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: widgetConfig.theme.primaryColor,
                        color: '#fff',
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {widgetConfig.theme.logo && (
                        <img
                          src={widgetConfig.theme.logo}
                          alt="Logo"
                          style={{ height: 24, marginRight: 8 }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <Typography
                        variant="subtitle1"
                        sx={{ fontFamily: widgetConfig.theme.fontFamily }}
                      >
                        AI Assistant
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', minHeight: 150 }}>
                      <Box
                        sx={{
                          bgcolor: '#fff',
                          p: 1.5,
                          borderRadius: 1,
                          mb: 1,
                          maxWidth: '80%',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: widgetConfig.theme.fontFamily }}
                        >
                          {widgetConfig.initialMessage}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Features Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Core Features
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={widgetConfig.features.stepByStep}
                      onChange={handleFeatureToggle('stepByStep')}
                    />
                  }
                  label="Step-by-Step Guidance"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -1, mb: 2 }}>
                  Enable guided workflows with step-by-step instructions
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={widgetConfig.features.escalation}
                      onChange={handleFeatureToggle('escalation')}
                    />
                  }
                  label="Support Escalation"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -1, mb: 2 }}>
                  Allow users to escalate issues to human support
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={widgetConfig.features.apiMonitoring}
                      onChange={handleFeatureToggle('apiMonitoring')}
                    />
                  }
                  label="API Error Monitoring"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -1, mb: 2 }}>
                  Track API errors to provide context-aware assistance
                </Typography>
              </FormGroup>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Advanced Features
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={widgetConfig.features.fileAttachments}
                      onChange={handleFeatureToggle('fileAttachments')}
                    />
                  }
                  label="File Attachments"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -1, mb: 2 }}>
                  Allow users to upload files in conversations
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={widgetConfig.features.voiceInput}
                      onChange={handleFeatureToggle('voiceInput')}
                    />
                  }
                  label="Voice Input"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -1, mb: 2 }}>
                  Enable voice input for hands-free interaction
                </Typography>
              </FormGroup>

              <Card sx={{ mt: 4 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Feature Impact
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Enabling advanced features may require additional configuration and can affect performance.
                  </Typography>
                  <Typography variant="body2">
                    For optimal performance, only enable the features you need.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Layout>
  );
};

export default WidgetSettingsPage;