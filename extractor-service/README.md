# Python Extraction Service

This is an optional FastAPI microservice for reliable text extraction from PDF, DOCX, and TXT documents.

## Setup Instructions

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run service**:
   ```bash
   python main.py
   ```

The service will run locally on `http://127.0.0.1:8000`.

## API Usage

- **Endpoint**: `POST /extract`
- **Payload**: Multipart form upload with a file named `file`.
- **Response**:
  ```json
  {
    "filename": "document.pdf",
    "length": 1540,
    "text": "Extracted text content here..."
  }
  ```
