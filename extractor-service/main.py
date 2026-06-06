import io
from fastapi import FastAPI, UploadFile, File, HTTPException
import docx2txt
from pypdf import PdfReader

app = FastAPI(
    title="Document Text Extraction Microservice",
    description="Microservice to extract text from PDF, DOCX, and TXT files.",
    version="1.0.0"
)

@app.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    filename = file.filename.lower()
    content_bytes = await file.read()
    
    if filename.endswith(".txt"):
        try:
            text = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text = content_bytes.decode("latin-1")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to decode TXT file: {str(e)}")
                
    elif filename.endswith(".docx"):
        try:
            file_stream = io.BytesIO(content_bytes)
            text = docx2txt.process(file_stream)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse DOCX document: {str(e)}")
            
    elif filename.endswith(".pdf"):
        try:
            file_stream = io.BytesIO(content_bytes)
            reader = PdfReader(file_stream)
            text_parts = []
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_parts.append(extracted)
            text = "\n\n".join(text_parts)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF document: {str(e)}")
            
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Only PDF, DOCX, and TXT are accepted."
        )

    # Post-process text: normalize spacing and whitespace
    cleaned_text = " ".join(text.split())
    
    if not cleaned_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Document appears to be empty or contains no parseable text elements."
        )

    return {
        "filename": file.filename,
        "length": len(cleaned_text),
        "text": cleaned_text
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
