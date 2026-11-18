import logging
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from .analysis import ANALYSIS_METHOD, AudioDecodeError, analyze_file


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("footbeat.analysis")

MAX_UPLOAD_BYTES = 100 * 1024 * 1024
CHUNK_BYTES = 1024 * 1024

app = FastAPI(title="FOOTBEAT Audio Analysis", version="0.1.0")


class AnalysisResponse(BaseModel):
    filename: str
    duration: float
    estimated_bpm: Optional[float]
    beat_times: List[float]
    beat_count: int
    analysis_method: str
    warning: Optional[str] = None
    diagnostics: Optional[Dict[str, Any]] = None


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/analyse", response_model=AnalysisResponse)
async def analyse(file: UploadFile = File(...)):
    filename = Path(file.filename or "").name
    try:
        if not filename:
            raise HTTPException(status_code=400, detail="Choose an MP3 file to analyse.")
        if Path(filename).suffix.lower() != ".mp3":
            raise HTTPException(status_code=415, detail="Unsupported file type. FOOTBEAT currently accepts MP3 files only.")

        content_type = (file.content_type or "").lower()
        supported_types = {
            "audio/mpeg", "audio/mp3", "audio/x-mpeg", "audio/mpeg3",
            "audio/x-mpeg-3", "audio/x-mp3", "application/octet-stream",
        }
        if content_type and content_type not in supported_types:
            raise HTTPException(status_code=415, detail="Unsupported audio type. Choose a valid MP3 file.")

        total_bytes = 0
        with tempfile.TemporaryDirectory(prefix="footbeat-analysis-") as temporary_directory:
            temporary_path = Path(temporary_directory) / "upload.mp3"
            with temporary_path.open("wb") as temporary_file:
                while True:
                    chunk = await file.read(CHUNK_BYTES)
                    if not chunk:
                        break
                    total_bytes += len(chunk)
                    if total_bytes > MAX_UPLOAD_BYTES:
                        raise HTTPException(status_code=413, detail="This MP3 is over the 100 MB analysis limit.")
                    temporary_file.write(chunk)

            if total_bytes == 0:
                raise HTTPException(status_code=400, detail="The selected MP3 is empty.")

            try:
                result = await run_in_threadpool(analyze_file, str(temporary_path))
            except AudioDecodeError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
            except Exception as exc:
                logger.exception("Unexpected error while analysing %s", filename)
                raise HTTPException(status_code=500, detail="Rhythm analysis failed unexpectedly. Try another MP3 file.") from exc

            return AnalysisResponse(
                filename=filename,
                duration=result.duration,
                estimated_bpm=result.estimated_bpm,
                beat_times=result.beat_times,
                beat_count=len(result.beat_times),
                analysis_method=ANALYSIS_METHOD,
                warning=result.warning,
                diagnostics=result.diagnostics,
            )
    except HTTPException:
        raise
    except OSError as exc:
        logger.exception("Temporary upload handling failed for %s", filename)
        raise HTTPException(status_code=500, detail="The uploaded file could not be prepared for analysis.") from exc
    finally:
        await file.close()
