export const zones = [
  { id: 'left-front', side: 'LEFT', depth: 'FRONT', position: 'front', key: 'Q', foot: 'Left foot', placement: 'the front of your left platform' },
  { id: 'right-front', side: 'RIGHT', depth: 'FRONT', position: 'front', key: 'O', foot: 'Right foot', placement: 'the front of your right platform' },
  { id: 'left-back', side: 'LEFT', depth: 'BACK', position: 'back', key: 'A', foot: 'Left foot', placement: 'the rear of your left platform' },
  { id: 'right-back', side: 'RIGHT', depth: 'BACK', position: 'back', key: 'P', foot: 'Right foot', placement: 'the rear of your right platform' },
];

const findZoneId = (side, position) => zones.find((zone) => zone.side.toLowerCase() === side && zone.position === position).id;

export const zoneIds = {
  leftFront: findZoneId('left', 'front'),
  rightFront: findZoneId('right', 'front'),
  leftBack: findZoneId('left', 'back'),
  rightBack: findZoneId('right', 'back'),
};
