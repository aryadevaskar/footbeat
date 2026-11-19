"""Small, transparent diagnostics for the beat tracker's raw output."""

from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np


def detect_audio_activity(
    samples: np.ndarray,
    sample_rate: int,
    window_seconds: float = 0.05,
    relative_threshold: float = 0.001,
    absolute_threshold: float = 1e-5,
    merge_gap_seconds: float = 0.15,
) -> Dict:
    """Find active audio ranges using adaptive, windowed RMS.

    The relative threshold is 0.1% of the loudest 50 ms window, with a small
    absolute floor. This keeps quiet introductions while rejecting codec
    padding and digital silence. Short gaps are merged to avoid splitting
    ordinary percussive material; longer section breaks remain visible.
    """
    samples = np.asarray(samples)
    if sample_rate <= 0 or samples.size == 0:
        return {"threshold_rms": None, "ranges_seconds": []}

    window_size = max(1, round(sample_rate * window_seconds))
    window_rms = []
    for start in range(0, samples.size, window_size):
        window = samples[start:start + window_size]
        window_rms.append(np.sqrt(float(np.dot(window, window)) / window.size))

    rms = np.asarray(window_rms, dtype=np.float64)
    peak = float(np.max(rms)) if rms.size else 0.0
    threshold = max(absolute_threshold, peak * relative_threshold)
    active_windows = np.flatnonzero(rms >= threshold)
    if active_windows.size == 0:
        return {"threshold_rms": threshold, "ranges_seconds": []}

    merge_gap_windows = int(merge_gap_seconds * sample_rate / window_size)
    ranges: List[Tuple[int, int]] = []
    range_start = previous = int(active_windows[0])
    for window_index in active_windows[1:]:
        window_index = int(window_index)
        if window_index - previous - 1 > merge_gap_windows:
            ranges.append((range_start, previous))
            range_start = window_index
        previous = window_index
    ranges.append((range_start, previous))

    duration = samples.size / sample_rate
    ranges_seconds = [
        [
            round(start * window_size / sample_rate, 6),
            round(min((end + 1) * window_size / sample_rate, duration), 6),
        ]
        for start, end in ranges
    ]
    return {"threshold_rms": threshold, "ranges_seconds": ranges_seconds}


def estimate_leading_silence(samples: np.ndarray, sample_rate: int) -> Optional[float]:
    """Compatibility helper returning the first adaptive activity time."""
    ranges = detect_audio_activity(samples, sample_rate)["ranges_seconds"]
    return ranges[0][0] if ranges else None


def build_beat_diagnostics(
    beat_times: List[float],
    estimated_bpm: Optional[float],
    duration: float,
    sample_rate: int,
    leading_silence_seconds: Optional[float],
    onset_strength_mean: float,
    onset_strength_std: float,
    onset_strength_peak: float,
    librosa_version: str,
    source_sample_rate: Optional[int] = None,
    activity_ranges_seconds: Optional[Sequence[Sequence[float]]] = None,
    discarded_beat_times: Optional[Sequence[float]] = None,
    activity_threshold_rms: Optional[float] = None,
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
        warnings.append("Signal activity begins after a measurable leading-silence region. Earlier detections are discarded; retained timestamps remain relative to the original file.")
    if discarded_beat_times and any(
        leading_silence_seconds is None or beat_time >= leading_silence_seconds
        for beat_time in discarded_beat_times
    ):
        warnings.append("Beat detections outside the measured activity ranges are discarded.")

    return {
        "librosa_version": librosa_version,
        "decoded_sample_rate_hz": source_sample_rate or sample_rate,
        "analysis_sample_rate_hz": sample_rate,
        "analysis_channels": 1,
        "resampled": source_sample_rate is not None and source_sample_rate != sample_rate,
        "onset_strength": {
            "function": "librosa.onset.onset_strength",
            "hop_length": 512,
            "parameters": "n_fft=1024; other onset parameters use librosa defaults (lag=1, max_size=1, center=true, detrend=false)",
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
        "activity_range_seconds": (
            {"start": activity_ranges_seconds[0][0], "end": activity_ranges_seconds[-1][1]}
            if activity_ranges_seconds else None
        ),
        "activity_ranges_seconds": [list(time_range) for time_range in (activity_ranges_seconds or [])],
        "activity_threshold_rms": activity_threshold_rms,
        "discarded_beat_times": list(discarded_beat_times or []),
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
