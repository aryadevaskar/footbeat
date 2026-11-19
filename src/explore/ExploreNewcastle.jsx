import { useMemo, useState } from 'react';
import { buildExploreLocations, findExploreLocation } from './exploreData.js';
import './explore.css';

function LocationCard({ location }) {
  if (!location) {
    return (
      <aside className="explore-location-card explore-location-card--empty" aria-live="polite">
        <p className="eyebrow">LOCATION DETAILS</p>
        <h2>Select a marker</h2>
        <p>Choose a FOOTBEAT installation or a sample music venue to see its details.</p>
      </aside>
    );
  }

  const isInstallation = location.kind === 'installation';
  return (
    <aside className="explore-location-card" aria-live="polite" aria-labelledby="explore-card-title">
      <p className="eyebrow">{isInstallation ? 'FOOTBEAT INSTALLATION' : 'SAMPLE MUSIC VENUE'}</p>
      <h2 id="explore-card-title">{location.name}</h2>
      <p className="explore-card-location">{location.district}</p>
      {isInstallation ? (
        <p className="explore-today-genre"><span>GENRE TODAY</span><strong>{location.genre}</strong></p>
      ) : (
        <div className="explore-tags" aria-label="Example genres">{location.genres.map((genre) => <span key={genre}>{genre}</span>)}</div>
      )}
      <p>{location.description}</p>
      {!isInstallation && <p className="explore-offer"><strong>{location.offer}</strong></p>}
      {isInstallation ? (
        <a className="tutorial-button tutorial-button--primary" href={location.href}>Open this bench <span aria-hidden="true">↗</span></a>
      ) : (
        <p className="explore-sample-note">{location.action}</p>
      )}
    </aside>
  );
}

export default function ExploreNewcastle({ onBack, currentDate }) {
  const locations = useMemo(() => buildExploreLocations({ currentDate }), [currentDate]);
  const [selectedId, setSelectedId] = useState(null);
  const selectedLocation = findExploreLocation(locations, selectedId);

  return (
    <section className="tutorial-stage explore-stage" aria-labelledby="explore-title">
      <button className="audio-back-button explore-back" type="button" onClick={onBack}>← <span>Back to FOOTBEAT</span></button>
      <header className="explore-heading">
        <p className="eyebrow"><span>NEWCASTLE · CITY GUIDE</span></p>
        <h1 id="explore-title">Explore<br /><span>Newcastle.</span></h1>
        <p className="stage-lede">Find FOOTBEAT installations and discover the music scene around the city.</p>
      </header>

      <div className="explore-layout">
        <div className="explore-map-column">
          <div className="explore-map-legend" aria-label="Map legend">
            <span><i className="explore-marker-swatch explore-marker-swatch--bench" aria-hidden="true" /> FOOTBEAT installation</span>
            <span><i className="explore-marker-swatch explore-marker-swatch--venue" aria-hidden="true" /> Sample music venue</span>
          </div>
          <div className="explore-schematic" role="group" aria-label="Schematic map of Newcastle. Marker placement is illustrative and not to geographic scale.">
            <svg className="explore-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d="M14 14 C32 22 27 39 45 45 S67 59 58 85" />
              <path d="M17 81 C35 66 41 55 51 42 S68 25 88 18" />
              <path d="M12 46 C32 48 43 57 59 57 S77 50 90 47" />
              <path d="M28 10 C37 26 38 38 31 53 S26 73 33 91" />
            </svg>
            <span className="explore-district-label explore-district-label--centre">CITY CENTRE</span>
            <span className="explore-district-label explore-district-label--quayside">QUAYSIDE</span>
            <span className="explore-district-label explore-district-label--ouseburn">OUSEBURN</span>
            {locations.map((location) => (
              <button
                key={location.id}
                type="button"
                className={`explore-map-marker explore-map-marker--${location.kind}${selectedId === location.id ? ' is-selected' : ''}`}
                style={{ '--marker-x': `${location.diagramPosition.x}%`, '--marker-y': `${location.diagramPosition.y}%` }}
                aria-pressed={selectedId === location.id}
                aria-label={`${location.kind === 'installation' ? 'FOOTBEAT installation' : 'Sample music venue'}: ${location.name}`}
                onClick={() => setSelectedId(location.id)}
              >
                <span className="explore-map-marker-icon" aria-hidden="true">{location.kind === 'installation' ? 'F' : '♪'}</span>
                <span className="explore-map-marker-label">{location.name.replace(/^(Sample (live venue|club|music room) · )/, '')}</span>
              </button>
            ))}
          </div>
          <p className="explore-map-disclaimer">Illustrative schematic · marker positions are not geographic. Venue listings and offers are sample data, not real partners.</p>
        </div>

        <LocationCard location={selectedLocation} />
      </div>
    </section>
  );
}
