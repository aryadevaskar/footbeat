from dataclasses import dataclass
from typing import Dict, List, Optional

import librosa
import numpy as np

from .analysis_diagnostics import build_beat_diagnostics, estimate_leading_silence


HOP_LENGTH = 512
ANALYSIS_SAMPLE_RATE = 22050
ONSET_N_FFT = 1024
MAX_AUDIO_DURATION_SECONDS = 4 * 60
ANALYSIS_METHOD = "librosa onset-strength beat tracking"


@dataclass
class AnalysisResult:
    duration: float
    estimated_bpm: Optional[float]
    beat_times: List[float]
    warning: Optional[str]
    diagnostics: Dict


class AudioDecodeError(Exception):
    """Raised when the uploaded file cannot be decoded as supported audio."""


def analyze_file(path: str) -> AnalysisResult:
    """Decode one temporary audio file and detect beats from its onset signal."""
    # Check container metadata before decoding samples into memory. This keeps
    # unusually long uploads from exhausting a small public service instance.
    try:
        metadata_duration = float(librosa.get_duration(path=path))
    except Exception:
        metadata_duration = None
    if metadata_duration is not None and np.isfinite(metadata_duration) and metadata_duration > MAX_AUDIO_DURATION_SECONDS:
        raise AudioDecodeError("This track is longer than the 4 minute rhythm-analysis limit.")

    try:
        source_sample_rate = int(librosa.get_samplerate(path))
    except Exception:
        source_sample_rate = None

    try:
        samples, sample_rate = librosa.load(path, sr=ANALYSIS_SAMPLE_RATE, mono=True)
    except Exception as exc:
        raise AudioDecodeError("The file could not be decoded as audio. Try a valid MP3 file.") from exc

    if sample_rate <= 0 or samples.size == 0:
        raise AudioDecodeError("The uploaded audio contains no playable samples.")

    duration = float(samples.shape[0] / sample_rate)
    if not np.isfinite(duration) or duration <= 0:
        raise AudioDecodeError("The uploaded audio has no usable duration.")

    leading_silence = estimate_leading_silence(samples, sample_rate)
    rms = float(np.sqrt(float(np.dot(samples, samples)) / samples.size))
    if not np.isfinite(rms) or rms < 1e-5:
        return AnalysisResult(
            duration=duration,
            estimated_bpm=None,
            beat_times=[],
            warning="This track is nearly silent, so a reliable rhythm could not be detected.",
            diagnostics=build_beat_diagnostics([], None, duration, sample_rate, leading_silence, 0.0, 0.0, 0.0, librosa.__version__, source_sample_rate),
        )

    try:
        onset_envelope = librosa.onset.onset_strength(
            y=samples,
            sr=sample_rate,
            hop_length=HOP_LENGTH,
            n_fft=ONSET_N_FFT,
        )
        if onset_envelope.size < 2:
            return AnalysisResult(
                duration=duration,
                estimated_bpm=None,
                beat_times=[],
                warning="This track is too short or has too little rhythmic detail for reliable beat detection.",
                diagnostics=build_beat_diagnostics([], None, duration, sample_rate, leading_silence, 0.0, 0.0, 0.0, librosa.__version__, source_sample_rate),
            )

        tempo, beat_frames = librosa.beat.beat_track(
            onset_envelope=onset_envelope,
            sr=sample_rate,
            hop_length=HOP_LENGTH,
            units="frames",
            trim=False,
        )
        raw_times = librosa.frames_to_time(
            beat_frames,
            sr=sample_rate,
            hop_length=HOP_LENGTH,
        )
    except Exception as exc:
        raise AudioDecodeError("Audio was decoded, but rhythm analysis failed. Try another MP3 file.") from exc

    beat_times = sorted(
        {
            round(float(timestamp), 6)
            for timestamp in np.asarray(raw_times).reshape(-1)
            if np.isfinite(timestamp) and 0 <= float(timestamp) < duration
        }
    )
    onset_variation = float(np.std(onset_envelope))
    onset_peak = float(np.max(onset_envelope)) if onset_envelope.size else 0.0

    try:
        tempo_value = float(np.asarray(tempo).reshape(-1)[0])
    except (IndexError, TypeError, ValueError):
        tempo_value = 0.0

    weak_signal = onset_peak < 1e-3 or onset_variation < 1e-4
    too_few_beats = len(beat_times) < 4
    invalid_tempo = not np.isfinite(tempo_value) or tempo_value <= 0
    low_confidence = weak_signal or too_few_beats or invalid_tempo

    warning = None
    if weak_signal:
        warning = "The rhythm is weak or ambiguous. No BPM estimate is shown; detected beat positions may be incomplete."
    elif too_few_beats or invalid_tempo:
        warning = "Too few consistent beats were found for a reliable BPM estimate. Review the detected positions carefully."

    diagnostics = build_beat_diagnostics(
        beat_times,
        None if low_confidence else round(tempo_value, 2),
        duration,
        sample_rate,
        leading_silence,
        float(np.mean(onset_envelope)),
        onset_variation,
        onset_peak,
        librosa.__version__,
        source_sample_rate,
    )

    return AnalysisResult(
        duration=duration,
        estimated_bpm=None if low_confidence else round(tempo_value, 2),
        beat_times=beat_times,
        warning=warning,
        diagnostics=diagnostics,
    )
