# AI Assistant

## Project Title and Description

The AI Assistant is a Python-based application that provides an interactive interface for interacting with large language models (LLMs). It leverages the power of Ollama to manage and run these models locally, offering a flexible and privacy-focused AI experience.

## Prerequisites

Before you begin, ensure you have the following software installed on your system:

*   **Python 3.11+:** The project is built using Python 3.11 or later. You can check your version by running `python3 --version` in your terminal.
*   **pip:** Python's package installer. It usually comes bundled with Python. Check by running `pip --version` or `pip3 --version`.
*   **Ollama:** Ollama is a tool for running large language models locally. You can download it from the official [Ollama website](https://ollama.com/).

## Installation Steps

Follow these steps to set up the AI Assistant project:

1.  **Clone the Repository:**
```
bash
    git clone <repository_url>
    cd ai-assistant
    
```
2.  **Navigate to the `api` directory:**
```
bash
    cd api
    
```
3.  **Create a Virtual Environment:**
```
bash
    python3 -m venv venv
    
```
This command creates a virtual environment named `venv` in the `api` directory.

4.  **Activate the Virtual Environment:**

    *   **Linux/macOS:**
```
bash
        source venv/bin/activate
        
```
*   **Windows:**
```
bash
        venv\Scripts\activate
        
```
5.  **Install Dependencies:**
```
bash
    pip install --upgrade pip
    pip install -r requirements.txt
    
```
This will install all the required Python packages listed in the `requirements.txt` file.

## Run Ollama

1.  **Ensure Ollama is in your `PATH`:**

    *   If you installed Ollama using a package manager (like `apt` or `brew`), it might already be in your `PATH`.
    *   If you installed it manually, you might need to add its directory to your `PATH` environment variable.
    * If you installed it using `nix` try running this:
```
bash
        export PATH="$PATH:/nix/store/*/bin"
        
```
*   You can verify that ollama is correctly installed by running `ollama --version`.

2.  **Start Ollama:**
```
bash
    ollama serve
    
```
This command starts the Ollama server in the background. You'll typically only need to do this once per session.

3. **Pull a model:**
```
bash
    ollama pull llama3
    
```
Replace `llama3` with the model of your choice.

## Run the app

1.  **Activate the virtual environment**
    If you have not activated the environment do it now:

    *   **Linux/macOS:**
```
bash
        source venv/bin/activate
        
```
*   **Windows:**
```
bash
        venv\Scripts\activate
        
```
2. **Run the app**
   Run this command to execute the app.
```
bash
   python main.py
   
```
## Troubleshooting

*   **`ollama: command not found`:**
    *   **Solution:** Ensure Ollama is installed correctly. If you installed it manually, you may need to add its installation directory to your `PATH` environment variable. If you used `nix`, be sure you exported the correct path. Verify it by running `ollama --version`.
*   **`pip: command not found` or `pip3: command not found`:**
    *   **Solution:** Make sure Python is installed correctly and that `pip` is bundled with it. If not, you might need to install `pip` separately. Try `sudo apt-get install python3-pip` in debian based systems.
*   **`ModuleNotFoundError`:**
    *   **Solution:** This error indicates that a required Python package is missing. Ensure you've activated the virtual environment and run `pip install -r requirements.txt`.
*   **CMake Error**
    *   **Solution:** If you encounter a CMake error while trying to install llama-cpp-python, check if you have the build essential correctly installed (`sudo apt-get install build-essential`) and also make sure that the compiler is in the `PATH`. Unfortunately, we couldn't solve this issue. Consider using another alternative like Ollama.

## Usage

1.  **Start the Ollama server**: Run `ollama serve` in a separate terminal if it is not already running.
2.  **Run the App**: Follow the steps under "Run the app."
3. **Interact**: After starting the app you will be able to interact with it through your terminal.

## Notes

*   **Virtual Environment:** Always work within the activated virtual environment. This prevents conflicts with system-wide Python packages.
* **Ollama:** We decided to use ollama because of the installation issues with llama-cpp-python. This provides a robust alternative to that package.
* **Requirements.txt:** The requirements file may change over time, so be sure to follow the installation instructions carefully.

## Contact and Support

If you encounter issues or have questions, please reach out to the project maintainers through:

*   **Email:** \[Your Email]
*   **GitHub Issues:** \[Link to your GitHub repository's issues page]