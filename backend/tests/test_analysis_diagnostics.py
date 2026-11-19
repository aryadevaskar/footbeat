import unittest
from unittest.mock import patch

import numpy as np

from backend.app.analysis_diagnostics import build_beat_diagnostics, detect_audio_activity, estimate_leading_silence
from backend.app.analysis import AudioDecodeError, MAX_AUDIO_DURATION_SECONDS, analyze_file


class BeatDiagnosticTests(unittest.TestCase):
    def test_interval_summary_uses_detected_timestamps(self):
        result = build_beat_diagnostics(
            [0.1, 0.6, 1.35, 2.6], 80, 10, 44100, 0, 0.2, 0.1, 0.7, "test"
        )
        self.assertEqual(result["intervals"]["count"], 3)
        self.assertAlmostEqual(result["intervals"]["median_seconds"], 0.75)
        self.assertAlmostEqual(result["intervals"]["implied_bpm_from_median_interval"], 80)
        self.assertTrue(result["warnings"][0].startswith("Detected beat intervals vary"))

    def test_flags_possible_half_or_double_time_without_changing_bpm(self):
        result = build_beat_diagnostics(
            [0, 0.25, 0.5, 0.75, 1], 120, 2, 44100, 0, 0.2, 0.1, 0.7, "test"
        )
        self.assertEqual(result["intervals"]["implied_bpm_from_median_interval"], 240)
        self.assertTrue(any("half-time or double-time" in warning for warning in result["warnings"]))
        self.assertEqual(result["first_beat_is_downbeat"], None)

    def test_leading_silence_is_estimated_and_reported(self):
        sample_rate = 1000
        samples = np.concatenate([np.zeros(1000), np.ones(1000) * 0.5])
        self.assertEqual(estimate_leading_silence(samples, sample_rate), 1.0)
        result = build_beat_diagnostics(
            [1.2], None, 2, sample_rate, 1.0, 0.2, 0.1, 0.7, "test",
            activity_ranges_seconds=[[1.0, 2.0]], discarded_beat_times=[0.8],
        )
        self.assertTrue(any("Earlier detections are discarded" in warning for warning in result["warnings"]))
        self.assertEqual(result["activity_range_seconds"], {"start": 1.0, "end": 2.0})
        self.assertEqual(result["discarded_beat_times"], [0.8])

    def test_activity_detection_handles_audio_without_leading_silence(self):
        sample_rate = 1000
        samples = np.sin(np.arange(2000) * 2 * np.pi * 8 / sample_rate)
        result = detect_audio_activity(samples, sample_rate)
        self.assertEqual(result["ranges_seconds"][0][0], 0.0)

    def test_activity_detection_preserves_a_very_quiet_introduction(self):
        sample_rate = 1000
        quiet_intro = np.ones(500) * 0.002
        loud_section = np.ones(1500) * 0.5
        result = detect_audio_activity(np.concatenate([quiet_intro, loud_section]), sample_rate)
        self.assertEqual(result["ranges_seconds"][0][0], 0.0)
        self.assertGreater(result["threshold_rms"], 0)

    def test_activity_detection_reports_silence_between_sections(self):
        sample_rate = 1000
        samples = np.concatenate([np.ones(1000) * 0.5, np.zeros(1000), np.ones(1000) * 0.5])
        result = detect_audio_activity(samples, sample_rate)
        self.assertEqual(result["ranges_seconds"], [[0.0, 1.0], [2.0, 3.0]])

    def test_reports_source_and_analysis_sample_rates(self):
        result = build_beat_diagnostics([], None, 1, 22050, 0, 0, 0, 0, "test", source_sample_rate=44100)
        self.assertEqual(result["decoded_sample_rate_hz"], 44100)
        self.assertEqual(result["analysis_sample_rate_hz"], 22050)
        self.assertTrue(result["resampled"])

    def test_no_intervals_or_silence_are_handled(self):
        self.assertIsNone(estimate_leading_silence(np.zeros(20), 100))
        result = build_beat_diagnostics([], None, 1, 44100, 0, 0, 0, 0, "test")
        self.assertIsNone(result["intervals"]["median_seconds"])
        self.assertEqual(result["intervals"]["count"], 0)

    @patch("backend.app.analysis.librosa.load")
    @patch("backend.app.analysis.librosa.get_duration", return_value=MAX_AUDIO_DURATION_SECONDS + 0.01)
    def test_overlong_audio_is_rejected_before_sample_decode(self, _duration, load):
        with self.assertRaisesRegex(AudioDecodeError, "4 minute"):
            analyze_file("overlong.mp3")
        load.assert_not_called()

    @patch("backend.app.analysis.librosa.beat.beat_track")
    @patch("backend.app.analysis.librosa.onset.onset_strength")
    @patch("backend.app.analysis.librosa.get_samplerate", return_value=22050)
    @patch("backend.app.analysis.librosa.get_duration", return_value=4.5)
    @patch("backend.app.analysis.librosa.load")
    def test_beats_before_activity_are_discarded_without_shifting_retained_times(
        self, load, _duration, _source_rate, onset_strength, beat_track
    ):
        sample_rate = 22050
        samples = np.concatenate([
            np.zeros(sample_rate),
            np.ones(sample_rate // 2, dtype=np.float32) * 0.5,
            np.zeros(sample_rate),
            np.ones(sample_rate * 2, dtype=np.float32) * 0.5,
        ])
        load.return_value = (samples, sample_rate)
        onset_strength.return_value = np.ones(300, dtype=np.float32)
        frame_times = [0.5, 1.3, 2.0, 2.8, 3.4, 4.0]
        frames = np.asarray([round(time * sample_rate / 512) for time in frame_times])
        beat_track.return_value = (np.asarray([100.0]), frames)

        result = analyze_file("leading-silence.mp3")

        self.assertEqual(result.diagnostics["discarded_beat_times"], [0.510839, 1.996916])
        self.assertEqual(len(result.beat_times), 4)
        self.assertAlmostEqual(result.beat_times[0], 1.300317, places=5)
        self.assertAlmostEqual(result.beat_times[1], 2.809615, places=5)
        activity_ranges = result.diagnostics["activity_ranges_seconds"]
        self.assertEqual(len(activity_ranges), 2)
        for observed, expected in zip(activity_ranges, [[1.0, 1.5], [2.5, 4.5]]):
            self.assertAlmostEqual(observed[0], expected[0], places=1)
            self.assertAlmostEqual(observed[1], expected[1], places=1)
        self.assertFalse(result.diagnostics["timestamps_shifted"])

    @patch("backend.app.analysis.librosa.get_samplerate", return_value=22050)
    @patch("backend.app.analysis.librosa.get_duration", return_value=1.0)
    @patch("backend.app.analysis.librosa.load")
    def test_silent_track_returns_no_reliable_beats(self, load, _duration, _source_rate):
        load.return_value = (np.zeros(22050, dtype=np.float32), 22050)
        result = analyze_file("silent.mp3")
        self.assertIsNone(result.estimated_bpm)
        self.assertEqual(result.beat_times, [])
        self.assertIn("nearly silent", result.warning)
        self.assertIsNone(result.diagnostics["activity_range_seconds"])


if __name__ == "__main__":
    unittest.main()
