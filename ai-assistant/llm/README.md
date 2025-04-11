# AI Assistant LLM Integration

This directory contains scripts and utilities for running and managing local LLMs via Ollama for the AI Assistant.

## Prerequisites

- [Ollama](https://ollama.ai/) installed on your system
- Sufficient disk space for LLM models (typically 4-8GB per model)

## Usage

```bash
# Install Ollama
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh
# Windows: Download from https://ollama.ai/download

# Pull a model (e.g., Llama 3)
ollama pull llama3

# Run the model
./run_model.sh
```

## Supported Models

The following models are recommended for the AI Assistant:

- `llama3` - Meta's Llama 3 model (8B parameters)
- `mistral` - Mistral AI's model
- `gemma` - Google's Gemma model

Choose a model based on your performance requirements and available hardware.

## Configuration

Edit the `run_model.sh` script to customize model parameters such as:

- Temperature
- Top-p sampling
- Context window size
- System prompt