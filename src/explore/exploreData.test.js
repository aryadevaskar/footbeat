import test from 'node:test';
import assert from 'node:assert/strict';
import { benches } from '../benches/benchConfig.js';
import { buildExploreLocations, findExploreLocation, sampleVenues } from './exploreData.js';

test('Explore reuses configured bench IDs and resolves each genre for the supplied Newcastle date', () => {
  const locations = buildExploreLocations({ currentDate: new Date('2026-11-19T12:00:00Z') });
  const installations = locations.filter(({ kind }) => kind === 'installation');
  assert.deepEqual(installations.map(({ id }) => id), benches.map(({ id }) => id));
  assert.deepEqual(installations.map(({ genre }) => genre), ['pop', 'hip-hop', 'electronic']);
  for (const installation of installations) {
    assert.equal(installation.href, `/bench/${installation.id}`);
    assert.ok(installation.diagramPosition, 'schematic layout position should be present');
  }
});

test('Explore venue entries and offers are plainly disclosed as replaceable sample data', () => {
  assert.equal(sampleVenues.length, 3);
  for (const venue of sampleVenues) {
    assert.equal(venue.kind, 'venue');
    assert.match(venue.name, /^Sample /);
    assert.match(venue.action, /not a real partner offer/i);
    assert.ok(venue.genres.length > 0);
  }
});

test('marker selection resolves the selected location and handles unknown IDs', () => {
  const locations = buildExploreLocations({ currentDate: new Date('2026-11-19T12:00:00Z') });
  assert.equal(findExploreLocation(locations, benches[1].id).name, benches[1].name);
  assert.equal(findExploreLocation(locations, sampleVenues[0].id), sampleVenues[0]);
  assert.equal(findExploreLocation(locations, 'not-a-location'), null);
});
