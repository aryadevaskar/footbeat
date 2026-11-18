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

## Public deployment

The repository includes a Docker-based Render Blueprint. It builds the Vite frontend and serves it from FastAPI, so the interface and `/api/analyse` share one public origin.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/aryadevaskar/footbeat)

To deploy, sign in to Render and authorize its GitHub App to access this private repository. Review and approve the `footbeat-aryadevaskar` web service described in `render.yaml`. Render will build and deploy the app and provide its public `onrender.com` URL. Later pushes to `main` deploy automatically.

The Blueprint uses Render's free service plan. Free web services can spin down after 15 minutes without traffic and may take about a minute to start again when visited. Free instances have limited memory and CPU, so rhythm analysis accepts MP3 files up to 25 MB and 8 minutes. Uploaded audio is processed in temporary storage and is not persisted by the app.
