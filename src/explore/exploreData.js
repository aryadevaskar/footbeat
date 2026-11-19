import { benches } from '../benches/benchConfig.js';
import { resolveDailySession } from '../session/resolveDailySession.js';

// These positions are only for arranging markers on the schematic illustration.
// They are not geographic coordinates and should not be used for distance or routing.
const benchDiagramPositions = {
  'newcastle-bench-001': { x: 24, y: 32 },
  'newcastle-bench-002': { x: 72, y: 45 },
  'newcastle-bench-003': { x: 43, y: 73 },
};

// Clearly fictional examples to demonstrate future venue cards. Replace with
// verified venue listings and approved offers before describing these as partners.
export const sampleVenues = [
  {
    id: 'sample-venue-city-centre',
    kind: 'venue',
    name: 'Sample live venue · City Centre',
    district: 'City Centre',
    genres: ['Indie', 'Pop'],
    description: 'An illustrative live-music listing for the city-centre area.',
    offer: 'Example student offer: 10% off a soft drink before 8 pm.',
    action: 'Example only · not a real partner offer and cannot be redeemed.',
    diagramPosition: { x: 49, y: 20 },
  },
  {
    id: 'sample-venue-quayside',
    kind: 'venue',
    name: 'Sample club · Quayside',
    district: 'Quayside',
    genres: ['Electronic', 'Hip-hop'],
    description: 'A fictional club card showing how genres could appear in Explore.',
    offer: 'Example student offer: discounted entry before 10 pm.',
    action: 'Example only · not a real partner offer and cannot be redeemed.',
    diagramPosition: { x: 82, y: 68 },
  },
  {
    id: 'sample-venue-ouseburn',
    kind: 'venue',
    name: 'Sample music room · Ouseburn',
    district: 'Ouseburn',
    genres: ['Indie', 'Hip-hop'],
    description: 'A fictional small-venue listing for the Ouseburn area.',
    offer: 'Example student offer: 2-for-1 entry on a listed student night.',
    action: 'Example only · not a real partner offer and cannot be redeemed.',
    diagramPosition: { x: 25, y: 83 },
  },
];

export function buildExploreLocations({ currentDate = new Date(), configuredBenches = benches } = {}) {
  const installations = configuredBenches.map((bench) => {
    const session = resolveDailySession({
      benchId: bench.id,
      currentDate,
      configuredBenches,
      catalogue: [],
    });
    return {
      id: bench.id,
      kind: 'installation',
      name: bench.name,
      district: bench.location,
      genre: session.genre,
      description: `A configured FOOTBEAT installation in ${bench.location}.`,
      action: 'Open this bench’s existing QR session.',
      href: `/bench/${bench.id}`,
      diagramPosition: benchDiagramPositions[bench.id] ?? { x: 50, y: 50 },
    };
  });

  return [...installations, ...sampleVenues];
}

export function findExploreLocation(locations, locationId) {
  return locations.find((location) => location.id === locationId) ?? null;
}
