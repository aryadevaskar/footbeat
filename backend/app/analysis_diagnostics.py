"""Small, transparent diagnostics for the beat tracker's raw output."""

from typing import Dict, List, Optional

import numpy as np


def estimate_leading_silence(samples: np.ndarray, sample_rate: int) -> Optional[float]:
    """Estimate where audible activity starts using 50 ms RMS windows.

    This is descriptive only: it never shifts or filters detected beat times.
    """
    if sample_rate <= 0 or samples.size == 0:
        return None
    window_size = max(1, round(sample_rate * 0.05))
    window_count = int(np.ceil(samples.size / window_size))
    padded = np.pad(samples.astype(np.float64), (0, window_count * window_size - samples.size))
    windows = padded.reshape(window_count, window_size)
    rms = np.sqrt(np.mean(np.square(windows), axis=1))
    peak = float(np.max(rms)) if rms.size else 0.0
    threshold = max(1e-5, peak * 0.1)
    active = np.flatnonzero(rms >= threshold)
    return float(active[0] * window_size / sample_rate) if active.size else None


def build_beat_diagnostics(
    beat_times: List[float],
    estimated_bpm: Optional[float],
    duration: float,
    sample_rate: int,
    leading_silence_seconds: float,
    onset_strength_mean: float,
    onset_strength_std: float,
    onset_strength_peak: float,
    librosa_version: str,
) -> Dict:
    intervals = np.diff(np.asarray(beat_times, dtype=np.float64))
    median_interval = float(np.median(intervals)) if intervals.size else None
    mean_interval = float(np.mean(intervals)) if intervals.size else None
    interval_std = float(np.std(intervals)) if intervals.size else None
    interval_cv = interval_std / mean_interval if intervals.size and mean_interval else None
    implied_bpm = 60.0 / median_interval if median_interval and median_interval > 0 else None

    warnings: List[str] = []
    if interval_cv is not None and interval_cv >= 0.2:
        warnings.append("Detected beat intervals vary substantially; inspect the raw markers against playback.")
    if estimated_bpm and implied_bpm:
        ratio = implied_bpm / estimated_bpm
        if 1.8 <= ratio <= 2.2 or 0.45 <= ratio <= 0.55:
            warnings.append("The median beat spacing and tempo estimate differ by about 2×; possible half-time or double-time ambiguity.")
    if leading_silence_seconds is not None and leading_silence_seconds >= 0.75:
        warnings.append("Signal activity begins after a measurable leading-silence region. Beat timestamps remain relative to the original file and were not shifted.")

    return {
        "librosa_version": librosa_version,
        "decoded_sample_rate_hz": sample_rate,
        "analysis_channels": 1,
        "resampled": False,
        "onset_strength": {
            "function": "librosa.onset.onset_strength",
            "hop_length": 512,
            "parameters": "librosa defaults: lag=1, max_size=1, center=true, detrend=false; default mel-spectrogram feature",
            "mean": onset_strength_mean,
            "standard_deviation": onset_strength_std,
            "peak": onset_strength_peak,
        },
        "beat_tracker": {
            "function": "librosa.beat.beat_track",
            "units": "frames",
            "trim": False,
            "parameters": "start_bpm=120 and tightness=100 (librosa defaults); no prior supplied",
        },
        "timestamp_conversion": "librosa.frames_to_time using decoded sample rate and hop length 512; zero origin offset",
        "timestamps_shifted": False,
        "estimated_leading_silence_seconds": leading_silence_seconds,
        "first_detected_beat_seconds": beat_times[0] if beat_times else None,
        "last_detected_beat_seconds": beat_times[-1] if beat_times else None,
        "first_beat_is_downbeat": None,
        "downbeat_detection_performed": False,
        "duration_seconds": duration,
        "intervals": {
            "count": int(intervals.size),
            "median_seconds": median_interval,
            "mean_seconds": mean_interval,
            "standard_deviation_seconds": interval_std,
            "coefficient_of_variation": interval_cv,
            "implied_bpm_from_median_interval": implied_bpm,
        },
        "warnings": warnings,
        "warning_note": "Statistical warnings are heuristics, not a measure of musical correctness.",
    }
