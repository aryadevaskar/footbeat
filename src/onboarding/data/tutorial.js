import { zoneIds } from '../../data/zones.js';

export const tutorialStages = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'understand', label: 'The game' },
  { id: 'zones', label: 'Four zones' },
  { id: 'practice', label: 'Practice' },
  { id: 'complete', label: 'Ready' },
];

export const practiceExercises = [
  {
    title: 'One at a time',
    description: 'Find each zone once. Start wherever you like.',
    sequence: [zoneIds.leftFront, zoneIds.rightFront, zoneIds.leftBack, zoneIds.rightBack],
  },
  {
    title: 'Across the floor',
    description: 'Follow four cues as they move between your feet.',
    sequence: [zoneIds.leftFront, zoneIds.rightBack, zoneIds.rightFront, zoneIds.leftBack],
  },
  {
    title: 'Find your flow',
    description: 'A longer pattern with a few direction changes.',
    sequence: [zoneIds.rightBack, zoneIds.leftFront, zoneIds.leftBack, zoneIds.rightFront, zoneIds.leftFront, zoneIds.rightBack],
  },
];

