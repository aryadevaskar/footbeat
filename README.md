# FOOTBEAT

FOOTBEAT is a browser-based rhythm game prototype controlled through four simulated pressure zones. The current build includes onboarding, local MP3 playback, librosa beat analysis, and choreography generation and preview.

## Requirements

- Node.js 18 or newer
- Python 3.9 or newer

## Run locally

From the project root:

```sh
npm install
npm run dev
```

The development command starts Vite at `http://127.0.0.1:5173` and the FastAPI analysis service at `http://127.0.0.1:8000`. On its first run, it creates `backend/.venv` and installs the Python packages from `backend/requirements.txt`.

Choose an MP3 in the app to play it and request rhythm analysis. The selected audio remains local to the browser; the analysis service handles the uploaded file temporarily and does not permanently store it.

## Checks

```sh
npm test
npm run build
```

Backend diagnostic tests:

```sh
backend/.venv/bin/python -m unittest discover -s backend/tests -v
```

On Windows, use `backend\\.venv\\Scripts\\python.exe` for the backend test command.
