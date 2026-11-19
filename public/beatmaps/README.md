# Prepared beatmaps

`dance_monkey_easy.json` is the first prepared map. Its beat timestamps come from the existing librosa analysis pipeline; its movements come from the Easy choreography generator.

Do not create timestamps from BPM estimates. Store one JSON file per cleared audio asset and point the corresponding `musicCatalogue` entry to it.

Each prepared JSON file should contain:

- `version` and `difficulty`
- `duration` and `estimatedBpm`
- `beatCount` and `beatTimes` copied from actual analysis output, in ascending order
- `steps` with unique IDs, actual beat timestamps, beat indexes, and one of the four existing zone IDs

The application checks that the referenced audio and beatmap files exist and that their durations agree before allowing preparation to start.
