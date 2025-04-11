/**
 * AssistantWidget Component
 * 
 * A React component that provides a chat UI and step-by-step guidance for users.
 * It communicates with the AI Assistant API to process user messages and display responses.
 */

import React, { useState, useEffect, useRef } from 'react';
import { getContext } from '../sdk/contextSdk';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Step {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface WidgetConfig {
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    logo?: string;
  };
  features?: {
    escalation?: boolean;
    stepByStep?: boolean;
    apiMonitoring?: boolean;
  };
  tone?: 'friendly' | 'professional' | 'technical';
}

interface AssistantWidgetProps {
  apiUrl: string;
  tenantId: string;
  config?: WidgetConfig;
}

const AssistantWidget: React.FC<AssistantWidgetProps> = ({ apiUrl, tenantId, config = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [view, setView] = useState<'chat' | 'steps'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Default welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! How can I help you today?',
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Toggle widget open/closed
  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get current context
      const context = getContext();

      // Send message to API
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          message: userMessage.content,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }

      const data = await response.json();

      // Add assistant response to messages
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update steps if provided
      if (data.steps && data.steps.length > 0) {
        setSteps(data.steps);
        setView('steps');
      }
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to next step
  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      
      // Mark current step as completed
      setSteps((prev) =>
        prev.map((step, index) =>
          index === currentStepIndex ? { ...step, completed: true } : step
        )
      );
    }
  };

  // Navigate to previous step
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Handle escalation
  const handleEscalate = async () => {
    setIsLoading(true);

    try {
      // Get current context
      const context = getContext();

      // Send escalation request to API
      const response = await fetch(`${apiUrl}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          context,
          messages,
          currentStep: steps[currentStepIndex],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to escalate issue');
      }

      const data = await response.json();

      // Add escalation confirmation message
      const escalationMessage: Message = {
        id: `escalation-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'Your issue has been escalated to our support team. They will contact you soon.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, escalationMessage]);
      setView('chat');
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while trying to escalate your issue. Please try again later.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get theme colors from config or use defaults
  const primaryColor = config.theme?.primaryColor || '#4f46e5';
  const secondaryColor = config.theme?.secondaryColor || '#818cf8';

  // Render widget button
  const renderWidgetButton = () => (
    <button
      onClick={toggleWidget}
      className="fixed bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50 transition-all duration-300 hover:scale-110"
      style={{ backgroundColor: primaryColor }}
      aria-label="Open AI Assistant"
    >
      {isOpen ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )}
    </button>
  );

  // Render chat messages
  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
        >
          <div
            className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            style={message.role === 'user' ? { backgroundColor: primaryColor } : {}}
          >
            {message.content}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="text-left mb-4">
          <div className="inline-block rounded-lg px-4 py-2 bg-gray-200 text-gray-800">
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  // Render input form
  const renderInputForm = () => (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ focusRing: primaryColor }}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="rounded-full p-2 text-white"
          style={{ backgroundColor: primaryColor }}
          disabled={isLoading || !inputValue.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </form>
  );

  // Render steps view
  const renderStepsView = () => {
    const currentStep = steps[currentStepIndex];

    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Step {currentStepIndex + 1} of {steps.length}</h3>
            <button
              onClick={() => setView('chat')}
              className="text-blue-500 hover:text-blue-700"
              style={{ color: primaryColor }}
            >
              Back to Chat
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div
              className="h-2.5 rounded-full"
              style={{
                width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                backgroundColor: primaryColor,
              }}
            ></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="text-lg font-medium mb-2">{currentStep.title}</h4>
          <p className="text-gray-600 mb-4">{currentStep.description}</p>
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex justify-between">
            <button
              onClick={handlePrevStep}
              className={`px-4 py-2 rounded ${currentStepIndex > 0 ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              disabled={currentStepIndex === 0}
            >
              Previous
            </button>
            <div>
              {config.features?.escalation !== false && (
                <button
                  onClick={handleEscalate}
                  className="px-4 py-2 rounded bg-red-500 text-white mr-2"
                  disabled={isLoading}
                >
                  I'm Stuck
                </button>
              )}
              <button
                onClick={handleNextStep}
                className="px-4 py-2 rounded text-white"
                style={{ backgroundColor: primaryColor }}
                disabled={currentStepIndex === steps.length - 1 || isLoading}
              >
                {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render widget container
  const renderWidgetContainer = () => (
    <div
      className={`fixed bottom-20 right-4 w-80 sm:w-96 h-[500px] bg-white rounded-lg shadow-xl overflow-hidden z-50 transition-all duration-300 flex flex-col ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
    >
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center" style={{ backgroundColor: primaryColor }}>
        <div className="flex items-center">
          {config.theme?.logo ? (
            <img src={config.theme.logo} alt="Logo" className="h-6 w-6 mr-2" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          <h2 className="font-medium">AI Assistant</h2>
        </div>
        <div className="flex">
          {steps.length > 0 && (
            <button
              onClick={() => setView(view === 'chat' ? 'steps' : 'chat')}
              className="text-white mr-2"
              aria-label={view === 'chat' ? 'View Steps' : 'View Chat'}
            >
              {view === 'chat' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={toggleWidget}
            className="text-white"
            aria-label="Close AI Assistant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {view === 'chat' ? (
        <>
          {renderMessages()}
          {renderInputForm()}
        </>
      ) : (
        renderStepsView()
      )}
    </div>
  );

  return (
    <>
      {renderWidgetButton()}
      {renderWidgetContainer()}
    </>
  );
};

export default AssistantWidget;