/**
 * Context SDK for AI Assistant
 * 
 * This module provides functionality to track user context and initialize the AI Assistant widget.
 * It captures information about the current page, user role, permissions, and recent API errors.
 */

interface Context {
  currentPage: string;
  userRole?: string;
  permissions?: string[];
  recentApiErrors?: ApiError[];
}

interface ApiError {
  timestamp: number;
  url: string;
  method: string;
  status?: number;
  message: string;
}

interface WidgetConfig {
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

// Store for recent API errors
const apiErrorStore: ApiError[] = [];
const MAX_STORED_ERRORS = 5;

/**
 * Get the current user context
 * @returns Context object with current page, user role, permissions, and recent API errors
 */
export function getContext(): Context {
  return {
    currentPage: window.location.pathname,
    userRole: getUserRole(),
    permissions: getUserPermissions(),
    recentApiErrors: [...apiErrorStore]
  };
}

/**
 * Get the current user role from the global USER object if available
 */
function getUserRole(): string | undefined {
  if (typeof window !== 'undefined' && window.USER && window.USER.role) {
    return window.USER.role;
  }
  return undefined;
}

/**
 * Get the current user permissions from the global USER object if available
 */
function getUserPermissions(): string[] | undefined {
  if (typeof window !== 'undefined' && window.USER && window.USER.permissions) {
    return window.USER.permissions;
  }
  return undefined;
}

/**
 * Initialize API monitoring by intercepting fetch and axios requests
 */
function initApiMonitoring(): void {
  // Intercept fetch API
  const originalFetch = window.fetch;
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.url;
    const method = init?.method || 'GET';
    
    try {
      const response = await originalFetch(input, init);
      
      if (!response.ok) {
        const error: ApiError = {
          timestamp: Date.now(),
          url,
          method,
          status: response.status,
          message: response.statusText
        };
        addApiError(error);
      }
      
      return response;
    } catch (error) {
      const apiError: ApiError = {
        timestamp: Date.now(),
        url,
        method,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      addApiError(apiError);
      throw error;
    }
  };
  
  // Intercept axios if available
  if (typeof window !== 'undefined' && window.axios) {
    const axios = window.axios;
    
    // Add request interceptor
    axios.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        const config = error.config || {};
        const apiError: ApiError = {
          timestamp: Date.now(),
          url: config.url || 'unknown',
          method: config.method?.toUpperCase() || 'UNKNOWN',
          status: error.response?.status,
          message: error.message || 'Unknown error'
        };
        addApiError(apiError);
        return Promise.reject(error);
      }
    );
  }
}

/**
 * Add an API error to the store, maintaining the maximum size
 */
function addApiError(error: ApiError): void {
  apiErrorStore.unshift(error);
  if (apiErrorStore.length > MAX_STORED_ERRORS) {
    apiErrorStore.pop();
  }
}

/**
 * Initialize the AI Assistant widget
 * @param apiUrl The URL of the AI Assistant API
 * @param tenantId The tenant ID for the organization
 * @param config Configuration options for the widget
 */
export function initWidget(apiUrl: string, tenantId: string, config?: WidgetConfig): void {
  // Initialize API monitoring
  initApiMonitoring();
  
  // Create widget container if it doesn't exist
  let widgetContainer = document.getElementById('ai-assistant-widget');
  if (!widgetContainer) {
    widgetContainer = document.createElement('div');
    widgetContainer.id = 'ai-assistant-widget';
    document.body.appendChild(widgetContainer);
  }
  
  // Load widget script
  const script = document.createElement('script');
  script.src = `${apiUrl}/widget.js`;
  script.async = true;
  script.onload = () => {
    // Initialize widget with configuration
    if (window.AIAssistantWidget) {
      window.AIAssistantWidget.init({
        apiUrl,
        tenantId,
        config: config || {},
        getContext
      });
    }
  };
  document.head.appendChild(script);
}

// Add type definitions for global objects
declare global {
  interface Window {
    USER?: {
      role?: string;
      permissions?: string[];
    };
    axios?: any;
    AIAssistantWidget?: {
      init: (options: {
        apiUrl: string;
        tenantId: string;
        config: WidgetConfig;
        getContext: () => Context;
      }) => void;
    };
  }
}