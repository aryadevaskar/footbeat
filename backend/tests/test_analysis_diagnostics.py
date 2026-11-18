import unittest
from unittest.mock import patch

import numpy as np

from backend.app.analysis_diagnostics import build_beat_diagnostics, estimate_leading_silence
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

    def test_leading_silence_is_estimated_but_not_trimmed(self):
        sample_rate = 1000
        samples = np.concatenate([np.zeros(1000), np.ones(1000) * 0.5])
        self.assertEqual(estimate_leading_silence(samples, sample_rate), 1.0)
        result = build_beat_diagnostics([1.2], None, 2, sample_rate, 1.0, 0.2, 0.1, 0.7, "test")
        self.assertTrue(any("were not shifted" in warning for warning in result["warnings"]))

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


if __name__ == "__main__":
    unittest.main()
