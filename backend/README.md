# FocusFlow Backend

This is the backend service for FocusFlow, built with FastAPI. It handles data persistence, local LLM integration, Keywords AI communication, and Google Calendar syncing.

## Prerequisites

- Python 3.11+
- [Ollama](https://ollama.com/) (running locally with `llama3.1:8b`)

## Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

1.  **Environment Variables:**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and add your `KEYWORDS_AI_API_KEY`.

2.  **Google Calendar (Optional):**
    To enable calendar integration, place your `credentials.json` file (from Google Cloud Console) in the `backend/` directory.

3.  **Ollama:**
    Ensure Ollama is running locally:
    ```bash
    ollama serve
    ```
    Pull the required model if you haven't already:
    ```bash
    ollama pull llama3.1:8b
    ```

## Running the Server

Start the development server:

```bash
uvicorn backend.main:app --reload --port 8000 (run this in root directory of the project)
```

The backend will be available at `http://localhost:8000`.

## API Documentation

Once the server is running, you can explore the API endpoints via the interactive Swagger UI:

-   **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
-   **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
