# AI Assistant MVP

A full-stack, multi-tenant AI Assistant that can be embedded in web applications to provide contextual help, guided task flows, and escalation when needed.

## Overview

The AI Assistant serves as an embedded widget across web applications to help users troubleshoot issues, guide them step-by-step through complex flows, and escalate issues when needed. It leverages a local LLM and is trained on internal data such as permission rules, API documentation, and help guides. This version is built to support multi-tenant setups so any company can integrate it into their own website.

## Features

- **Contextual Help per Page**: Detects current page and user permissions
- **Conversational Assistant**: Chat interface for user queries
- **Document QA using Vector DB**: Queries internal documentation using vector search
- **Step-by-Step Instructions**: Breaks down complex flows into interactive steps
- **Escalation Module**: Opens support tickets if issues can't be resolved
- **Runs Locally**: Uses Ollama to run LLMs like LLaMA 3 or Mistral locally
- **Admin Portal**: Allows companies to configure their own docs, roles, and APIs

## Project Structure

```
ai-assistant/
├── client/                  # React app with widget and SDK
├── api/                     # FastAPI middleware server
├── admin-portal/            # Next.js admin dashboard
├── vector-data/             # Vector database and ingestion scripts
├── llm/                     # Ollama scripts and models
```

## Getting Started

See individual README files in each directory for setup and development instructions.

## License

MIT