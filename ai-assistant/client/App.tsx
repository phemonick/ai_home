/**
 * Main App Component
 * 
 * This component demonstrates how to use the AI Assistant widget in a React application.
 * It shows both direct component usage and script-based initialization.
 */

import React, { useEffect } from 'react';
import AssistantWidget from './components/AssistantWidget';
import { initWidget } from './sdk/contextSdk';

const App: React.FC = () => {
  // Example of script-based initialization
  useEffect(() => {
    // This would typically be done in a script tag in your HTML
    // Shown here for demonstration purposes
    const apiUrl = 'https://api.aiassistant.dev';
    const tenantId = 'demo-tenant';
    const config = {
      theme: {
        primaryColor: '#4f46e5',
        secondaryColor: '#818cf8',
        logo: 'https://example.com/logo.svg'
      },
      features: {
        escalation: true,
        stepByStep: true,
        apiMonitoring: true
      },
      tone: 'friendly'
    };
    
    // Uncomment to initialize via script
    // initWidget(apiUrl, tenantId, config);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Assistant Demo</h1>
        <p>This page demonstrates the AI Assistant widget integration.</p>
      </header>
      
      <main>
        <section>
          <h2>Features</h2>
          <ul>
            <li>Contextual help based on current page</li>
            <li>Conversational interface</li>
            <li>Step-by-step guidance</li>
            <li>Escalation to human support</li>
          </ul>
        </section>
        
        <section>
          <h2>Try It Out</h2>
          <p>Click the chat button in the bottom-right corner to start a conversation with the AI Assistant.</p>
        </section>
      </main>
      
      {/* Example of direct component usage */}
      <AssistantWidget 
        apiUrl="https://api.aiassistant.dev"
        tenantId="demo-tenant"
        config={{
          theme: {
            primaryColor: '#4f46e5',
            secondaryColor: '#818cf8'
          },
          features: {
            escalation: true,
            stepByStep: true
          },
          tone: 'friendly'
        }}
      />
    </div>
  );
};

export default App;