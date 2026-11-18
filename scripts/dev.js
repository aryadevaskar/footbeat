import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendDirectory = path.join(root, 'backend');
const requirementsFile = path.join(backendDirectory, 'requirements.txt');
const virtualEnvironment = path.join(backendDirectory, '.venv');
const backendUrl = 'http://127.0.0.1:8000';
const healthUrl = `${backendUrl}/api/health`;
const viteEntry = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

let backendProcess = null;
let viteProcess = null;
let shuttingDown = false;
let exitCode = 0;

function pythonIn(environment) {
  return process.platform === 'win32'
    ? path.join(environment, 'Scripts', 'python.exe')
    : path.join(environment, 'bin', 'python');
}

function runSetupCommand(command, args, label) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) {
    throw new Error(`${label} could not run: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}.`);
  }
}

function createVirtualEnvironment() {
  const pythonCommand = process.env.FOOTBEAT_BOOTSTRAP_PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
  const baseArgs = process.platform === 'win32' && pythonCommand === 'py' ? ['-3'] : [];
  const version = spawnSync(pythonCommand, [...baseArgs, '--version'], { cwd: root, encoding: 'utf8', stdio: 'pipe' });
  const versionText = `${version.stdout || ''} ${version.stderr || ''}`;
  const match = versionText.match(/Python\s+(\d+)\.(\d+)/);
  if (version.error || !match || Number(match[1]) < 3 || (Number(match[1]) === 3 && Number(match[2]) < 9)) {
    throw new Error(`Python 3.9 or newer is required to run the audio analysis backend.${version.error ? ` ${version.error.message}` : ''}\nSet FOOTBEAT_BOOTSTRAP_PYTHON to a compatible Python executable, then run npm run dev.`);
  }
  console.log('[backend] Creating the project virtual environment in backend/.venv…');
  try {
    runSetupCommand(pythonCommand, [...baseArgs, '-m', 'venv', virtualEnvironment], 'Python virtual environment setup');
  } catch (error) {
    throw new Error(`${error.message}\nInstall Python 3.9 or newer, then run npm run dev again. You can select Python with FOOTBEAT_BOOTSTRAP_PYTHON.`);
  }

  const python = pythonIn(virtualEnvironment);
  if (!existsSync(python)) {
    throw new Error(`Python did not create the expected environment at ${python}. Remove backend/.venv and retry.`);
  }
  return python;
}

function checkBackendDependencies(python) {
  const check = spawnSync(python, [
    '-c',
    'import sys; assert sys.version_info >= (3, 9); import fastapi, librosa, numpy, uvicorn, multipart',
  ], { cwd: backendDirectory, encoding: 'utf8', stdio: 'pipe' });
  return check.status === 0;
}

function ensureBackendDependencies(python) {
  if (checkBackendDependencies(python)) return;

  console.log('[backend] Required Python packages are missing. Installing backend/requirements.txt…');
  runSetupCommand(python, ['-m', 'pip', 'install', '-r', requirementsFile], 'Backend dependency installation');
  if (!checkBackendDependencies(python)) {
    throw new Error('The backend dependencies were installed but could not be imported. Check the Python version and backend/requirements.txt.');
  }
}

async function probeHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 900);
  try {
    const response = await fetch(healthUrl, { signal: controller.signal });
    if (!response.ok) return { ready: false, occupied: true };
    const payload = await response.json();
    return { ready: payload.status === 'ok', occupied: payload.status !== 'ok' };
  } catch {
    return { ready: false, occupied: false };
  } finally {
    clearTimeout(timeout);
  }
}

function stopManagedProcesses(signal = 'SIGTERM') {
  if (viteProcess && viteProcess.exitCode === null && viteProcess.signalCode === null) viteProcess.kill(signal);
  if (backendProcess && backendProcess.exitCode === null && backendProcess.signalCode === null) backendProcess.kill(signal);
}

async function waitForBackend() {
  const startedAt = Date.now();
  let childExit = null;
  backendProcess.once('error', (error) => { childExit = { code: null, signal: `launch error: ${error.message}` }; });
  backendProcess.once('exit', (code, signal) => { childExit = { code, signal }; });

  while (Date.now() - startedAt < 60000) {
    if (childExit) {
      throw new Error(`FastAPI exited before it became healthy (${childExit.signal || `code ${childExit.code}`}). See the backend log above.`);
    }
    const health = await probeHealth();
    if (health.ready) return;
    if (health.occupied) {
      throw new Error('Port 8000 is serving a different or unhealthy application. Stop it, then run npm run dev again.');
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  throw new Error('FastAPI did not become healthy at 127.0.0.1:8000 within 60 seconds. Check the backend log above.');
}

function watchProcesses() {
  return new Promise((resolve) => {
    const finish = (code) => {
      if (shuttingDown) return;
      shuttingDown = true;
      exitCode = code;
      stopManagedProcesses('SIGTERM');
      resolve();
    };

    viteProcess.once('exit', (code, signal) => {
      if (!shuttingDown) {
        if (signal) console.log(`[vite] Stopped (${signal}).`);
        finish(code ?? 1);
      }
    });
    viteProcess.once('error', (error) => {
      console.error(`[vite] Could not launch Vite: ${error.message}`);
      finish(1);
    });

    if (backendProcess) {
      backendProcess.once('exit', (code, signal) => {
        if (!shuttingDown) {
          console.error(`[backend] FastAPI stopped unexpectedly (${signal || `code ${code}`}); stopping Vite.`);
          finish(code ?? 1);
        }
      });
    }

    const onSignal = (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      exitCode = signal === 'SIGINT' ? 130 : 143;
      console.log(`\n[footbeat] Stopping development servers…`);
      stopManagedProcesses(signal);
      resolve();
    };
    process.once('SIGINT', () => onSignal('SIGINT'));
    process.once('SIGTERM', () => onSignal('SIGTERM'));
  });
}

async function start() {
  if (!existsSync(viteEntry)) {
    throw new Error('Vite is not installed. Run npm install from the project root, then npm run dev.');
  }
  if (!existsSync(requirementsFile)) {
    throw new Error(`Backend requirements file was not found: ${requirementsFile}`);
  }

  let backendPython = process.env.FOOTBEAT_BACKEND_PYTHON || pythonIn(virtualEnvironment);
  if (!existsSync(backendPython)) backendPython = createVirtualEnvironment();
  ensureBackendDependencies(backendPython);

  const existingBackend = await probeHealth();
  if (existingBackend.ready) {
    console.log('[backend] FastAPI is already healthy at 127.0.0.1:8000; reusing it.');
  } else {
    if (existingBackend.occupied) {
      throw new Error('Port 8000 is already in use by a service that is not FOOTBEAT FastAPI. Stop it, then run npm run dev.');
    }
    console.log('[backend] Starting FastAPI at 127.0.0.1:8000…');
    backendProcess = spawn(backendPython, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
      cwd: backendDirectory,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      stdio: 'inherit',
    });
    backendProcess.once('error', (error) => {
      console.error(`[backend] Could not launch Uvicorn: ${error.message}`);
    });
    await waitForBackend();
  }

  console.log('[backend] Healthy. Starting Vite at http://127.0.0.1:5173/…');
  viteProcess = spawn(process.execPath, [viteEntry, '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  });
  await watchProcesses();
}

start().catch((error) => {
  console.error(`\n[footbeat] Development startup failed: ${error.message}`);
  stopManagedProcesses();
  process.exitCode = 1;
});
