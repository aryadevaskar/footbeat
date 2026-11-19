# Bench and music setup

## Bench URLs

Each QR code encodes a permanent `/bench/<id>` URL. Bench names, locations, `Europe/London` timezone, and weekday genre schedules live in `src/benches/benchConfig.js`.

For local development, copy `.env.example` to `.env` and set `VITE_DEV_BENCH_ID` to choose which bench opens at `/`. Direct `/bench/<id>` URLs always take precedence. `VITE_FOOTBEAT_PUBLIC_URL` sets the initial destination in the local QR page; it does not alter the bench path.

Run `npm run dev`, then open `/dev/qr-codes` to preview and download printable SVGs. Or run `FOOTBEAT_BASE_URL=https://your-host.example npm run qr:benches` to write QR SVGs into the ignored `artifacts/bench-qrs/` folder.

The production FastAPI host serves the app shell at `/bench/<id>`, so scanning or refreshing a bench URL retains its ID.

## Curated tracks

No audio or beatmap assets are currently present. To add a playable track, put licensed audio under the matching `public/audio/<genre>/` directory and its prepared JSON under `public/beatmaps/`. Add its real metadata and both public paths to `src/catalogue/musicCatalogue.js` with `availability: 'available'` only after both assets are ready. The session resolver filters by today’s assigned genre and marks incomplete or missing assets unavailable.

The local MP3 upload and analysis workbench remains at `/dev` while running Vite. That route is not enabled as a public production screen.
