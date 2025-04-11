# AI Assistant Admin Portal

This directory contains the Next.js admin portal for the AI Assistant.

## Structure

- `pages/`: Next.js pages including API routes
- `components/`: React components for the admin interface
- `styles/`: CSS and styling files
- `public/`: Static assets

## Features

- **Authentication & Authorization**: JWT-based login for org admins
- **Org & Project Management**: Create, update, and delete organizations
- **Data Ingestion Dashboard**: Upload and manage documentation files
- **Permission Management UI**: Define and edit role-action-page mappings
- **Widget Customization UI**: Configure branding and feature toggles
- **Analytics & Monitoring**: Usage dashboards and error tracking
- **API Key Management**: Generate, rotate, and revoke API keys

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```