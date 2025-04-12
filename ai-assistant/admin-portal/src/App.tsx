import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';

// Import pages
import Documents from '../pages/documents';
import WidgetSettings from '../pages/widget-settings';

// Dashboard component (placeholder for now)
const Dashboard = () => (
  <Layout title="Dashboard">
    <h1>Dashboard</h1>
    <p>Welcome to the AI Assistant Admin Portal</p>
  </Layout>
);

// Placeholder components for routes that don't have pages yet
const Permissions = () => <Layout title="User Permissions"><h1>User Permissions</h1></Layout>;
const ApiKeys = () => <Layout title="API Keys"><h1>API Keys</h1></Layout>;
const Analytics = () => <Layout title="Analytics"><h1>Analytics</h1></Layout>;
const Settings = () => <Layout title="Settings"><h1>Settings</h1></Layout>;
const Profile = () => <Layout title="Profile"><h1>Profile</h1></Layout>;

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/widget-settings" element={<WidgetSettings />} />
      <Route path="/permissions" element={<Permissions />} />
      <Route path="/api-keys" element={<ApiKeys />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;