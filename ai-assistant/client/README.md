# AI Assistant Client

This directory contains the client-side code for the AI Assistant widget and SDK.

## Structure

- `sdk/`: JavaScript SDK for context tracking and widget initialization
- `components/`: React components for the Assistant Widget
- `App.tsx`: Main application component

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

## Usage

The client SDK can be integrated into any web application using the following snippet:

```html
<script src="https://cdn.aiassistant.dev/widget.js"></script>
<script>
  window.AIAssistant.initWidget({
    apiUrl: 'https://api.aiassistant.dev',
    tenantId: 'your-tenant-id',
    config: {
      theme: {
        primaryColor: '#4f46e5',
        secondaryColor: '#818cf8'
      }
    }
  });
</script>
```